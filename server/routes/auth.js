const express = require('express');
const {
  register,
  login,
  logout,
  getMe,
  getUsersByRole
} = require('../controllers/auth');

const router = express.Router();

const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/logout', logout);
router.get('/me', protect, getMe);
router.get('/users/:role', protect, getUsersByRole);

module.exports = router; 