const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  feedbackType: {
    type: String,
    enum: ['onboarding', 'offboarding', 'resources', 'system', 'other'],
    required: [true, 'Please specify the feedback type']
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: [true, 'Please provide a rating']
  },
  message: {
    type: String,
    required: [true, 'Please provide feedback message'],
    minlength: [10, 'Feedback message must be at least 10 characters']
  },
  submittedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isAnonymous: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    enum: ['new', 'reviewed', 'addressed'],
    default: 'new'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewNotes: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
FeedbackSchema.index({ feedbackType: 1, status: 1 });
FeedbackSchema.index({ submittedBy: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema); 