const Compliance = require('../models/Compliance');
const User = require('../models/User');

// @desc    Get all compliance items
// @route   GET /api/compliance
// @access  Private
exports.getComplianceItems = async (req, res, next) => {
  try {
    let query;

    // Copy req.query
    const reqQuery = { ...req.query };

    // Fields to exclude
    const removeFields = ['select', 'sort', 'page', 'limit'];

    // Loop over removeFields and delete them from reqQuery
    removeFields.forEach(param => delete reqQuery[param]);

    // Create query string
    let queryStr = JSON.stringify(reqQuery);

    // Create operators ($gt, $gte, etc)
    queryStr = queryStr.replace(/\b(gt|gte|lt|lte|in)\b/g, match => `$${match}`);

    // Finding resource
    query = Compliance.find(JSON.parse(queryStr));

    // If user is not HR or IT, only show their compliance items
    if (req.user.role !== 'hr' && req.user.role !== 'it') {
      query = query.find({ assignedTo: req.user.id });
    }

    // Select Fields
    if (req.query.select) {
      const fields = req.query.select.split(',').join(' ');
      query = query.select(fields);
    }

    // Sort
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Compliance.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Populate
    query = query.populate({
      path: 'assignedTo',
      select: 'fullName email'
    }).populate({
      path: 'createdBy',
      select: 'fullName email'
    });

    // Executing query
    const complianceItems = await query;

    // Pagination result
    const pagination = {};

    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }

    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: complianceItems.length,
      pagination,
      data: complianceItems
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single compliance item
// @route   GET /api/compliance/:id
// @access  Private
exports.getComplianceItem = async (req, res, next) => {
  try {
    const complianceItem = await Compliance.findById(req.params.id)
      .populate({
        path: 'assignedTo',
        select: 'fullName email'
      })
      .populate({
        path: 'createdBy',
        select: 'fullName email'
      });

    if (!complianceItem) {
      return res.status(404).json({
        success: false,
        message: `Compliance item not found with id of ${req.params.id}`
      });
    }

    // Make sure user is compliance item owner or has appropriate role
    if (
      complianceItem.assignedTo._id.toString() !== req.user.id &&
      req.user.role !== 'hr' &&
      req.user.role !== 'it'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this compliance item`
      });
    }

    res.status(200).json({
      success: true,
      data: complianceItem
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new compliance item
// @route   POST /api/compliance
// @access  Private (HR, IT)
exports.createComplianceItem = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.createdBy = req.user.id;

    // Check if user exists
    const user = await User.findById(req.body.assignedTo);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with id of ${req.body.assignedTo}`
      });
    }

    // Handle file upload
    if (req.file) {
      req.body.documentPath = req.file.path.replace(/\\/g, '/');
    }

    const complianceItem = await Compliance.create(req.body);

    res.status(201).json({
      success: true,
      data: complianceItem
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update compliance item
// @route   PUT /api/compliance/:id
// @access  Private
exports.updateComplianceItem = async (req, res, next) => {
  try {
    let complianceItem = await Compliance.findById(req.params.id);

    if (!complianceItem) {
      return res.status(404).json({
        success: false,
        message: `Compliance item not found with id of ${req.params.id}`
      });
    }

    // Make sure user is compliance item owner or has appropriate role
    if (
      complianceItem.assignedTo.toString() !== req.user.id &&
      req.user.role !== 'hr' &&
      req.user.role !== 'it'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this compliance item`
      });
    }

    // Handle file upload
    if (req.file) {
      req.body.documentPath = req.file.path.replace(/\\/g, '/');
    }

    // If compliance item is being marked as completed, add completedAt date
    if (req.body.status === 'completed' && complianceItem.status !== 'completed') {
      req.body.completedAt = Date.now();
    }

    // Update timestamp
    req.body.updatedAt = Date.now();

    complianceItem = await Compliance.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: complianceItem
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete compliance item
// @route   DELETE /api/compliance/:id
// @access  Private (HR, IT)
exports.deleteComplianceItem = async (req, res, next) => {
  try {
    const complianceItem = await Compliance.findById(req.params.id);

    if (!complianceItem) {
      return res.status(404).json({
        success: false,
        message: `Compliance item not found with id of ${req.params.id}`
      });
    }

    // Make sure user has appropriate role
    if (req.user.role !== 'hr' && req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete compliance items`
      });
    }

    await complianceItem.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 