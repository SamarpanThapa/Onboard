const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res, next) => {
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
    query = Task.find(JSON.parse(queryStr));

    // If user is not HR or IT, only show their tasks
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
    const total = await Task.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Populate
    query = query.populate({
      path: 'assignedTo',
      select: 'fullName email'
    }).populate({
      path: 'assignedBy',
      select: 'fullName email'
    });

    // Executing query
    const tasks = await query;

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
      count: tasks.length,
      pagination,
      data: tasks
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate({
        path: 'assignedTo',
        select: 'fullName email'
      })
      .populate({
        path: 'assignedBy',
        select: 'fullName email'
      });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task not found with id of ${req.params.id}`
      });
    }

    // Make sure user is task owner or has appropriate role
    if (
      task.assignedTo._id.toString() !== req.user.id &&
      req.user.role !== 'hr' &&
      req.user.role !== 'it'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this task`
      });
    }

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (HR, IT)
exports.createTask = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.assignedBy = req.user.id;

    // Check if user exists
    const user = await User.findById(req.body.assignedTo);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: `User not found with id of ${req.body.assignedTo}`
      });
    }

    const task = await Task.create(req.body);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res, next) => {
  try {
    let task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task not found with id of ${req.params.id}`
      });
    }

    // Make sure user is task owner or has appropriate role
    if (
      task.assignedTo.toString() !== req.user.id &&
      req.user.role !== 'hr' &&
      req.user.role !== 'it'
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update this task`
      });
    }

    // If task is being marked as completed, add completedAt date
    if (req.body.status === 'completed' && task.status !== 'completed') {
      req.body.completedAt = Date.now();
    }

    task = await Task.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: task
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (HR, IT)
exports.deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id);

    if (!task) {
      return res.status(404).json({
        success: false,
        message: `Task not found with id of ${req.params.id}`
      });
    }

    // Make sure user has appropriate role
    if (req.user.role !== 'hr' && req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete tasks`
      });
    }

    await task.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
}; 