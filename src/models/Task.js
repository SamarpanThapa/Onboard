const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Task type categorization
  taskType: {
    type: String,
    enum: [
      'email_setup', 'user_profile_creation', 'equipment_assignment',
      'system_access', 'training_assignment', 'document_submission',
      'orientation', 'intro_meeting', 'revoke_access', 'exit_interview',
      'asset_return', 'knowledge_transfer', 'final_payment', 'other'
    ],
    default: 'other',
    required: true
  },
  // Task category
  category: {
    type: String,
    enum: [
      'onboarding', 'offboarding', 'hr', 'it', 'finance', 
      'compliance', 'training', 'other'
    ],
    default: 'onboarding',
    required: true
  },
  // Task status
  status: {
    type: String,
    enum: ['pending', 'in_progress', 'completed', 'overdue', 'canceled'],
    default: 'pending'
  },
  // Priority level
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Assignee information
  assignee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Task for which employee
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Scheduling information
  dueDate: {
    type: Date
  },
  scheduledDate: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  // Automated task settings
  isAutomated: {
    type: Boolean,
    default: false
  },
  automationConfig: {
    triggerType: {
      type: String,
      enum: ['employee_hire', 'onboarding_stage', 'date_based', 'task_completion', 'employee_exit'],
      default: 'employee_hire'
    },
    triggerCondition: {
      type: String
    },
    actions: [{
      actionType: {
        type: String,
        enum: ['email', 'notification', 'api_call', 'status_update']
      },
      actionConfig: {
        type: mongoose.Schema.Types.Mixed
      }
    }]
  },
  // Dependencies (tasks that must be completed before this one)
  dependencies: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  // Subtasks
  subtasks: [{
    title: {
      type: String,
      required: true
    },
    description: String,
    status: {
      type: String,
      enum: ['pending', 'completed'],
      default: 'pending'
    },
    completedDate: Date
  }],
  // Task completion details
  completionDetails: {
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    comments: String,
    attachments: [{
      fileName: String,
      filePath: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  // Notifications settings
  notifications: {
    reminderEnabled: {
      type: Boolean,
      default: true
    },
    reminderDays: {
      type: Number,
      default: 1
    }
  },
  // Audit information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: Date
});

// Set updatedAt before update
TaskSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create indices for common queries
TaskSchema.index({ status: 1 });
TaskSchema.index({ assignee: 1 });
TaskSchema.index({ relatedUser: 1 });
TaskSchema.index({ dueDate: 1 });
TaskSchema.index({ taskType: 1 });
TaskSchema.index({ category: 1 });

module.exports = mongoose.model('Task', TaskSchema); 