const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['it', 'hr', 'onboarding', 'other'],
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  comments: [
    {
      text: {
        type: String,
        required: true
      },
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
      },
      createdAt: {
        type: Date,
        default: Date.now
      }
    }
  ],
  attachments: [
    {
      fileName: String,
      filePath: String,
      fileType: String,
      uploadDate: {
        type: Date,
        default: Date.now
      }
    }
  ],
  resolution: {
    type: String,
    trim: true
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastUpdated: {
    date: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }
});

// Create indexes for faster querying
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ createdBy: 1 });
SupportTicketSchema.index({ assignedTo: 1 });
SupportTicketSchema.index({ category: 1 });
SupportTicketSchema.index({ createdAt: -1 });

// Virtual for time elapsed since creation
SupportTicketSchema.virtual('timeElapsed').get(function() {
  const now = new Date();
  const createdAt = this.createdAt;
  const diff = now - createdAt;
  
  // Convert milliseconds to appropriate time unit
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) {
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return 'Just now';
  }
});

// Virtual for response time
SupportTicketSchema.virtual('responseTime').get(function() {
  if (!this.comments || this.comments.length === 0) {
    return null;
  }
  
  // Find the first comment not from the ticket creator
  const firstResponse = this.comments.find(comment => 
    comment.user.toString() !== this.createdBy.toString()
  );
  
  if (!firstResponse) {
    return null;
  }
  
  // Calculate time difference
  const created = this.createdAt;
  const responded = firstResponse.createdAt;
  const diff = responded - created;
  
  // Convert milliseconds to hours
  return Math.round(diff / (1000 * 60 * 60) * 10) / 10;
});

// Virtual for time to resolution
SupportTicketSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedAt) {
    return null;
  }
  
  // Calculate time difference
  const created = this.createdAt;
  const resolved = this.resolvedAt;
  const diff = resolved - created;
  
  // Convert milliseconds to hours
  return Math.round(diff / (1000 * 60 * 60) * 10) / 10;
});

module.exports = mongoose.model('SupportTicket', SupportTicketSchema); 