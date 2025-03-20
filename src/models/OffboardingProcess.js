const mongoose = require('mongoose');

const OffboardingProcessSchema = new mongoose.Schema({
  // The employee being offboarded
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Last working day for the employee
  exitDate: {
    type: Date,
    required: true
  },
  // Reason for leaving
  reason: {
    type: String,
    enum: ['new-opportunity', 'relocation', 'retirement', 'other'],
    required: true
  },
  // Exit interview feedback
  feedback: {
    type: String
  },
  // General offboarding status
  status: {
    type: String,
    enum: ['initiated', 'in_progress', 'completed'],
    default: 'initiated'
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
    }
  },
  // Tasks for this offboarding process
  tasks: [{
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'EmployeeTask'
    },
    title: String,
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'cancelled'],
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
  // Asset return tracking
  companyAssetsReturned: [{
    assetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Asset'
    },
    assetName: String,
    returnStatus: {
      type: String,
      enum: ['pending', 'returned', 'damaged', 'lost', 'not_applicable'],
      default: 'pending'
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    returnDate: Date,
    notes: String
  }],
  // Account deactivation
  accountDeactivation: {
    status: {
      type: Boolean,
      default: false
    },
    requested: {
      type: Boolean,
      default: false
    },
    completedDate: Date,
    completedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // Knowledge transfer
  knowledgeTransfer: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'not_applicable'],
      default: 'not_started'
    },
    documents: [{
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      },
      title: String,
      uploadedDate: Date
    }],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    completionNotes: String
  },
  // Exit interview
  exitInterview: {
    status: {
      type: String,
      enum: ['scheduled', 'completed', 'skipped', 'not_scheduled'],
      default: 'not_scheduled'
    },
    scheduledDate: Date,
    completedDate: Date,
    conductedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    notes: String
  },
  // Final documentation
  finalDocumentation: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    documents: [{
      documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      },
      title: String,
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      uploadedDate: Date
    }]
  },
  // Compliance acknowledgments
  complianceAcknowledged: {
    type: Boolean,
    default: false
  },
  // Key dates
  keyDates: {
    created: {
      type: Date,
      default: Date.now
    },
    lastUpdated: Date,
    completedDate: Date
  },
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
OffboardingProcessSchema.pre('save', function(next) {
  // Calculate overall progress percentage
  if (this.progress.totalTasks > 0) {
    this.progress.percentComplete = Math.round((this.progress.tasksCompleted / this.progress.totalTasks) * 100);
  }
  
  // Set updatedAt timestamp
  this.updatedAt = new Date();
  
  next();
});

// Define default tasks for offboarding
OffboardingProcessSchema.methods.initializeDefaultTasks = async function() {
  const defaultTasks = [
    {
      title: 'Exit Interview',
      category: 'HR',
      status: 'not_started'
    },
    {
      title: 'Asset Return',
      category: 'IT',
      status: 'not_started'
    },
    {
      title: 'Knowledge Transfer',
      category: 'Department',
      status: 'not_started'
    },
    {
      title: 'Access Revocation',
      category: 'IT',
      status: 'not_started'
    },
    {
      title: 'Final Documentation',
      category: 'HR',
      status: 'not_started'
    }
  ];

  this.tasks = defaultTasks;
  this.progress.totalTasks = defaultTasks.length;
  
  return this;
};

module.exports = mongoose.model('OffboardingProcess', OffboardingProcessSchema); 