const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();


connectDB();

console.log('MONGO_URI:', process.env.MONGO_URI);


const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/rfps', require('./routes/rfp.routes'));
app.use('/api/vendors', require('./routes/vendor.routes'));
app.use('/api/proposals', require('./routes/proposal.routes'));
app.use('/api/emails', require('./routes/email.routes'));

app.get('/', (req, res) => {
    res.send('AI RFP Management API running');
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
