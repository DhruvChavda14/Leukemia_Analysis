import mongoose from "mongoose";

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
    } catch (err) {
        console.error("MongoDB connection error:", err.message);
        process.exit(1);
    }
};

mongoose.connection.on('connected', () => {
    console.log('Mongoose: MongoDB connection established.');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose: MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.warn('Mongoose: MongoDB connection lost.');
});

export default connectDB;
