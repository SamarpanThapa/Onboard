const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comments: {
    type: String,
    trim: true
  },
  category: {
    type: String,
    enum: ['onboarding', 'offboarding', 'general', 'system', 'resources'],
    default: 'general'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
});

// Create indexes for faster querying
FeedbackSchema.index({ user: 1 });
FeedbackSchema.index({ category: 1 });
FeedbackSchema.index({ date: -1 });
FeedbackSchema.index({ rating: 1 });

module.exports = mongoose.model('Feedback', FeedbackSchema); 