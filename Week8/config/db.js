const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Use only the local MongoDB connection without authentication
    // const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/week8_app';
    const mongoURI = 'mongodb://localhost:27017/week8_app';

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;