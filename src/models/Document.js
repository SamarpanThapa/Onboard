const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a document title'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // Document type categorization
  documentType: {
    type: String,
    enum: [
      'pdf', 'presentation', 'spreadsheet', 'text', 'image', 'video',
      'policy', 'procedure', 'form', 'contract', 'template', 
      'identification', 'certificate', 'training', 'calendar', 'other'
    ],
    default: 'other',
    required: true
  },
  // Document category
  category: {
    type: String,
    enum: [
      'employee_resources', 'onboarding', 'policies', 'training', 
      'compliance', 'finance', 'legal', 'hr', 'it', 
      'payroll', 'benefits', 'performance', 'offboarding', 'other'
    ],
    default: 'other',
    required: true
  },
  // Document storage information
  file: {
    fileName: {
      type: String,
      required: true
    },
    filePath: {
      type: String,
      required: true
    },
    fileType: {
      type: String,
      enum: ['pdf', 'docx', 'xlsx', 'pptx', 'txt', 'jpg', 'png', 'mp4', 'other'],
      default: 'pdf'
    },
    fileSize: Number, // in bytes
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  // If this is an employee document, reference the employee
  relatedUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Document status and visibility
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'pending_review', 'approved', 'rejected'],
    default: 'draft'
  },
  visibility: {
    type: String,
    enum: ['private', 'employee', 'department', 'company', 'public', 'all_employees', 'specific_department'],
    default: 'private'
  },
  // For templates
  isTemplate: {
    type: Boolean,
    default: false
  },
  // Access control
  accessibleTo: [{
    type: String
  }],
  // For documents that need signatures/approvals
  requiresSignature: {
    type: Boolean,
    default: false
  },
  signatures: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    dateSigned: Date,
    signatureType: {
      type: String,
      enum: ['electronic', 'digital', 'wet'],
      default: 'electronic'
    },
    ipAddress: String,
    status: {
      type: String,
      enum: ['pending', 'signed', 'declined'],
      default: 'pending'
    }
  }],
  // For documents that expire
  expiryDate: Date,
  // For documents with versions
  version: {
    type: String,
    default: '1.0'
  },
  previousVersions: [{
    version: String,
    filePath: String,
    updatedAt: Date,
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // For documents shared with external parties
  externalSharing: [{
    email: String,
    accessGrantedAt: Date,
    accessExpiresAt: Date,
    accessGrantedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    accessToken: String,
    accessStatus: {
      type: String,
      enum: ['active', 'expired', 'revoked'],
      default: 'active'
    }
  }],
  // Document tags for organization
  tags: [String],
  // Notes/comments
  notes: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    text: String,
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
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
  updatedAt: Date,
  // Tracking document views
  viewHistory: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    viewedAt: {
      type: Date,
      default: Date.now
    },
    ipAddress: String
  }]
});

// Set updatedAt before update
DocumentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create indices for common queries
DocumentSchema.index({ documentType: 1 });
DocumentSchema.index({ category: 1 });
DocumentSchema.index({ relatedUser: 1 });
DocumentSchema.index({ status: 1 });
DocumentSchema.index({ 'file.uploadedAt': -1 });
DocumentSchema.index({ tags: 1 });

module.exports = mongoose.model('Document', DocumentSchema); 