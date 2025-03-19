const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getUsers,
  getUser,
  createUser,
  updateUser,
  deleteUser,
  changeUserStatus,
  getUserDashboard,
  getMe,
  updateMe
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Admin, HR, IT Admin)
router.get(
  '/',
  protect,
  authorize('admin', 'hr_admin', 'it_admin'),
  getUsers
);

// @route   GET /api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', protect, getMe);

// @route   PUT /api/users/me
// @desc    Update current user profile
// @access  Private
router.put(
  '/me',
  protect,
  [
    check('name', 'Name is required').optional().not().isEmpty(),
    check('password', 'Password must be at least 6 characters').optional().isLength({ min: 6 })
  ],
  updateMe
);

// @route   POST /api/users
// @desc    Create a new user
// @access  Private (Admin, HR)
router.post(
  '/',
  protect,
  authorize('admin', 'hr_admin'),
  [
    check('email', 'Please include a valid email').isEmail(),
    check('name', 'Name is required').not().isEmpty(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    check('role', 'Role is required').not().isEmpty()
  ],
  createUser
);

// @route   GET /api/users/:id
// @desc    Get a single user
// @access  Private (Admin, HR, or the user themselves)
router.get('/:id', protect, getUser);

// @route   PUT /api/users/:id
// @desc    Update a user
// @access  Private (Admin, HR, or the user themselves with limited fields)
router.put('/:id', protect, updateUser);

// @route   DELETE /api/users/:id
// @desc    Delete a user
// @access  Private (Admin, HR, IT Admin)
router.delete(
  '/:id',
  protect,
  authorize('admin', 'hr_admin', 'it_admin'),
  deleteUser
);

// @route   PUT /api/users/:id/status
// @desc    Change user active status
// @access  Private (Admin, HR, IT Admin)
router.put(
  '/:id/status',
  protect,
  authorize('admin', 'hr_admin', 'it_admin'),
  [
    check('isActive', 'isActive must be a boolean').isBoolean()
  ],
  changeUserStatus
);

// @route   GET /api/users/:id/dashboard
// @desc    Get user dashboard data
// @access  Private (User themselves or Admin/HR)
router.get('/:id/dashboard', protect, getUserDashboard);

module.exports = router; 