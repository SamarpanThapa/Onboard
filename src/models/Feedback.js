const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  category: {
    type: String,
    required: true,
    enum: ['onboarding', 'system', 'support', 'documentation', 'general']
  },
  comments: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    default: function() {
      // Set expiry date to 30 days from creation
      const date = new Date();
      date.setDate(date.getDate() + 30);
      return date;
    }
  },
  status: {
    type: String,
    enum: ['pending', 'reviewed', 'archived'],
    default: 'pending'
  },
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: {
    type: Date
  },
  responseMessage: {
    type: String
  }
});

// Create indexes for faster querying
FeedbackSchema.index({ user: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ date: -1 });
FeedbackSchema.index({ rating: 1 });
FeedbackSchema.index({ expiryDate: 1 }); // Add index for expiry date queries

module.exports = mongoose.model('Feedback', FeedbackSchema); 