const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

router.post('/', bookController.postBooks);
router.get('/', bookController.getBooks);
router.post('/:id', bookController.putBook);
router.post('/:id/rating', bookController.postBestRating);
router.get('/bestrating', bookController.getBestRating);
router.get('/:id', bookController.getBook);
router.delete('/:id', bookController.deleteBook);

module.exports = router;
