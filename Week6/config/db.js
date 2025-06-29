const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // MongoDB connection string - replace with your own or use environment variable
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/crud_app';
    
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