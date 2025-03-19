const mongoose = require('mongoose');

const AssetSchema = new mongoose.Schema({
  assetType: {
    type: String,
    enum: ['hardware', 'software', 'peripheral', 'other'],
    required: true
  },
  name: {
    type: String,
    required: [true, 'Please provide asset name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  // For hardware
  hardwareDetails: {
    serialNumber: String,
    manufacturer: String,
    model: String,
    purchaseDate: Date,
    warrantyExpiry: Date,
    purchaseCost: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    condition: {
      type: String,
      enum: ['new', 'good', 'fair', 'poor', 'retired'],
      default: 'new'
    }
  },
  // For software
  softwareDetails: {
    licenseKey: String,
    version: String,
    licenseType: {
      type: String,
      enum: ['single-user', 'multi-user', 'enterprise', 'subscription', 'free', 'other'],
      default: 'other'
    },
    expiryDate: Date,
    vendor: String,
    seats: Number, // Number of users allowed
    annualCost: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    }
  },
  // Assigned to
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  assignedDate: Date,
  returnDate: Date,
  status: {
    type: String,
    enum: ['available', 'assigned', 'maintenance', 'retired', 'lost'],
    default: 'available'
  },
  location: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  notes: String,
  attachments: [{
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  // Audit information
  created: {
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
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
    at: Date
  },
  // For tracking maintenance history
  maintenanceHistory: [{
    type: {
      type: String,
      enum: ['repair', 'upgrade', 'inspection', 'other'],
      default: 'other'
    },
    date: Date,
    performedBy: String,
    cost: {
      amount: Number,
      currency: {
        type: String,
        default: 'USD'
      }
    },
    description: String,
    notes: String
  }]
});

module.exports = mongoose.model('Asset', AssetSchema); 