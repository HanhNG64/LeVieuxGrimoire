const multer = require('multer');

const MIME_TYPES = {
  'image/jpg': 'jpg',
  'image/jpeg': 'jpeg',
  'image/png': 'png',
  'image/webp': 'webp',
};

const IMG_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, 'images');
  },
  filename: (req, file, callback) => {
    let name = 'original_' + file.originalname.split(' ').join('_');
    name = name.split('.')[0];
    const extension = MIME_TYPES[file.mimetype];
    callback(null, name + Date.now() + '.' + extension);
  },
});

module.exports = multer({ storage: storage, limits: { fileSize: MAX_SIZE } }).single('image');

module.exports.validateImage = (req, res, next) => {
  if (req.file) {
    const imageFile = req.file;
    const fileExtension = imageFile.originalname.split('.').pop().toLowerCase();

    if (!IMG_EXTENSIONS.includes(fileExtension)) {
      return res.status(400).json({ error: 'The file extension is invalid.' });
    }

    if (!MIME_TYPES[imageFile.mimetype]) {
      return res.status(400).json({ error: 'The MIME type of the file is invalid.' });
    }
  }
  next();
};
