const mongoose = require('mongoose');

const DepartmentCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Please provide a department code'],
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: [true, 'Please provide an expiration date']
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create index for faster queries
DepartmentCodeSchema.index({ isActive: 1 });

// Static method to check if a code is valid
DepartmentCodeSchema.statics.isValidCode = async function(code) {
  const departmentCode = await this.findOne({ 
    code, 
    isActive: true,
    expiresAt: { $gt: new Date() }
  });
  
  return !!departmentCode;
};

// Generate a new department code
DepartmentCodeSchema.statics.generateCode = function() {
  const year = new Date().getFullYear();
  const randomDigits = Math.floor(10 + Math.random() * 90); // Random 2-digit number
  return `IT${year}${randomDigits}`;
};

module.exports = mongoose.model('DepartmentCode', DepartmentCodeSchema); 