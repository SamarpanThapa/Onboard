const mongoose = require('mongoose');

const OnboardingTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a template name'],
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  // Who is this template for
  targetRoles: [{
    type: String,
    trim: true
  }],
  targetDepartments: [{
    type: String,
    trim: true
  }],
  // Active status
  active: {
    type: Boolean,
    default: true
  },
  // Tasks in this template
  tasks: [{
    title: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    category: {
      type: String,
      enum: ['orientation', 'documentation', 'training', 'equipment', 'compliance', 'other'],
      default: 'other'
    },
    assignTo: {
      role: {
        type: String,
        enum: ['employee', 'manager', 'hr', 'it', 'custom'],
        default: 'employee'
      },
      customAssignee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    },
    timeline: {
      // When this task should be assigned relative to start date
      // Negative = days before start date, positive = days after start date
      timelineOffset: {
        type: Number,
        default: 0
      },
      // Due date relative to assignment date (in days)
      durationDays: {
        type: Number,
        default: 1
      }
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    requiresVerification: {
      type: Boolean,
      default: false
    },
    verificationRole: {
      type: String,
      enum: ['manager', 'hr', 'it', 'none'],
      default: 'none'
    },
    documents: [{
      name: String,
      description: String,
      required: {
        type: Boolean,
        default: true
      },
      template: {
        fileName: String,
        filePath: String
      }
    }],
    // For conditional tasks
    conditions: {
      dependsOn: [{
        taskId: String,  // Reference to task in the same template
        status: {
          type: String,
          enum: ['completed', 'not_completed'],
          default: 'completed'
        }
      }],
      // Condition based on employee attributes
      employeeAttributes: [{
        field: String,  // e.g., "department", "jobRole"
        operator: {
          type: String,
          enum: ['equals', 'not_equals', 'contains', 'not_contains'],
          default: 'equals'
        },
        value: String
      }]
    },
    // Task-specific resources
    resources: [{
      title: String,
      description: String,
      link: String,
      resourceType: {
        type: String,
        enum: ['document', 'video', 'link', 'contact'],
        default: 'document'
      }
    }]
  }],
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
  updatedAt: Date,
  // Version tracking
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    changes: String
  }]
});

// Set updatedAt before update
OnboardingTemplateSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

module.exports = mongoose.model('OnboardingTemplate', OnboardingTemplateSchema); 