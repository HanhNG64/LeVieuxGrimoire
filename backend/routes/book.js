const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');

// Route logic
router.post('/', auth, multer, bookController.addBook);
router.get('/', bookController.getBooks);
router.put('/:id', auth, multer, bookController.modifyBook);
router.post('/:id/rating', auth, bookController.postBestRating);
router.get('/bestrating', bookController.getBestRating);
router.get('/:id', bookController.getBook);
router.delete('/:id', auth, bookController.deleteBook);

module.exports = router;
