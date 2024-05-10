const express = require('express');
const bookRoute = require('./routes/book.js');
const userRoute = require('./routes/user.js');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const cors = require('cors');
const rateLimiter = require('express-rate-limit');
const multer = require('multer');

// Allow the Express application to process JSON data from requests
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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

// Rate limiter
const limiter = rateLimiter({
  max: 100, // Max requests
  windowMS: 5 * 60 * 5000, // Time
  message: 'Réessayer plus tard',
  standardHeaders: false,
  legacyHeaders: false,
});
app.use(limiter);

// Create the images directory to store images
const imagesDir = path.join(__dirname, 'images');
if (!fs.existsSync(imagesDir)) {
  fs.mkdirSync(imagesDir);
}

// Route logic
app.use('/api/auth', userRoute);
app.use('/api/books', bookRoute);
app.use('/images', express.static(path.join(__dirname, 'images')));

// Middleware to handle errors
const errorHandler = (err, req, res, next) => {
  // Check if a file size error
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'The image size is too large.', err });
  }
  next(err);
};
app.use(errorHandler);

module.exports = app;
