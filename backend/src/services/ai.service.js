const OpenAI = require('openai');

const openrouter = new OpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: 'https://openrouter.ai/api/v1',
    defaultHeaders: {
        'HTTP-Referer': 'http://localhost:5001',
        'X-Title': 'AI RFP Management System',
    },
});

// ----------------------------
// Helper: safe JSON parsing
// ----------------------------
function safeJsonParse(text) {
    const cleaned = text
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();

    return JSON.parse(cleaned);
}

async function parseRfpFromNaturalLanguage(prompt) {
    try {
        const completion = await openrouter.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: `
You are an AI assistant that converts natural language procurement requests
into STRICT JSON.

Return ONLY valid JSON. No markdown. No explanations.

Schema:
{
  "title": string,
  "items": [{ "name": string, "quantity": number, "specifications": string }],
  "budget": number | null,
  "deliveryTimeline": string | null,
  "paymentTerms": string | null,
  "warranty": string | null,
  "otherRequirements": string | null
}
          `,
                },
                { role: 'user', content: prompt },
            ],
        });

        const text = completion.choices[0].message.content;
        return safeJsonParse(text);
    } catch (error) {
        console.error('Error parsing RFP:', error);
        throw new Error('Failed to parse RFP');
    }
}

async function extractProposalFacts(proposal) {
    const completion = await openrouter.chat.completions.create({
        model: 'openai/gpt-oss-20b',
        temperature: 0,
        messages: [
            {
                role: 'system',
                content: `
Extract factual numeric data from the proposal.

Return ONLY valid JSON:
{
  "totalPrice": number | null,
  "deliveryDays": number | null,
  "warrantyYears": number | null
}
If information is missing, use null.
                `,
            },
            {
                role: 'user',
                content: proposal.rawEmailContent,
            },
        ],
    });

    return safeJsonParse(completion.choices[0].message.content);
}


async function evaluateSingleProposal(proposal, rfpRequirements) {
    try {
        const completion = await openrouter.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: `
You are an expert procurement analyst.

You MUST compute explicit numeric subscores and then sum them.
Do NOT round generously.
Different proposals MUST result in different scores unless they are effectively identical.

Scoring Rules (STRICT):
- Requirement Match: 0–40
  - Missing any required item, quantity, or specification → subtract 5–15 points
- Clarity & Completeness: 0–20
  - Vague pricing, timelines, or unclear commitments → subtract 3–8 points
- Feasibility & Risk: 0–20
  - Unclear delivery plan, weak warranty, or operational risk → subtract 3–10 points
- Value for Money: 0–20
  - Over budget or poor value justification → subtract 5–15 points
  - Missing pricing entirely → score 0 here

You MUST return subscores and total.

Return ONLY valid JSON in this EXACT schema:
{
  "breakdown": {
    "requirementMatch": number,
    "clarity": number,
    "feasibility": number,
    "valueForMoney": number
  },
  "score": number,
  "summary": string,
  "recommendation": "Accept" | "Reject" | "Consider"
}

The final score MUST equal the sum of all breakdown fields.
                    `,
                },
                {
                    role: 'user',
                    content: `
RFP Requirements:
${JSON.stringify(rfpRequirements, null, 2)}

Proposal Content:
${proposal.rawEmailContent}
                    `,
                },
            ],
        });

        const text = completion.choices[0].message.content;
        return safeJsonParse(text);
    } catch (error) {
        console.error('Error evaluating single proposal:', error);
        throw new Error('Failed to evaluate proposal');
    }
}

