const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getCurrentUser, 
  logoutUser,
  forgotPassword,
  resetPassword,
  verifyResetToken
} = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// @route   GET /api/auth/health
// @desc    API health check
// @access  Public
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'success', 
    message: 'API is up and running', 
    timestamp: new Date() 
  });
});

// @route   POST /api/auth/register
// @desc    Register a user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('departmentCode', 'Department code is required').not().isEmpty()
  ],
  registerUser
);

// @route   POST /api/auth/login
// @desc    Login user and get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  loginUser
);

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', authenticateToken, getCurrentUser);

// @route   GET /api/auth/logout
// @desc    Logout user
// @access  Private
router.get('/logout', authenticateToken, logoutUser);

// @route   POST /api/auth/forgot-password
// @desc    Send password reset link
// @access  Public
router.post(
  '/forgot-password',
  [
    check('email', 'Please include a valid email').isEmail()
  ],
  forgotPassword
);

// @route   GET /api/auth/reset-password/:token
// @desc    Verify reset token
// @access  Public
router.get('/reset-password/:token', verifyResetToken);

// @route   POST /api/auth/reset-password/:token
// @desc    Reset password using token
// @access  Public
router.post(
  '/reset-password/:token',
  [
    check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 }),
    check('confirmPassword', 'Passwords must match').custom((value, { req }) => value === req.body.password)
  ],
  resetPassword
);

module.exports = router; 