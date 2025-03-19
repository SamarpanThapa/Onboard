const mongoose = require('mongoose');

const EmployeeTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Type of task
  taskType: {
    type: String,
    enum: ['onboarding', 'regular', 'compliance', 'offboarding'],
    default: 'regular'
  },
  // For compliance tasks
  complianceDetails: {
    requiresVerification: {
      type: Boolean,
      default: false
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    verificationDate: Date,
    verificationStatus: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'revision_requested'],
      default: 'pending'
    },
    verificationNotes: String,
    complianceType: {
      type: String,
      enum: ['document', 'training', 'certification', 'policy', 'other'],
      default: 'other'
    }
  },
  // Task assignment
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Task dates
  dueDate: {
    type: Date,
    required: true
  },
  completedDate: Date,
  startDate: {
    type: Date,
    default: Date.now
  },
  // Task status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'overdue', 'cancelled'],
    default: 'not_started'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Task details
  category: {
    type: String,
    enum: ['orientation', 'documentation', 'training', 'equipment', 'compliance', 'other'],
    default: 'other'
  },
  estimatedTime: {
    value: Number,
    unit: {
      type: String,
      enum: ['minutes', 'hours', 'days'],
      default: 'hours'
    }
  },
  // For recurring tasks
  recurrence: {
    isRecurring: {
      type: Boolean,
      default: false
    },
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually', 'custom'],
      default: 'weekly'
    },
    endDate: Date,
    customPattern: String
  },
  // For related templates
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OnboardingTemplate'
  },
  // Notifications & reminders
  reminders: [{
    reminderDate: Date,
    sent: {
      type: Boolean,
      default: false
    },
    sentAt: Date
  }],
  // Attachments & files
  attachments: [{
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Comments & feedback
  comments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    submittedAt: Date
  },
  // Audit information
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: Date,
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Set updatedAt before update
EmployeeTaskSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Index for efficient querying
EmployeeTaskSchema.index({ assignedTo: 1, status: 1 });
EmployeeTaskSchema.index({ dueDate: 1 });
EmployeeTaskSchema.index({ taskType: 1, status: 1 });

module.exports = mongoose.model('EmployeeTask', EmployeeTaskSchema); 