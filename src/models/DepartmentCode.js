const mongoose = require('mongoose');

const DepartmentCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide a code'],
    unique: true,
    trim: true
  },
  department: {
    type: String,
    required: [true, 'Please provide a department name'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  allowedRoles: {
    type: [String],
    enum: ['employee', 'department_admin', 'hr_admin', 'it_admin'],
    default: ['employee']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date
  }
});

// Create department code verification method
DepartmentCodeSchema.statics.verifyCode = async function(code) {
  const departmentCode = await this.findOne({ 
    code,
    isActive: true,
    $or: [
      { expiresAt: { $gt: new Date() } },
      { expiresAt: null }
    ]
  });

  return {
    isValid: !!departmentCode,
    department: departmentCode ? departmentCode.department : null,
    allowedRoles: departmentCode ? departmentCode.allowedRoles : []
  };
};

module.exports = mongoose.model('DepartmentCode', DepartmentCodeSchema); 