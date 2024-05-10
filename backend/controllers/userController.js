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
    // Check data from request
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing Data' });
    }

    // Validate email and password
    if (!validator.isEmail(email)) {
      return res.status(400).json({ error: 'Bad credential' });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({
        error: 'Bad credential',
      });
    }

    // Hash user-provided password
    const hash = await bcrypt.hash(password, 10);

    // Create a new user with the email provided by the user and the generated password hash
    const newUser = new User({
      email: req.body.email,
      password: hash,
    });

    // Save the new user to the database
    newUser
      .save()
      .then(() => res.status(201).json({ message: 'User created' }))
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
    // Check data from request
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Missing Data' });
    }

    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(401).json({ message: 'Connexion error' });
    }

    //Check if the password provided by the user is identical to the hashed password stored in the database
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Connexion error' });
    }

    // Generate a token with a 24-hour deadline
    res.status(200).json({
      userId: user._id,
      token: jwt.sign(
        {
          userId: user._id,
        },
        secretKey,
        { expiresIn: process.env.JWT_DURING },
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
