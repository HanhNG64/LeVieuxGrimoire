const crypto = require('crypto');

// Generate a random secret key
const generateRandomSecretKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

module.exports = {
  secretKey: generateRandomSecretKey(),
};
