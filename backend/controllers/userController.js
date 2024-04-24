const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

/**
 * Create a new user by hashing their password and saving it in the database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.signup = (req, res, next) => {
  // Hash user-provided password
  bcrypt
    .hash(req.body.password, 10)
    .then((hash) => {
      // Create a new user with the email provided by the user and the generated password hash
      const newUser = new User({
        email: req.body.email,
        password: hash,
      });

      // Save the new user to the database
      newUser
        .save()
        .then(() => res.status(201).json({ message: 'Utilisateur créé' }))
        .catch((error) => res.status(400).json({ error }));
    })
    .catch((error) => res.status(500).json({ error }));
};

/**
 * Login for a user. check user credentials, returning an auth token if successful or an error message otherwise
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.login = (req, res, next) => {
  User.findOne({ email: req.body.email })
    .then((user) => {
      if (user) {
        //If the password provided by the user is identical to the hashed password stored in the database,
        // generate a token with a 24-hour deadline
        bcrypt
          .compare(req.body.password, user.password)
          .then((valid) => {
            if (valid) {
              res.status(200).json({
                userId: user._id,
                token: jwt.sign(
                  {
                    userId: user._id,
                  },
                  'RANDOM_TOKEN_SECRET',
                  { expiresIn: '24h' },
                ),
              });
            } else {
              res.status(401).json({ message: 'Erreur de connexion' });
            }
          })
          .catch((error) => res.status(400).json({ error }));
      } else {
        res.status(401).json({ message: 'Erreur de connexion' });
      }
    })
    .catch((error) => res.status(500).json({ error }));
};
