const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  // Department name
  name: {
    type: String,
    required: [true, 'Please provide a department name'],
    trim: true,
    unique: true
  },
  // Department code (for system references)
  code: {
    type: String,
    required: [true, 'Please provide a department code'],
    trim: true,
    unique: true,
    uppercase: true
  },
  // Department description
  description: {
    type: String,
    trim: true
  },
  // Whether this is an active department
  active: {
    type: Boolean,
    default: true
  },
  // Department head/manager
  head: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: String,
    title: String,
    email: String,
    dateAssigned: {
      type: Date,
      default: Date.now
    }
  },
  // Parent department (if this is a sub-department)
  parentDepartment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  },
  // Child departments/teams
  childDepartments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department'
  }],
  // Teams within this department
  teams: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: String,
    teamLead: {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      email: String
    },
    members: [{
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      name: String,
      role: String,
      joinedDate: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  // Budget information
  budget: {
    fiscalYear: String,
    totalBudget: Number,
    allocatedBudget: Number,
    spentBudget: Number,
    currency: {
      type: String,
      default: 'USD'
    },
    lastUpdated: Date
  },
  // Location information
  location: {
    building: String,
    floor: String,
    office: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    }
  },
  // Department contacts
  contacts: [{
    name: String,
    title: String,
    email: String,
    phone: String,
    primary: {
      type: Boolean,
      default: false
    },
    contactType: {
      type: String,
      enum: ['general', 'billing', 'technical', 'hr', 'emergency', 'other'],
      default: 'general'
    }
  }],
  // Department policies and procedures
  policies: [{
    title: String,
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document'
    },
    description: String,
    effective: {
      type: Boolean,
      default: true
    },
    effectiveDate: Date,
    reviewDate: Date
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
  // Department metrics
  metrics: {
    employeeCount: {
      type: Number,
      default: 0
    },
    averagePerformanceScore: Number,
    turnoverRate: Number,
    lastCalculated: Date
  }
});

// Set updatedAt before update
DepartmentSchema.pre('findOneAndUpdate', function(next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Create indexes for efficient queries
DepartmentSchema.index({ active: 1 });
DepartmentSchema.index({ parentDepartment: 1 });
DepartmentSchema.index({ 'head.userId': 1 });

module.exports = mongoose.model('Department', DepartmentSchema); 