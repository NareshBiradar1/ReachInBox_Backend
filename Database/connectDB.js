const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
    if (isConnected) {
        console.log('Using existing database connection');
        return;
    }

    try {

        mongoose.connect(process.env.MONGO_URL)
            .then(() => {
                console.log("Connected to MongoDB");
            })
            .catch((err) => {
                console.log(err);
            });

        isConnected = true;
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

module.exports = { connectDB };