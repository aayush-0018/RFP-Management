const router = require('express').Router();
const { fetchUnreadEmails } = require('../services/email-receiver.service');
const Vendor = require('../models/Vendor');
const Proposal = require('../models/Proposal');
const Rfp = require('../models/Rfp');

router.post('/poll', async (req, res) => {
    try {
        const emails = await fetchUnreadEmails();

        const processedEmails = [];

        for (const email of emails) {
            const vendor = await Vendor.findOne({ email: email.from.toLowerCase() });
            if (!vendor) {
                console.log(`Vendor not found for email: ${email.from}`);
                continue;
            }

            const latestRfp = await Rfp.findOne().sort({ createdAt: -1 });
            if (!latestRfp) {
                console.log('No RFP found');
                continue;
            }

            const existingProposal = await Proposal.findOne({ vendorId: vendor._id, rfpId: latestRfp._id });
            if (existingProposal) {
                console.log('Proposal already exists');
                continue;
            }

            const proposal = new Proposal({
                rfpId: latestRfp._id,
                vendorId: vendor._id,
                rawEmailContent: email.text,
                extractedData: {},
            });

            await proposal.save();
            processedEmails.push(proposal);
        }

        res.json({ message: `Processed ${processedEmails.length} emails`, proposals: processedEmails });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to poll emails' });
    }
});

module.exports = router;