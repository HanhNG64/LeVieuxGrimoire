const express = require('express');
const app = express();
const bookRoute = require('./routes/book.js');
const userRoute = require('./routes/user.js');

// Configure CORS headers to allow access to the API from any origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Allow the Express application to process JSON data from requests
app.use(express.json());

app.use('/api/books', bookRoute);
app.use('/api/auth', userRoute);

module.exports = app;
