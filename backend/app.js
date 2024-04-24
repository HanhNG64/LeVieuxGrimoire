const express = require('express');
const bookRoute = require('./routes/book.js');
const userRoute = require('./routes/user.js');
const mongoose = require('mongoose');
const path = require('path');

// Connection to the database
mongoose
  .connect('mongodb+srv://hanh:hanh64@cluster0.vva8503.mongodb.net/test?retryWrites=true&w=majority', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connexion à MongoDB réussie !'))
  .catch(() => console.log('Connexion à MongoDB échouée !'));

// Allow the Express application to process JSON data from requests
const app = express();
app.use(express.json());

// Configure CORS headers to allow access to the API from any origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

app.use('/api/auth', userRoute);
app.use('/api/books', bookRoute);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;
