const mongoose = require('mongoose');

const RfpSchema = new mongoose.Schema(
    {
        title: String,
        rawPrompt: String,
        structuredRequirements: Object,
        status: {
            type: String,
            enum: ['DRAFT', 'SENT', 'RESPONSES_RECEIVED', 'DECIDED'],
            default: 'DRAFT',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('Rfp', RfpSchema);
