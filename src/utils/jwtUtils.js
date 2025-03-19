const jwt = require('jsonwebtoken');

/**
 * Generate a JWT token for authentication
 * @param {string} userId - The user's ID
 * @param {string} role - The user's role
 * @returns {string} - A JWT token
 */
const generateToken = (userId, role) => {
  return jwt.sign(
    { id: userId, role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

module.exports = generateToken; 