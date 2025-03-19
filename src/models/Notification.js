const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  // Recipient user
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Title of the notification
  title: {
    type: String,
    required: [true, 'Please provide a notification title'],
    trim: true
  },
  // Message content
  message: {
    type: String,
    required: [true, 'Please provide a notification message'],
    trim: true
  },
  // Type of notification for styling and filtering
  type: {
    type: String,
    enum: ['system', 'task', 'compliance', 'feedback', 'alert'],
    default: 'system'
  },
  // Notification priority
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Read status
  status: {
    type: String,
    enum: ['unread', 'read', 'archived'],
    default: 'unread'
  },
  // Delivery channels
  channels: [{
    type: String,
    enum: ['app', 'email', 'sms', 'slack', 'teams'],
    default: 'app'
  }],
  // Delivery status for non-app channels
  deliveryStatus: [{
    channel: {
      type: String,
      enum: ['email', 'sms', 'slack', 'teams']
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'delivered', 'failed'],
      default: 'pending'
    },
    sentAt: Date,
    deliveredAt: Date,
    errorMessage: String
  }],
  // For app notifications - when user read it
  readAt: {
    type: Date
  },
  // Related object (if applicable)
  relatedObject: {
    objectType: {
      type: String,
      enum: [
        'user', 'employeeTask', 'document', 'asset', 'accessRequest', 
        'onboardingProcess', 'onboardingTemplate', 'other'
      ]
    },
    objectId: mongoose.Schema.Types.ObjectId,
    link: String
  },
  // Actions that can be taken directly from notification
  actions: [{
    actionType: {
      type: String,
      enum: ['view', 'approve', 'reject', 'complete', 'assign', 'remind', 'custom'],
      default: 'view'
    },
    label: String,
    link: String,
    apiEndpoint: String,
    completed: {
      type: Boolean,
      default: false
    },
    completedAt: Date
  }],
  // Expiry date (when to auto-archive)
  expiresAt: {
    type: Date
  },
  // Notification creation date
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Sender information
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Is it a system-generated notification?
  isSystemGenerated: {
    type: Boolean,
    default: true
  },
  // For scheduled notifications
  scheduledFor: Date,
  // For repeat notifications
  recurrence: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'daily'
    },
    endDate: Date,
    pattern: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isArchived: {
    type: Boolean,
    default: false
  },
  relatedTo: {
    model: {
      type: String,
      enum: ['Task', 'Document', 'ComplianceItem', 'Feedback', null],
      default: null
    },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    }
  }
});

// Mark as read when updating status to read
NotificationSchema.pre('findOneAndUpdate', function(next) {
  if (this._update && this._update.status === 'read' && !this._update.readAt) {
    this._update.readAt = new Date();
  }
  next();
});

// Create indexes for efficient queries
NotificationSchema.index({ recipient: 1, status: 1 });
NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, type: 1 });
NotificationSchema.index({ scheduledFor: 1 });
NotificationSchema.index({ 'relatedObject.objectId': 1 });
NotificationSchema.index({ recipient: 1, isRead: 1, isArchived: 1 });

// Set read status and timestamp
NotificationSchema.methods.markAsRead = async function() {
  this.isRead = true;
  this.readAt = new Date();
  return this.save();
};

// Archive notification
NotificationSchema.methods.archive = async function() {
  this.isArchived = true;
  return this.save();
};

module.exports = mongoose.model('Notification', NotificationSchema); 