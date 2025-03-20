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

// @route   POST /api/notifications/offboarding-completed
// @desc    Send notification about completed offboarding
// @access  Private
router.post('/offboarding-completed', protect, async (req, res) => {
  const { User, Notification } = require('../models');
  try {
    const { processId, reason } = req.body;
    
    // Find current user
    const currentUser = await User.findById(req.user._id);
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    // Find HR admins to notify
    const hrAdmins = await User.find({ role: 'hr_admin', isActive: true });
    if (hrAdmins.length === 0) {
      return res.status(200).json({ 
        success: true, 
        message: 'No HR admins to notify',
        recipientsFound: false
      });
    }
    
    // Create notifications for each HR admin
    const notifications = await Promise.all(hrAdmins.map(admin => {
      return Notification.create({
        recipient: admin._id,
        title: 'Offboarding Process Completed',
        message: `${currentUser.name} has completed their offboarding process. Reason: ${reason}`,
        type: 'system',
        priority: 'high',
        sender: req.user._id,
        relatedEntity: {
          type: 'offboarding',
          id: processId
        }
      });
    }));
    
    return res.status(200).json({
      success: true,
      message: 'Offboarding completion notifications sent',
      notificationsSent: notifications.length
    });
  } catch (error) {
    console.error('Error sending offboarding notifications:', error);
    return res.status(500).json({
      success: false,
      message: 'Error sending notifications',
      error: error.message
    });
  }
});

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