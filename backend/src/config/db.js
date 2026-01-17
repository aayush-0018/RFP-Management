const mongoose = require('mongoose');

// const connectDB = async () => {
//     try {
//         await mongoose.connect(process.env.MONGO_URI);
//         console.log('MongoDB Atlas connected');
//     } catch (error) {
//         console.error('MongoDB connection failed:', error.message);
//         process.exit(1);
//     }
// };

const connectDB = async () => {
    const uri = process.env.MONGO_URI;
    if (!uri) throw new Error("MONGO_URI not set in environment (.env)");

    try {
        mongoose.set("strictQuery", false);
        await mongoose.connect(uri, {
            // use recommended defaults for mongoose v7+
        });
        console.log("🗄️  MongoDB connected");
    } catch (e) {
        console.error("MongoDB connection error:", e);
        // Don't throw to allow server to start even if DB fails
    }
};

module.exports = connectDB;
