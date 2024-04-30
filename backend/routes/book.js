const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');
const auth = require('../middleware/auth');
const multer = require('../middleware/multer-config');
const sharpResize = require('../middleware/sharp');

// Route logic
router.post('/', auth, multer, sharpResize, bookController.createBook);
router.get('/', bookController.readBooks);
router.put('/:id', auth, multer, sharpResize, bookController.modifyBook);
router.post('/:id/rating', auth, bookController.postBestRating);
router.get('/bestrating', bookController.getBestRating);
router.get('/:id', bookController.readBook);
router.delete('/:id', auth, bookController.deleteBook);

module.exports = router;