function applyCompetitiveDeductions(baseScore, facts, benchmarks) {
    let score = baseScore;
    const reasons = [];

    // ----- PRICE -----
    if (
        facts.totalPrice != null &&
        benchmarks.lowestPrice != null &&
        facts.totalPrice > benchmarks.lowestPrice
    ) {
        const diffRatio =
            (facts.totalPrice - benchmarks.lowestPrice) /
            benchmarks.lowestPrice;

        let penalty = 0;
        if (diffRatio > 0.15) penalty = 8;
        else if (diffRatio > 0.10) penalty = 6;
        else if (diffRatio > 0.05) penalty = 4;
        else penalty = 2;

        score -= penalty;
        reasons.push(`Higher pricing than lowest bidder (−${penalty})`);
    }

    // ----- DELIVERY -----
    if (
        facts.deliveryDays != null &&
        benchmarks.fastestDelivery != null &&
        facts.deliveryDays > benchmarks.fastestDelivery
    ) {
        const delay = facts.deliveryDays - benchmarks.fastestDelivery;

        let penalty = delay > 10 ? 5 : delay > 5 ? 3 : 1;
        score -= penalty;
        reasons.push(`Slower delivery timeline (−${penalty})`);
    }

    // ----- WARRANTY -----
    if (
        facts.warrantyYears != null &&
        benchmarks.longestWarranty != null &&
        facts.warrantyYears < benchmarks.longestWarranty
    ) {
        const gap = benchmarks.longestWarranty - facts.warrantyYears;
        const penalty = gap >= 2 ? 7 : 4;

        score -= penalty;
        reasons.push(`Shorter warranty period (−${penalty})`);
    }

    // ----- CAP PERFECT SCORE -----
    if (score >= 100) score = 97;

    return {
        finalScore: Math.max(score, 0),
        deductionReasons: reasons,
    };
}


function buildFinalSummary(baseSummary, deductionReasons) {
    if (!deductionReasons.length) {
        return baseSummary + ' No competitive disadvantages were identified.';
    }

    return (
        baseSummary +
        ' Competitive considerations: ' +
        deductionReasons.join('; ') +
        '.'
    );
}


async function evaluateProposals(proposals, rfpRequirements) {
    try {
        const evaluations = [];

        // 1. Extract proposal facts
        for (const proposal of proposals) {
            proposal._facts = await extractProposalFacts(proposal);
        }

        // 2. Compute benchmarks
        const benchmarks = {
            lowestPrice: Math.min(
                ...proposals
                    .map(p => p._facts.totalPrice)
                    .filter(v => v != null)
            ),
            fastestDelivery: Math.min(
                ...proposals
                    .map(p => p._facts.deliveryDays)
                    .filter(v => v != null)
            ),
            longestWarranty: Math.max(
                ...proposals
                    .map(p => p._facts.warrantyYears)
                    .filter(v => v != null)
            ),
        };

        // 3. LLM evaluation + deterministic deductions
        for (const proposal of proposals) {
            const evaluation = await evaluateSingleProposal(
                proposal,
                rfpRequirements
            );

            const { finalScore, deductionReasons } =
                applyCompetitiveDeductions(
                    evaluation.score,
                    proposal._facts,
                    benchmarks
                );

            const finalSummary = buildFinalSummary(
                evaluation.summary,
                deductionReasons
            );

            evaluations.push({
                ...evaluation,
                score: finalScore,
                summary: finalSummary,
            });
        }


        return evaluations;
    } catch (error) {
        console.error('Error evaluating proposals:', error);
        throw new Error('Failed to evaluate proposals');
    }
}


async function compareProposals(proposals, rfpRequirements) {
    try {
        const completion = await openrouter.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: `
You are an expert procurement analyst tasked with comparing multiple vendor proposals.

Provide a final verdict on which vendor should be selected and why.

Return ONLY valid JSON with this schema:
{
  "verdict": "string - the recommended vendor or final decision",
  "justification": "string - brief explanation of the decision"
}
                    `,
                },
                {
                    role: 'user',
                    content: `
RFP Requirements:
${JSON.stringify(rfpRequirements, null, 2)}

Proposals to Compare:
${JSON.stringify(proposals, null, 2)}

Please provide a final verdict on which vendor to select and why.
                    `,
                },
            ],
        });

        const text = completion.choices[0].message.content;
        return safeJsonParse(text);
    } catch (error) {
        console.error('Error comparing proposals:', error);
        throw new Error('Failed to compare proposals');
    }
}

module.exports = {
    parseRfpFromNaturalLanguage,
    evaluateProposals,
    compareProposals,
};
