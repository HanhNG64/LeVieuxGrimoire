const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

/**
 * Resize an image and convert it to WebP format
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 * @returns
 */
const sharpResize = (req, res, next) => {
  if (!req.file) return next();

  const inPath = req.file.path;
  let fileName = req.file.filename.split('original_')[1];
  fileName = `${fileName.split('.')[0]}.webp`;
  const outputPath = path.join('images', fileName);

  // Disable this caching mechanism to be able to delete the file
  sharp.cache(false);

  sharp(inPath)
    .resize(300)
    .webp({ quality: 50 })
    .toFile(outputPath)
    .then(() => {
      fs.unlink(inPath, () => {
        req.file.filename = fileName;
        req.file.path = outputPath;
        next();
      });
    })
    .catch((error) => {
      console.error(error);
      next();
    });
};

module.exports = sharpResize;
