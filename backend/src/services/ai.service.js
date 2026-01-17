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

async function evaluateProposals(proposals, rfpRequirements) {
    try {
        const completion = await openrouter.chat.completions.create({
            model: 'openai/gpt-oss-20b',
            temperature: 0,
            messages: [
                {
                    role: 'system',
                    content: `
You are an expert procurement analyst responsible for evaluating vendor proposals
against a given RFP in a fair, consistent, and explainable manner.

Evaluation Rules (IMPORTANT):
1. Evaluate EACH proposal independently first, then score them RELATIVELY.
2. Score proposals on a scale of 0–100 using the following weighted criteria:
   - Requirement Match (40%): How closely the proposal satisfies technical, quantity,
     delivery, payment, and warranty requirements.
   - Clarity & Completeness (20%): How clearly and completely the vendor explains
     their offer, pricing, timelines, and commitments.
   - Feasibility & Risk (20%): Likelihood of successful delivery within timeline,
     clarity of warranty/support, and operational reliability.
   - Value for Money (20%): Perceived value relative to budget and other proposals,
     not just lowest cost.

3. Scores MUST be comparative:
   - The best proposal should score higher than others.
   - Do NOT give all proposals similar scores unless they are genuinely equivalent.
   - Use the full range of scores where appropriate.

4. Recommendation logic:
   - "Accept": Clearly meets requirements and is among the top performers.
   - "Consider": Meets most requirements but has notable trade-offs or risks.
   - "Reject": Fails to meet key requirements or is clearly weaker than others.

5. Be strict and realistic. Avoid overly generous scoring.
6. Base your evaluation ONLY on the provided proposal content and RFP requirements.
7. Do NOT invent missing information. Penalize unclear or missing details.

Return ONLY a JSON array with this exact schema:
[
  {
    "score": number,
    "summary": string,
    "recommendation": "Accept" | "Reject" | "Consider"
  }
]

          `,
                },
                {
                    role: 'user',
                    content: `
RFP Requirements:
${JSON.stringify(rfpRequirements, null, 2)}

Proposals:
${JSON.stringify(proposals, null, 2)}
          `,
                },
            ],
        });

        const text = completion.choices[0].message.content;
        return safeJsonParse(text);
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
