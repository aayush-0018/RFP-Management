const mongoose = require('mongoose');

const ProposalSchema = new mongoose.Schema(
    {
        rfpId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Rfp',
        },
        vendorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Vendor',
        },
        rawEmailContent: String,
        extractedData: Object,
        aiSummary: String,
        aiScore: Number,
    },
    { timestamps: true }
);

module.exports = mongoose.model('Proposal', ProposalSchema);
