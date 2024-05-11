const { throws } = require('assert');
const Book = require('../models/book');
const fs = require('fs');

/**
 * Acreate and add a new book to the database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.createBook = async (req, res, next) => {
  const bookObject = JSON.parse(req.body.book);

  // Remove false IDs
  delete bookObject._id;
  delete bookObject.userId;

  const newBook = new Book({
    ...bookObject,
    userId: req.auth.userId,
    ratings: [{}],
    averageRating: 0,
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });

  // Save the new book to the database
  try {
    await newBook.save();
    res.status(201).json({ message: `${newBook.title} added` });
  } catch (error) {
    res.status(400).json({ error });
  }
};

/**
 * Retrieve all books from your database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.readBooks = async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    res.status(400).json({ error });
  }
};

/**
 * Retrieve a specific book based on its identifier in a database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.readBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (error) {
    res.status(400).json({ error });
  }
};

/**
 * Modify a book in the database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.modifyBook = async (req, res, next) => {
  // Create an object from book data in an HTTP request
  let bookObject = getBookObjectFromRequestHttp(req);
  const bookId = req.params.id;
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (!isAuthorized(book, req.auth.userId)) {
      return res.status(403).json({ error: '403: unauthorized request' });
    }

    // Update book information in database
    await Book.updateOne({ _id: bookId }, { ...bookObject, _id: bookId });
    // If a new image is provided in the request, delete the old image from the server before updating the book data
    if (req.file) {
      await removeFile(getFileFromBook(book));
    }
    res.status(200).json({ message: 'Book updated' });
  } catch (error) {
    res.status(400).json({ error });
  }
};

/**
 * Delete a specific book from the database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (!isAuthorized(book, req.auth.userId)) {
      return res.status(403).json({ error: '403: unauthorized request' });
    }

    await removeFile(getFileFromBook(book));
    await Book.deleteOne({ _id: book._id });
    res.status(200).json({ message: 'Book deleted' });
  } catch (error) {
    res.status(500).json({ error });
  }
};

/**
 * Create and add a new review to a book and update its average rating.
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 * @returns
 */
exports.postBestRating = async (req, res, next) => {
  const bookId = req.params.id;
  const userId = req.body.userId;
  const rating = req.body.rating;

  try {
    if (rating < 1 || rating > 5) {
      return res.status(200).json({ message: 'The rating must be between 1 and 5' });
    }

    const existingRating = await Book.findOne({ _id: bookId, 'ratings.userId': userId });
    if (existingRating) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Add a new rating to the book
    const updatedBook = await Book.findByIdAndUpdate(
      bookId,
      {
        $push: {
          ratings: {
            userId: userId,
            grade: rating,
          },
        },
      },
      { new: true, upsert: true },
    );

    // Compute the average
    const match = {
      $match: { $expr: { $eq: ['$_id', { $toObjectId: bookId }] } },
    };
    const unwind = { $unwind: '$ratings' };
    const group = { $group: { _id: '$_id', averageRating: { $avg: '$ratings.grade' } } };
    const avg = await Book.aggregate([match, unwind, group]);
    const roundedAverageRating = avg[0].averageRating.toFixed(1);
    await Book.findByIdAndUpdate(bookId, { $set: { averageRating: roundedAverageRating } });
    updatedBook.averageRating = roundedAverageRating;

    res.status(200).json(updatedBook);
  } catch (error) {
    res.status(400).json({ error });
  }
};

/**
 * Retrieve the top three books based on their average rating
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.readBestRating = async (req, res, next) => {
  try {
    const topBooks = await Book.find()
      .sort({ averageRating: -1 }) // Sort books in descending order of average rating
      .limit(3);
    res.status(200).json(topBooks);
  } catch (error) {
    res.status(400).json({ error });
  }
};

/**
 * Check if the user passed as a parameter is authorized to modify the book
 * @param {*} book the book
 * @param {*} userId the user id
 * @returns
 */
function isAuthorized(book, userId) {
  return book.userId === userId;
}

/**
 * Delete a file from the file system
 * @param {*} filename The file to remove
 */
function removeFile(filename) {
  if (!fs.existsSync(filename)) {
    return;
  }

  return new Promise((resolve, reject) => {
    fs.unlink(`images/${filename}`, (error) => {
      if (error) reject(error);
      resolve(`${filename} deleted`);
    });
  });
}

/**
 * Extract file name from book image url
 * @param {*} book The book
 * @returns
 */
function getFileFromBook(book) {
  return book.imageUrl.split('/images/')[1];
}

/**
 * Create an object from book data in an HTTP request
 * @param {*} req The HTTP query containing the data of a book
 * @returns Return an object with data from book
 */
function getBookObjectFromRequestHttp(req) {
  let bookObject;

  // If the request contains a file, extract book data from request body and add image url
  if (req.file) {
    bookObject = {
      ...JSON.parse(req.body.book),
      imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
    };
  } else {
    bookObject = { ...req.body };
  }
  return bookObject;
}
