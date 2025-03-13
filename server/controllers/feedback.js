const Feedback = require('../models/Feedback');

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private (HR, IT)
exports.getFeedback = async (req, res, next) => {
  try {
    // Only HR and IT can see all feedback
    if (req.user.role !== 'hr' && req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access all feedback`
      });
    }

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
    query = Feedback.find(JSON.parse(queryStr));

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
    const total = await Feedback.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Populate
    query = query.populate({
      path: 'submittedBy',
      select: 'fullName email'
    }).populate({
      path: 'reviewedBy',
      select: 'fullName email'
    });

    // Executing query
    const feedback = await query;

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
      count: feedback.length,
      pagination,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's feedback
// @route   GET /api/feedback/me
// @access  Private
exports.getUserFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ submittedBy: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private
exports.getSingleFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate({
        path: 'submittedBy',
        select: 'fullName email'
      })
      .populate({
        path: 'reviewedBy',
        select: 'fullName email'
      });

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: `Feedback not found with id of ${req.params.id}`
      });
    }

    // Make sure user is feedback owner or has appropriate role
    if (
      feedback.submittedBy._id.toString() !== req.user.id &&
      req.user.role !== 'hr' &&
      req.user.role !== 'it'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this feedback`
      });
    }

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new feedback
// @route   POST /api/feedback
// @access  Private
exports.createFeedback = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.submittedBy = req.user.id;

    const feedback = await Feedback.create(req.body);

    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update feedback (review)
// @route   PUT /api/feedback/:id
// @access  Private (HR, IT)
exports.updateFeedback = async (req, res, next) => {
  try {
    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: `Feedback not found with id of ${req.params.id}`
      });
    }

    // Make sure user has appropriate role
    if (req.user.role !== 'hr' && req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update feedback`
      });
    }

    // Add reviewer info
    req.body.reviewedBy = req.user.id;

    feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private (HR, IT, or owner)
exports.deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({
        success: false,
        message: `Feedback not found with id of ${req.params.id}`
      });
    }

    // Make sure user is feedback owner or has appropriate role
    if (
      feedback.submittedBy.toString() !== req.user.id &&
      req.user.role !== 'hr' &&
      req.user.role !== 'it'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete this feedback`
      });
    }

    await feedback.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 