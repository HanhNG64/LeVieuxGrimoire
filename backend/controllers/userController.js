const User = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { secretKey } = require('../config/config');

/**
 * Create a new user by hashing their password and saving it in the database
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.signup = async (req, res, next) => {
  try {
    // Validate email and password
    if (!validator.isEmail(req.body.email)) {
      return res.status(400).json({ error: 'Adresse e-mail invalide' });
    }
    if (!validatePassword(req.body.password)) {
      return res.status(400).json({
        error: 'Le mot de passe doit contenir au moins 8 caractères : une lettre minuscule, une lettre majuscule, un chiffre et un carctère spécial',
      });
    }

    // Hash user-provided password
    const hash = await bcrypt.hash(req.body.password, 10);

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
  } catch (error) {
    res.status(500).json({ error });
  }
};

/**
 * Login for a user. check user credentials, returning an auth token if successful or an error message otherwise
 * @param {*} req HTTP request
 * @param {*} res HTTP response
 * @param {*} next Middleware function to move to the next middleware in the chain
 */
exports.login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ message: 'Erreur de connexion' });
    }

    //Check if the password provided by the user is identical to the hashed password stored in the database
    const valid = await bcrypt.compare(req.body.password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Erreur de connexion' });
    }

    // Generate a token with a 24-hour deadline
    res.status(200).json({
      userId: user._id,
      token: jwt.sign(
        {
          userId: user._id,
        },
        secretKey,
        { expiresIn: '24h' },
      ),
    });
  } catch (error) {
    res.status(500).json({ error });
  }
};

/**
 * Password validation function
 * @param {*} password
 * @returns
 */
function validatePassword(password) {
  const isLengthValid = validator.isLength(password, { min: 8 });
  // At least one lowercase letter, one uppercase letter, one number and one special character
  const isComplexityValid = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/.test(password);
  return isLengthValid && isComplexityValid;
}
