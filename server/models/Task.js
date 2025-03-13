const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a task title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a task description']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date']
  },
  category: {
    type: String,
    enum: ['documentation', 'compliance', 'orientation', 'equipment', 'training', 'other'],
    default: 'other'
  },
  processType: {
    type: String,
    enum: ['onboarding', 'offboarding'],
    required: [true, 'Please specify if this is an onboarding or offboarding task']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify which user this task is assigned to']
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Please specify which user assigned this task']
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  },
  attachments: [{
    fileName: String,
    filePath: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
TaskSchema.index({ assignedTo: 1, status: 1 });
TaskSchema.index({ processType: 1, category: 1 });

module.exports = mongoose.model('Task', TaskSchema); 