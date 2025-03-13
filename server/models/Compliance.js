const mongoose = require('mongoose');

const ComplianceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a compliance title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a compliance description']
  },
  complianceType: {
    type: String,
    enum: ['nda', 'i9', 'background-check', 'tax-form', 'policy-acknowledgment', 'other'],
    required: [true, 'Please specify the compliance type']
  },
  dueDate: {
    type: Date,
    required: [true, 'Please provide a due date']
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'overdue'],
    default: 'pending'
  },
  documentPath: {
    type: String
  },
  completedAt: {
    type: Date
  },
  notes: {
    type: String
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
ComplianceSchema.index({ assignedTo: 1, status: 1 });
ComplianceSchema.index({ complianceType: 1 });

module.exports = mongoose.model('Compliance', ComplianceSchema); 