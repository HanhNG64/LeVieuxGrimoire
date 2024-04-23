exports.postBooks = (req, res, next) => {
  res.status(200).json({ message: 'postBooks...' });
};

exports.getBooks = (req, res, next) => {
  res.status(200).json({ message: 'getBooks...' });
};

exports.putBook = (req, res, next) => {
  res.status(200).json({ message: 'postBook 1...' });
};

exports.getBook = (req, res, next) => {
  res.status(200).json({ message: 'getBook 1...' });
};

exports.deleteBook = (req, res, next) => {
  res.status(200).json({ message: 'deleteBook...' });
};

exports.postBestRating = (req, res, next) => {
  res.status(200).json({ message: 'postBestRating...' });
};

exports.getBestRating = (req, res, next) => {
  res.status(200).json({ message: 'getBestRating...' });
};
