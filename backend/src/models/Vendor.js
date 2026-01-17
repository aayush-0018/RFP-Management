const mongoose = require('mongoose');

const VendorSchema = new mongoose.Schema(
    {
        name: String,
        email: String,
        notes: String,
    },
    { timestamps: true }
);

module.exports = mongoose.model('Vendor', VendorSchema);
