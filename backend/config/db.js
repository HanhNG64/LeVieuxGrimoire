const mongoose = require('mongoose');

const connectDB = async () => {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => console.log('Connexion a MongoDB réussi !'))
    .catch(() => {
      console.log('Connexion a MongoDB échoué !');
    });
};

module.exports = connectDB;
