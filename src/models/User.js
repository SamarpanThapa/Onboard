const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [6, 'Password must be at least 6 characters long']
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  role: {
    type: String,
    enum: ['employee', 'department_admin', 'hr_admin', 'it_admin'],
    default: 'employee'
  },
  department: {
    type: String,
    required: [true, 'Please provide a department'],
    trim: true
  },
  companyName: {
    type: String,
    trim: true
  },
  position: {
    type: String,
    trim: true
  },
  isFirstLogin: {
    type: Boolean,
    default: true
  },
  // Personal information for onboarding
  personalInfo: {
    firstName: String,
    lastName: String,
    middleName: String,
    dateOfBirth: Date,
    ssn: String, // Social Security Number (encrypted)
    passportNumber: String,
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: String
    },
    phoneNumber: String,
    emergencyContact: {
      name: String,
      relationship: String,
      phoneNumber: String
    }
  },
  // Employment details
  employmentDetails: {
    employeeId: String,
    startDate: Date,
    endDate: Date,
    contractType: {
      type: String,
      enum: ['full-time', 'part-time', 'contract', 'intern', 'other'],
      default: 'full-time'
    },
    salary: {
      amount: Number,
      currency: String
    },
    manager: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    bankDetails: {
      accountName: String,
      accountNumber: String,
      routingNumber: String,
      bankName: String
    }
  },
  // Onboarding status
  onboarding: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed'],
      default: 'not_started'
    },
    completedSteps: [{
      step: String,
      completedAt: Date
    }],
    welcomeMessageSent: {
      type: Boolean,
      default: false
    },
    documentsSubmitted: {
      type: Boolean,
      default: false
    }
  },
  // Offboarding information
  offboarding: {
    status: {
      type: String,
      enum: ['not_started', 'in_progress', 'completed', 'not_applicable'],
      default: 'not_applicable'
    },
    reason: String,
    exitDate: Date,
    exitInterviewCompleted: Boolean,
    companyAssetsReturned: [{
      assetId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Asset'
      },
      assetName: String,
      returnStatus: {
        type: String,
        enum: ['pending', 'returned', 'damaged', 'lost'],
        default: 'pending'
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      returnDate: Date
    }],
    accountDeactivated: {
      status: Boolean,
      deactivatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      deactivationDate: Date
    }
  },
  // Communications
  communications: {
    unreadMessages: {
      type: Number,
      default: 0
    },
    notifications: [{
      message: String,
      read: {
        type: Boolean,
        default: false
      },
      createdAt: {
        type: Date,
        default: Date.now
      },
      type: {
        type: String,
        enum: ['task', 'compliance', 'system', 'feedback'],
        default: 'system'
      },
      relatedTo: {
        model: String,
        id: mongoose.Schema.Types.ObjectId
      }
    }]
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  
  // Encrypt sensitive data like SSN if provided
  if (this.personalInfo && this.personalInfo.ssn) {
    const ssnSalt = await bcrypt.genSalt(10);
    this.personalInfo.ssn = await bcrypt.hash(this.personalInfo.ssn, ssnSalt);
  }
  
  next();
});

// Match user entered password to hashed password in database
UserSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema); 