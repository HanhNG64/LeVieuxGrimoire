const express = require('express');
const bookRoute = require('./routes/book.js');
const userRoute = require('./routes/user.js');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');

// Allow the Express application to process JSON data from requests
const app = express();
app.use(express.json());

// Secure HTTP headers against XSS attacks
app.use(helmet());
// Enable CORS configuration with Helmet.js and allow cross-origin queries
app.use(
  helmet.crossOriginResourcePolicy({
    policy: 'cross-origin',
  }),
);

// Configure CORS headers to allow access to the API from any origin
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  next();
});

// Create the images directory to store images
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

app.use('/api/auth', userRoute);
app.use('/api/books', bookRoute);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;
