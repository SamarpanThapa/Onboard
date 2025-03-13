const DepartmentCode = require('../models/DepartmentCode');

// @desc    Get all department codes
// @route   GET /api/department-codes
// @access  Private (IT)
exports.getDepartmentCodes = async (req, res, next) => {
  try {
    // Only IT personnel can access department codes
    if (req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access department codes`
      });
    }

    const departmentCodes = await DepartmentCode.find()
      .sort('-createdAt')
      .populate({
        path: 'createdBy',
        select: 'fullName email'
      });

    res.status(200).json({
      success: true,
      count: departmentCodes.length,
      data: departmentCodes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get active department codes
// @route   GET /api/department-codes/active
// @access  Private (IT)
exports.getActiveDepartmentCodes = async (req, res, next) => {
  try {
    // Only IT personnel can access department codes
    if (req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access department codes`
      });
    }

    const departmentCodes = await DepartmentCode.find({
      isActive: true,
      expiresAt: { $gt: new Date() }
    })
      .sort('-createdAt')
      .populate({
        path: 'createdBy',
        select: 'fullName email'
      });

    res.status(200).json({
      success: true,
      count: departmentCodes.length,
      data: departmentCodes
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new department code
// @route   POST /api/department-codes
// @access  Private (IT)
exports.createDepartmentCode = async (req, res, next) => {
  try {
    // Only IT personnel can create department codes
    if (req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to create department codes`
      });
    }

    // Generate a new code if not provided
    if (!req.body.code) {
      req.body.code = DepartmentCode.generateCode();
    }

    // Add user to req.body
    req.body.createdBy = req.user.id;

    // Set default expiration date if not provided (30 days from now)
    if (!req.body.expiresAt) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      req.body.expiresAt = expiresAt;
    }

    const departmentCode = await DepartmentCode.create(req.body);

    res.status(201).json({
      success: true,
      data: departmentCode
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update department code
// @route   PUT /api/department-codes/:id
// @access  Private (IT)
exports.updateDepartmentCode = async (req, res, next) => {
  try {
    // Only IT personnel can update department codes
    if (req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update department codes`
      });
    }

    let departmentCode = await DepartmentCode.findById(req.params.id);

    if (!departmentCode) {
      return res.status(404).json({
        success: false,
        message: `Department code not found with id of ${req.params.id}`
      });
    }

    departmentCode = await DepartmentCode.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: departmentCode
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete department code
// @route   DELETE /api/department-codes/:id
// @access  Private (IT)
exports.deleteDepartmentCode = async (req, res, next) => {
  try {
    // Only IT personnel can delete department codes
    if (req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete department codes`
      });
    }

    const departmentCode = await DepartmentCode.findById(req.params.id);

    if (!departmentCode) {
      return res.status(404).json({
        success: false,
        message: `Department code not found with id of ${req.params.id}`
      });
    }

    await departmentCode.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Verify department code
// @route   POST /api/department-codes/verify
// @access  Public
exports.verifyDepartmentCode = async (req, res, next) => {
  try {
    const { code } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a department code'
      });
    }

    const isValid = await DepartmentCode.isValidCode(code);

    res.status(200).json({
      success: true,
      isValid
    });
  } catch (err) {
    next(err);
  }
}; 