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
    imageUrl: `${req.protocol}://${req.get('host')}/images/${req.file.filename}`,
  });

  // Save the new book to the database
  newBook
    .save()
    .then(() => res.status(201).json({ message: 'Livre enregistré' }))
    .catch((error) => res.status(400).json({ error }));
};

/**
 * Retrieve all books from your database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.readBooks = (req, res, next) => {
  Book.find()
    .then((books) => {
      res.status(200).json(books);
    })
    .catch((error) => res.status(400).json({ error }));
};

/**
 * Retrieve a specific book based on its identifier in a database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.readBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => res.status(200).json(book))
    .catch((error) => res.status(404).json({ error }));
};

/**
 * Modify a book in the database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.modifyBook = (req, res, next) => {
  // Create an object from book data in an HTTP request
  let bookObject = getBookObjectFromRequestHttp(req);
  const bookId = req.params.id;

  Book.findOne({ _id: bookId })
    .then((book) => {
      if (isAuthorized(book, req.auth.userId)) {
        // If a new image is provided in the request, delete the old image from the server before updating the book data
        if (req.file) {
          removeFile(getFileFromBook(book), updateBook(bookId, bookObject, res));
        } else {
          updateBook(bookId, bookObject, res);
        }
      } else {
        res.status(403).json({ message: '403: unauthorized request' });
      }
    })
    .catch((error) => res.status(400).json({ error }));
};

/**
 * Delete a specific book from the database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.deleteBook = (req, res, next) => {
  Book.findOne({ _id: req.params.id })
    .then((book) => {
      if (isAuthorized(book, req.auth.userId)) {
        removeBook(book, res);
      } else {
        res.status(401).json({ message: 'Not authorized' });
      }
    })
    .catch((error) => res.status(500).json({ error }));
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
      res.status(200).json({ message: 'La note doit être comprise entre 1 et 5' });
      return;
    }

    const existingRating = await Book.findOne({ _id: bookId, 'ratings.userId': userId });
    if (existingRating) {
      res.status(403).json({ message: 'Not authorized' });
      return;
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
exports.getBestRating = async (req, res, next) => {
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
 * Remove a book from the database and its associated image from the file system
 * @param {*} book The boook to delete
 * @param {*} res Returns a JSON response with a message
 */
function removeBook(book, res) {
  removeFile(getFileFromBook(book), deleteBook(book, res));
}

/**
 * Delete a file from the file system
 * @param {*} filename The file to remove
 * @param {*} callback The callback function
 */
function removeFile(filename, callback) {
  fs.unlink(`images/${filename}`, (error) => {
    if (error) {
      console.log(error);
    } else {
      callback;
    }
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
 * Delete a book from the database without deleting the image file from the file system
 * @param {*} book The book to delete
 * @param {*} res Returns a JSON response with a message
 */
function deleteBook(book, res) {
  Book.deleteOne({ _id: book._id })
    .then(() => res.status(200).json({ message: 'Livre supprimé' }))
    .catch((error) => res.status(401).json({ error }));
}

/**
 * Update book information in database
 * @param {*} bookId Book id
 * @param {*} bookObject New data
 * @param {*} res Returns a JSON response with a message
 */
function updateBook(bookId, bookObject, res) {
  Book.updateOne({ _id: bookId }, { ...bookObject, _id: bookId })
    .then(() => res.status(200).json({ message: 'Livre modifié' }))
    .catch((error) => res.status(401).json({ error }));
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
