const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  getNotifications,
  createNotification,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  archiveNotification
} = require('../controllers/notificationController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   GET /api/notifications
// @desc    Get notifications for current user
// @access  Private
router.get('/', protect, getNotifications);

// @route   POST /api/notifications
// @desc    Create a notification
// @access  Private (Admin or HR)
router.post(
  '/',
  protect,
  authorize('hr_admin', 'department_admin', 'it_admin'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('message', 'Message is required').not().isEmpty(),
    check('recipients', 'Recipients must be an array of user IDs').optional().isArray(),
    check('recipient', 'Recipient must be a valid user ID').optional()
  ],
  createNotification
);

// @route   PUT /api/notifications/:id/read
// @desc    Mark notification as read
// @access  Private
router.put('/:id/read', protect, markAsRead);

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', protect, markAllAsRead);

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', protect, deleteNotification);

// @route   PUT /api/notifications/:id/archive
// @desc    Archive a notification
// @access  Private
router.put('/:id/archive', protect, archiveNotification);

module.exports = router; 