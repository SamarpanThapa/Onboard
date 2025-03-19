const { validationResult } = require('express-validator');
const DepartmentCode = require('../models/DepartmentCode');

// @desc    Create a department code
// @route   POST /api/department-codes
// @access  Private (IT Admins only)
exports.createDepartmentCode = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { code, department, description, allowedRoles, expiresAt } = req.body;

    // Check if code already exists
    const codeExists = await DepartmentCode.findOne({ code });
    if (codeExists) {
      return res.status(400).json({
        success: false,
        message: 'Department code already exists'
      });
    }

    // Create department code
    const departmentCode = await DepartmentCode.create({
      code,
      department,
      description,
      allowedRoles: allowedRoles || ['employee'],
      createdBy: req.user._id,
      expiresAt: expiresAt || null
    });

    res.status(201).json({
      success: true,
      data: departmentCode
    });
  } catch (error) {
    console.error('Create department code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all department codes
// @route   GET /api/department-codes
// @access  Private (IT Admins only)
exports.getDepartmentCodes = async (req, res) => {
  try {
    const departmentCodes = await DepartmentCode.find()
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: departmentCodes.length,
      data: departmentCodes
    });
  } catch (error) {
    console.error('Get department codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single department code
// @route   GET /api/department-codes/:id
// @access  Private (IT Admins only)
exports.getDepartmentCode = async (req, res) => {
  try {
    const departmentCode = await DepartmentCode.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!departmentCode) {
      return res.status(404).json({
        success: false,
        message: 'Department code not found'
      });
    }

    res.status(200).json({
      success: true,
      data: departmentCode
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update a department code
// @route   PUT /api/department-codes/:id
// @access  Private (IT Admins only)
exports.updateDepartmentCode = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const updateData = req.body;

    // Check if department code exists
    let departmentCode = await DepartmentCode.findById(id);
    if (!departmentCode) {
      return res.status(404).json({
        success: false,
        message: 'Department code not found'
      });
    }

    // Update department code
    departmentCode = await DepartmentCode.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      data: departmentCode
    });
  } catch (error) {
    console.error('Update department code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete a department code
// @route   DELETE /api/department-codes/:id
// @access  Private (IT Admins only)
exports.deleteDepartmentCode = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department code exists
    const departmentCode = await DepartmentCode.findById(id);
    if (!departmentCode) {
      return res.status(404).json({
        success: false,
        message: 'Department code not found'
      });
    }

    // Delete department code
    await departmentCode.remove();

    res.status(200).json({
      success: true,
      message: 'Department code deleted successfully'
    });
  } catch (error) {
    console.error('Delete department code error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Verify a department code
// @route   POST /api/department-codes/verify
// @access  Public
exports.verifyDepartmentCode = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { code } = req.body;

    // Verify department code using static method
    const verification = await DepartmentCode.verifyCode(code);

    res.status(200).json({
      success: true,
      isValid: verification.isValid,
      department: verification.department,
      allowedRoles: verification.allowedRoles
    });
  } catch (error) {
    console.error('Department code verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get active department codes
// @route   GET /api/department-codes/active
// @access  Private/IT Admin
exports.getActiveDepartmentCodes = async (req, res) => {
  try {
    const departmentCodes = await DepartmentCode.find({ 
      isActive: true,
      $or: [
        { expiresAt: { $gt: new Date() } },
        { expiresAt: null }
      ]
    })
    .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: departmentCodes.length,
      data: departmentCodes
    });
  } catch (error) {
    console.error('Get active department codes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 