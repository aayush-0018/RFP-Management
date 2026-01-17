const router = require('express').Router();
const Proposal = require('../models/Proposal');
const Rfp = require('../models/Rfp');
const { compareProposals } = require('../services/ai.service');

router.get('/:rfpId', async (req, res) => {
    try {
        const { rfpId } = req.params;
        const proposals = await Proposal.find({ rfpId }).populate('vendorId', 'name email');
        proposals.sort((a, b) => {
            const aHasScore = a.aiScore != null;
            const bHasScore = b.aiScore != null;
            if (aHasScore && bHasScore) {
                return b.aiScore - a.aiScore;
            } else if (aHasScore && !bHasScore) {
                return -1; 
            } else if (!aHasScore && bHasScore) {
                return 1; 
            } else {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });
        res.json(proposals);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch proposals' });
    }
});

router.post('/:rfpId/compare', async (req, res) => {
    try {
        const { rfpId } = req.params;
        const { proposalIds } = req.body;

        if (!proposalIds || !Array.isArray(proposalIds) || proposalIds.length < 2) {
            return res.status(400).json({ error: 'At least 2 proposal IDs required' });
        }

        // Fetch RFP requirements
        const rfp = await Rfp.findById(rfpId);
        if (!rfp) {
            return res.status(404).json({ error: 'RFP not found' });
        }

        // Fetch selected proposals
        const proposals = await Proposal.find({
            _id: { $in: proposalIds },
            rfpId
        }).populate('vendorId', 'name email');

        if (proposals.length !== proposalIds.length) {
            return res.status(404).json({ error: 'Some proposals not found' });
        }

        // Generate comparison using AI
        const comparison = await compareProposals(proposals, rfp.structuredRequirements);

        res.json(comparison);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to compare proposals' });
    }
});

module.exports = router;
