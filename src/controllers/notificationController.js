const { validationResult } = require('express-validator');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get notifications for current user
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    // Build query with filters
    const query = { recipient: req.user._id };

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by type
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Notification.countDocuments(query);

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .populate('sender', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination results
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    // Count unread notifications
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      status: 'unread'
    });

    res.status(200).json({
      success: true,
      count: notifications.length,
      pagination,
      total,
      unreadCount,
      data: notifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Create a notification
// @route   POST /api/notifications
// @access  Private (Admin or HR)
exports.createNotification = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      recipient,
      recipients,
      title,
      message,
      type,
      priority,
      channels,
      relatedObject,
      actions,
      expiresAt,
      scheduledFor
    } = req.body;

    // Handle single recipient or multiple recipients
    let notificationsToCreate = [];

    if (recipients && Array.isArray(recipients) && recipients.length > 0) {
      // Validate recipients exist
      const existingUsers = await User.find({ _id: { $in: recipients } });
      
      if (existingUsers.length !== recipients.length) {
        return res.status(400).json({
          success: false,
          message: 'One or more recipients do not exist'
        });
      }

      // Create notification data for each recipient
      notificationsToCreate = recipients.map(recipientId => ({
        recipient: recipientId,
        title,
        message,
        type: type || 'info',
        priority: priority || 'medium',
        channels: channels || ['app'],
        relatedObject,
        actions,
        expiresAt,
        scheduledFor,
        sender: req.user._id,
        isSystemGenerated: false
      }));
    } else if (recipient) {
      // Validate single recipient exists
      const recipientUser = await User.findById(recipient);
      if (!recipientUser) {
        return res.status(400).json({
          success: false,
          message: 'Recipient not found'
        });
      }

      // Create single notification
      notificationsToCreate.push({
        recipient,
        title,
        message,
        type: type || 'info',
        priority: priority || 'medium',
        channels: channels || ['app'],
        relatedObject,
        actions,
        expiresAt,
        scheduledFor,
        sender: req.user._id,
        isSystemGenerated: false
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'No recipients specified'
      });
    }

    // Create the notifications
    const notifications = await Notification.insertMany(notificationsToCreate);

    res.status(201).json({
      success: true,
      count: notifications.length,
      data: notifications
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns the notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this notification'
      });
    }

    // Update notification status
    notification.status = 'read';
    notification.readAt = new Date();

    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    // Update all unread notifications for this user
    const result = await Notification.updateMany(
      {
        recipient: req.user._id,
        status: 'unread'
      },
      {
        $set: {
          status: 'read',
          readAt: new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      count: result.nModified,
      message: `${result.nModified} notifications marked as read`
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
exports.deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns the notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this notification'
      });
    }

    await notification.remove();

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Archive a notification
// @route   PUT /api/notifications/:id/archive
// @access  Private
exports.archiveNotification = async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Check if user owns the notification
    if (notification.recipient.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to archive this notification'
      });
    }

    // Update notification status
    notification.status = 'archived';

    await notification.save();

    res.status(200).json({
      success: true,
      data: notification
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 