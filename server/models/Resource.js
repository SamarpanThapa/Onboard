const mongoose = require('mongoose');

const ResourceSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please provide a resource title'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please provide a resource description']
  },
  resourceType: {
    type: String,
    enum: ['pdf', 'document', 'video', 'link', 'calendar', 'other'],
    default: 'document'
  },
  filePath: {
    type: String,
    required: function() {
      return this.resourceType !== 'link';
    }
  },
  fileSize: {
    type: Number
  },
  externalLink: {
    type: String,
    required: function() {
      return this.resourceType === 'link';
    }
  },
  category: {
    type: String,
    enum: ['handbook', 'policy', 'training', 'form', 'guide', 'other'],
    default: 'other'
  },
  accessRoles: {
    type: [String],
    enum: ['employee', 'manager', 'hr', 'it', 'all'],
    default: ['all']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
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
ResourceSchema.index({ category: 1, resourceType: 1 });
ResourceSchema.index({ accessRoles: 1 });

module.exports = mongoose.model('Resource', ResourceSchema); 