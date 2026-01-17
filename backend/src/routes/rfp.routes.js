const router = require('express').Router();
const Rfp = require('../models/Rfp');
const Vendor = require('../models/Vendor');
const Proposal = require('../models/Proposal');
const { parseRfpFromNaturalLanguage, evaluateProposals } = require('../services/ai.service');
const { sendRfpEmail } = require('../services/email.service');

router.post('/', async (req, res) => {
    try {
        const { prompt } = req.body;
        console.log('Received prompt:', prompt);
        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const structured = await parseRfpFromNaturalLanguage(prompt);

        const rfp = new Rfp({
            title: structured.title,
            rawPrompt: prompt,
            structuredRequirements: structured,
        });

        await rfp.save();
        res.status(201).json(rfp);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create RFP' });
    }
});

router.get('/', async (req, res) => {
    try {
        const rfps = await Rfp.find().sort({ createdAt: -1 });
        res.json(rfps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch RFPs' });
    }
});

router.post('/:id/send', async (req, res) => {
    try {
        const { id } = req.params;
        const { selectedVendors } = req.body;
        const rfp = await Rfp.findById(id);
        if (!rfp) {
            return res.status(404).json({ error: 'RFP not found' });
        }

        let vendors;
        if (selectedVendors && selectedVendors.length > 0) {
            vendors = await Vendor.find({ _id: { $in: selectedVendors } });
        } else {
            vendors = await Vendor.find();
        }

        if (vendors.length === 0) {
            return res.status(400).json({ error: 'No vendors found' });
        }

        const formatRfpContent = (structuredRequirements) => {
            let content = `Title: ${structuredRequirements.title}\n\n`;
            content += `Items Required:\n`;
            structuredRequirements.items.forEach((item, index) => {
                content += `${index + 1}. ${item.name} - Quantity: ${item.quantity}, Specifications: ${item.specifications}\n`;
            });
            content += `\nBudget: ${structuredRequirements.budget}\n`;
            content += `Delivery Timeline: ${structuredRequirements.deliveryTimeline}\n`;
            content += `Payment Terms: ${structuredRequirements.paymentTerms}\n`;
            content += `Warranty: ${structuredRequirements.warranty}\n`;
            if (structuredRequirements.otherRequirements) {
                content += `Other Requirements: ${structuredRequirements.otherRequirements}\n`;
            }
            return content;
        };

        const emailPromises = vendors.map(vendor =>
            sendRfpEmail({
                to: vendor.email,
                subject: `RFP: ${rfp.title}`,
                text: `Dear ${vendor.name},\n\nWe are pleased to invite you to submit a proposal for the following RFP:\n\n${formatRfpContent(rfp.structuredRequirements)}\n\nPlease respond to this email with your proposal.\n\nBest regards,\nProcurement Team`,
            })
        );

        await Promise.all(emailPromises);

        rfp.status = 'SENT';
        await rfp.save();

        res.json({ message: `RFP sent to ${vendors.length} vendor(s)` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send RFP' });
    }
});

router.post('/:id/evaluate', async (req, res) => {
    try {
        const { id } = req.params;
        const rfp = await Rfp.findById(id);
        if (!rfp) {
            return res.status(404).json({ error: 'RFP not found' });
        }

        const proposals = await Proposal.find({ rfpId: id }).populate('vendorId', 'name email');
        if (proposals.length === 0) {
            return res.status(400).json({ error: 'No proposals found for this RFP' });
        }

        const evaluations = await evaluateProposals(proposals, rfp.structuredRequirements);

        for (let i = 0; i < proposals.length; i++) {
            proposals[i].aiSummary = evaluations[i].summary;
            proposals[i].aiScore = evaluations[i].score;
            await proposals[i].save();
        }

        res.json({ evaluations });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to evaluate proposals' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { prompt } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required' });
        }

        const rfp = await Rfp.findById(id);
        if (!rfp) {
            return res.status(404).json({ error: 'RFP not found' });
        }

        const structured = await parseRfpFromNaturalLanguage(prompt);

        rfp.title = structured.title;
        rfp.rawPrompt = prompt;
        rfp.structuredRequirements = structured;

        await rfp.save();
        res.json(rfp);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update RFP' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const rfp = await Rfp.findByIdAndDelete(id);
        if (!rfp) {
            return res.status(404).json({ error: 'RFP not found' });
        }

        // Also delete associated proposals
        await Proposal.deleteMany({ rfpId: id });

        res.json({ message: 'RFP and associated proposals deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete RFP' });
    }
});

module.exports = router;
