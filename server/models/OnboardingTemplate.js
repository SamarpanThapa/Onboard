const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: String,
  dueDate: Number, // Days from start date
  assignedTo: {
    type: String,
    enum: ['employee', 'manager', 'hr', 'it'],
    required: true
  },
  required: {
    type: Boolean,
    default: true
  }
});

const documentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  description: String,
  required: {
    type: Boolean,
    default: true
  },
  format: {
    type: String,
    enum: ['pdf', 'doc', 'docx', 'jpg', 'png', 'other'],
    default: 'other'
  }
});

const emailNotificationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['welcome', 'task_assigned', 'document_required', 'milestone_completed', 'onboarding_completed'],
    required: true
  },
  subject: String,
  template: String,
  recipients: [{
    type: String,
    enum: ['employee', 'manager', 'hr', 'it']
  }],
  timing: {
    type: String,
    enum: ['immediately', 'one_day_before', 'one_week_before', 'on_completion'],
    default: 'immediately'
  }
});

const onboardingTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  description: String,
  duration: {
    type: Number, // Days
    default: 30
  },
  tasks: [taskSchema],
  documents: [documentSchema],
  emailNotifications: [emailNotificationSchema],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const OnboardingTemplate = mongoose.model('OnboardingTemplate', onboardingTemplateSchema);

module.exports = OnboardingTemplate; 