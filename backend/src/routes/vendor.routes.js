const router = require('express').Router();
const Vendor = require('../models/Vendor');

router.post('/', async (req, res) => {
    try {
        const { name, email, notes } = req.body;
        console.log('Creating vendor with data:', req.body);
        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const vendor = new Vendor({ name, email, notes });
        await vendor.save();
        res.status(201).json(vendor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create vendor' });
    }
});

router.get('/', async (req, res) => {
    try {
        const vendors = await Vendor.find().sort({ createdAt: -1 });
        res.json(vendors);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch vendors' });
    }
});

router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, notes } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Name and email are required' });
        }

        const vendor = await Vendor.findByIdAndUpdate(
            id,
            { name, email, notes },
            { new: true, runValidators: true }
        );

        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        res.json(vendor);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update vendor' });
    }
});

router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const vendor = await Vendor.findByIdAndDelete(id);
        if (!vendor) {
            return res.status(404).json({ error: 'Vendor not found' });
        }

        res.json({ message: 'Vendor deleted successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete vendor' });
    }
});

module.exports = router;
