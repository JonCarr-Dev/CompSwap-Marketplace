require('dotenv').config();
console.log('Environment:', process.env.NODE_ENV);
const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const uri =
      process.env.NODE_ENV === 'test'
        ? 'mongodb://localhost:27017/test_db'
        : 'mongodb://localhost:27017/compswap-marketplace';

    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;