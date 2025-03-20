const mongoose = require('mongoose');

/**
 * TrainingAssignment Schema
 * Represents an assignment of a training to a user
 */
const TrainingAssignmentSchema = new mongoose.Schema({
  training: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Training',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  startedAt: {
    type: Date
  },
  completedDate: {
    type: Date
  },
  dueDate: {
    type: Date
  },
  completionStatus: {
    type: String,
    enum: ['assigned', 'in_progress', 'completed', 'overdue'],
    default: 'assigned'
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comments: String,
    submittedAt: Date
  },
  score: {
    type: Number,
    min: 0,
    max: 100
  }
}, {
  timestamps: true
});

// Create a compound index for user and training to ensure uniqueness
TrainingAssignmentSchema.index({ user: 1, training: 1 }, { unique: true });

module.exports = mongoose.model('TrainingAssignment', TrainingAssignmentSchema); 