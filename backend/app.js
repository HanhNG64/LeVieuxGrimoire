const express = require('express');
const bookRoute = require('./routes/book.js');
const userRoute = require('./routes/user.js');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');

// Allow the Express application to process JSON data from requests
const app = express();
app.use(express.json());

// CORS configuration and allow cross-origin queries
const options = {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization',
};
app.use(cors(options));

// Secure HTTP headers against XSS attacks and allow cross-origin queries
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

// Create the images directory to store images
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

app.use('/api/auth', userRoute);
app.use('/api/books', bookRoute);
app.use('/images', express.static(path.join(__dirname, 'images')));

module.exports = app;
