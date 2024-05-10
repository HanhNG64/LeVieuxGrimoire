const mongoose = require('mongoose');

const connectDB = async () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Connection to MongoDB successful!'))
    .catch(() => {
      console.log('Connection to MongoDB failed!');
    });
};

module.exports = connectDB;
