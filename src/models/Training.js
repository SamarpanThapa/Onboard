const mongoose = require('mongoose');

const TrainingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a training title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Training type categorization
  trainingType: {
    type: String,
    enum: [
      'onboarding', 'orientation', 'compliance', 'skills', 'safety',
      'leadership', 'technical', 'professional_development', 'product',
      'process', 'software', 'security', 'customer_service', 'other'
    ],
    default: 'onboarding',
    required: true
  },
  // Training format
  format: {
    type: String,
    enum: [
      'live_webinar', 'recorded_video', 'in_person', 'self_paced',
      'document', 'interactive', 'quiz', 'assessment', 'group_activity',
      'workshop', 'presentation', 'other'
    ],
    default: 'self_paced',
    required: true
  },
  // Training content/materials
  content: {
    materials: [{
      title: String,
      description: String,
      fileType: String,
      fileName: String,
      filePath: String,
      fileSize: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],
    externalLinks: [{
      title: String,
      url: String,
      description: String
    }],
    // For embedded video content
    videoEmbedUrl: String,
    // Content duration in minutes
    duration: Number
  },
  // Required for which departments/roles
  requiredFor: {
    departments: [String],
    roles: [String],
    isAllEmployees: {
      type: Boolean,
      default: false
    }
  },
  // Training schedule information
  schedule: {
    isScheduled: {
      type: Boolean,
      default: false
    },
    startDate: Date,
    endDate: Date,
    recurrence: {
      type: String,
      enum: ['once', 'daily', 'weekly', 'monthly', 'quarterly', 'yearly', 'custom'],
      default: 'once'
    },
    recurrenceDetails: String,
    // For live training sessions
    sessions: [{
      date: Date,
      startTime: String,
      endTime: String,
      location: String,
      instructor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      maxAttendees: Number
    }]
  },
  // Assigned users and completion tracking
  assignments: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['assigned', 'in_progress', 'completed', 'overdue', 'expired'],
      default: 'assigned'
    },
    startedAt: Date,
    completedAt: Date,
    reminderSent: {
      type: Boolean,
      default: false
    },
    // For assessments/quizzes
    score: Number,
    passingScore: Number,
    attempts: Number,
    maxAttempts: Number,
    // Session attendance for live training
    attendance: {
      sessionIndex: Number,
      attended: Boolean,
      checkInTime: Date,
      checkOutTime: Date
    },
    // Feedback/survey responses
    feedback: {
      rating: Number,
      comments: String,
      submittedAt: Date
    }
  }],
  // Assessment/quiz settings
  assessment: {
    isAssessmentRequired: {
      type: Boolean,
      default: false
    },
    passingScore: {
      type: Number,
      default: 70
    },
    maxAttempts: {
      type: Number,
      default: 3
    },
    questions: [{
      question: String,
      type: {
        type: String,
        enum: ['multiple_choice', 'true_false', 'short_answer', 'essay'],
        default: 'multiple_choice'
      },
      options: [String],
      correctAnswer: String,
      points: Number
    }]
  },
  // Feedback survey settings
  feedbackSurvey: {
    isFeedbackRequired: {
      type: Boolean,
      default: false
    },
    questions: [{
      question: String,
      type: {
        type: String,
        enum: ['rating', 'multiple_choice', 'text'],
        default: 'rating'
      },
      options: [String]
    }]
  },
  // Training completion certificate
  certificate: {
    issueCertificate: {
      type: Boolean,
      default: false
    },
    certificateTemplate: String,
    validityPeriod: Number, // in months
    expiryNotification: {
      type: Boolean,
      default: false
    }
  },
  // Status of the training program
  status: {
    type: String,
    enum: ['draft', 'active', 'inactive', 'archived'],
    default: 'draft'
  },
  // For compliance tracking
  compliance: {
    isComplianceRequired: {
      type: Boolean,
      default: false
    },
    regulationType: String,
    expiryPeriod: Number, // in months
    renewalReminder: {
      type: Boolean,
      default: false
    },
    renewalReminderDays: {
      type: Number,
      default: 30
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
TrainingSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create indices for common queries
TrainingSchema.index({ trainingType: 1 });
TrainingSchema.index({ status: 1 });
TrainingSchema.index({ 'requiredFor.departments': 1 });
TrainingSchema.index({ 'requiredFor.roles': 1 });
TrainingSchema.index({ 'assignments.user': 1 });
TrainingSchema.index({ 'assignments.status': 1 });

module.exports = mongoose.model('Training', TrainingSchema); 