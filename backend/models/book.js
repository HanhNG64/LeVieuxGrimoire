const mongoose = require('mongoose');

const bookSchema = mongoose.Schema({
  userId: { type: String, rerquire: true },
  title: { type: String, require: true },
  author: { type: String, require: true },
  imageUrl: { trype: String, require: true },
  year: { type: Number, require: true },
  genre: { ype: String, require: true },
  ratings: [
    {
      userId: { type: String, require: true },
      grade: { type: Number, require: true },
    },
  ],
});

module.exports = mongoose.model('Book', bookSchema);
