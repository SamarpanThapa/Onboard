const mongoose = require('mongoose');

const AccessRequestSchema = new mongoose.Schema({
  requestType: {
    type: String,
    enum: ['access_grant', 'access_revoke', 'asset_request', 'asset_return', 'software_access', 'other'],
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  // User making the request
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // User who will receive/lose access (might be the same as requestedBy)
  requestedFor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Related asset if this is an asset request
  relatedAsset: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Asset'
  },
  // Access details
  accessDetails: {
    systems: [String], // List of systems to grant/revoke access to
    level: {
      type: String,
      enum: ['read', 'write', 'admin', 'full', 'custom'],
      default: 'read'
    },
    customPermissions: [String],
    startDate: Date,
    endDate: Date, // For temporary access
    reason: String
  },
  // Request status
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'],
    default: 'pending'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  // Approval workflow
  approvals: [{
    approver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    comments: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  // For IT department processing
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  notes: String,
  attachments: [{
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Audit trail
  created: {
    at: {
      type: Date,
      default: Date.now
    }
  },
  lastUpdated: {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    at: Date,
    action: String
  },
  completedDate: Date
});

module.exports = mongoose.model('AccessRequest', AccessRequestSchema); 