const mongoose = require('mongoose');

const OnboardingProcessSchema = new mongoose.Schema({
  // The employee being onboarded
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Template used to generate this process
  template: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OnboardingTemplate'
  },
  // Start date for the employee (used to calculate task timelines)
  startDate: {
    type: Date,
    required: true
  },
  // General onboarding status
  status: {
    type: String,
    enum: ['not_started', 'in_progress', 'completed', 'on_hold', 'terminated'],
    default: 'not_started'
  },
  // Progress tracking
  progress: {
    tasksCompleted: {
      type: Number,
      default: 0
    },
    totalTasks: {
      type: Number,
      default: 0
    },
    percentComplete: {
      type: Number,
      default: 0,
      min: 0,
      max: 100
    },
    // Track progress by category
    categoryProgress: [{
      category: String,
      completed: Number,
      total: Number,
      percentComplete: Number
    }]
  },
  // Tasks assigned for this onboarding process
  tasks: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeTask'
    },
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'overdue', 'cancelled'],
      default: 'not_started'
    },
    assignedDate: Date,
    dueDate: Date,
    completedDate: Date,
    category: String,
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Compliance tracking
  complianceStatus: {
    type: String,
    enum: ['compliant', 'partially_compliant', 'non_compliant', 'exempted', 'pending'],
    default: 'pending'
  },
  complianceChecklist: [{
    item: String,
    status: {
      type: String,
      enum: ['pending', 'completed', 'waived', 'in_progress', 'blocked'],
      default: 'pending'
    },
    completedDate: Date,
    notes: String,
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Required documents
  documents: [{
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    title: String,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'pending_review', 'approved'],
      default: 'not_started'
    },
    required: {
      type: Boolean,
      default: true
    },
    completedDate: Date
  }],
  // Key dates
  keyDates: {
    created: {
      type: Date,
      default: Date.now
    },
    expectedCompletionDate: Date,
    actualCompletionDate: Date,
    lastUpdated: Date
  },
  // Team involvement
  involvedUsers: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['manager', 'buddy', 'hr', 'it', 'other'],
      default: 'other'
    },
    responsibilities: [String]
  }],
  // Equipment and access provisioning
  equipmentProvisioning: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'delayed', 'issues'],
      default: 'not_started'
    },
    items: [{
      assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
      },
      name: String,
      status: {
        type: String,
        enum: ['ordered', 'delivered', 'configured', 'issued', 'pending'],
        default: 'pending'
      },
      assignedDate: Date,
      notes: String
    }]
  },
  accessProvisioning: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'delayed', 'issues'],
      default: 'not_started'
    },
    items: [{
      accessType: String,
      system: String,
      permissions: String,
      status: {
        type: String,
        enum: ['pending', 'granted', 'denied', 'revoked'],
        default: 'pending'
      },
      requestedDate: Date,
      grantedDate: Date,
      notes: String
    }]
  },
  // Feedback and evaluations
  feedbackCheckpoints: [{
    checkpointName: String,
    scheduledDate: Date,
    completedDate: Date,
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'missed', 'rescheduled'],
      default: 'scheduled'
    },
    employeeFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      comments: String,
      suggestions: String,
      submittedDate: Date
    },
    managerFeedback: {
      rating: {
        type: Number,
        min: 1,
        max: 5
      },
      strengths: String,
      areasForImprovement: String,
      actionItems: String,
      submittedDate: Date
    }
  }],
  // Notes
  notes: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    },
    category: {
      type: String,
      enum: ['general', 'issue', 'milestone', 'feedback', 'other'],
      default: 'general'
    }
  }],
  // Audit information
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedAt: Date
});

// Update progress calculation before saving
OnboardingProcessSchema.pre('save', function(next) {
  // Calculate overall progress percentage
  if (this.progress.totalTasks > 0) {
    this.progress.percentComplete = Math.round((this.progress.tasksCompleted / this.progress.totalTasks) * 100);
  }
  
  // Set updatedAt timestamp
  this.updatedAt = new Date();
  
  next();
});

// Set updatedAt before update
OnboardingProcessSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create indexes for common queries
OnboardingProcessSchema.index({ employee: 1 });
OnboardingProcessSchema.index({ status: 1 });
OnboardingProcessSchema.index({ startDate: 1 });
OnboardingProcessSchema.index({ 'keyDates.created': -1 });

module.exports = mongoose.model('OnboardingProcess', OnboardingProcessSchema); 