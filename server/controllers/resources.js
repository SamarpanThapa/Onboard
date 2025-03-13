const path = require('path');
const fs = require('fs');
const Resource = require('../models/Resource');

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
exports.getResources = async (req, res, next) => {
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
    query = Resource.find(JSON.parse(queryStr));

    // Filter by access role
    query = query.find({
      $or: [
        { accessRoles: 'all' },
        { accessRoles: req.user.role }
      ]
    });

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
    const total = await Resource.countDocuments(JSON.parse(queryStr));

    query = query.skip(startIndex).limit(limit);

    // Populate
    query = query.populate({
      path: 'uploadedBy',
      select: 'fullName email'
    });

    // Executing query
    const resources = await query;

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
      count: resources.length,
      pagination,
      data: resources
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single resource
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id).populate({
      path: 'uploadedBy',
      select: 'fullName email'
    });

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource not found with id of ${req.params.id}`
      });
    }

    // Check if user has access to this resource
    if (
      !resource.accessRoles.includes('all') &&
      !resource.accessRoles.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this resource`
      });
    }

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create new resource
// @route   POST /api/resources
// @access  Private (HR, IT)
exports.createResource = async (req, res, next) => {
  try {
    // Add user to req.body
    req.body.uploadedBy = req.user.id;

    // Handle file upload
    if (!req.file && req.body.resourceType !== 'link') {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    if (req.file) {
      req.body.filePath = req.file.path.replace(/\\/g, '/');
      req.body.fileSize = req.file.size;
    }

    const resource = await Resource.create(req.body);

    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (err) {
    // Clean up file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      });
    }
    next(err);
  }
};

// @desc    Update resource
// @route   PUT /api/resources/:id
// @access  Private (HR, IT)
exports.updateResource = async (req, res, next) => {
  try {
    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource not found with id of ${req.params.id}`
      });
    }

    // Make sure user has appropriate role
    if (req.user.role !== 'hr' && req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to update resources`
      });
    }

    // Handle file upload
    if (req.file) {
      // Delete old file if it exists
      if (resource.filePath) {
        try {
          fs.unlinkSync(resource.filePath);
        } catch (err) {
          console.error('Error deleting old file:', err);
        }
      }

      req.body.filePath = req.file.path.replace(/\\/g, '/');
      req.body.fileSize = req.file.size;
    }

    // Update timestamp
    req.body.updatedAt = Date.now();

    resource = await Resource.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (err) {
    // Clean up file if there was an error
    if (req.file) {
      fs.unlink(req.file.path, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
        }
      });
    }
    next(err);
  }
};

// @desc    Delete resource
// @route   DELETE /api/resources/:id
// @access  Private (HR, IT)
exports.deleteResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource not found with id of ${req.params.id}`
      });
    }

    // Make sure user has appropriate role
    if (req.user.role !== 'hr' && req.user.role !== 'it') {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to delete resources`
      });
    }

    // Delete file if it exists
    if (resource.filePath) {
      try {
        fs.unlinkSync(resource.filePath);
      } catch (err) {
        console.error('Error deleting file:', err);
      }
    }

    await resource.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Download resource
// @route   GET /api/resources/:id/download
// @access  Private
exports.downloadResource = async (req, res, next) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: `Resource not found with id of ${req.params.id}`
      });
    }

    // Check if user has access to this resource
    if (
      !resource.accessRoles.includes('all') &&
      !resource.accessRoles.includes(req.user.role)
    ) {
      return res.status(403).json({
        success: false,
        message: `User ${req.user.id} is not authorized to access this resource`
      });
    }

    // Check if resource is a link
    if (resource.resourceType === 'link') {
      return res.status(400).json({
        success: false,
        message: 'Cannot download a link resource'
      });
    }

    // Check if file exists
    if (!resource.filePath || !fs.existsSync(resource.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'Resource file not found'
      });
    }

    const fileName = path.basename(resource.filePath);
    res.download(resource.filePath, fileName);
  } catch (err) {
    next(err);
  }
}; 