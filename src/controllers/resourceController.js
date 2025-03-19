const { validationResult } = require('express-validator');
const Resource = require('../models/Resource');
const path = require('path');
const fs = require('fs');

// @desc    Create a resource
// @route   POST /api/resources
// @access  Private (IT Admins and Department Admins)
exports.createResource = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Add user to request body
    req.body.uploadedBy = req.user._id;

    // Check if department admin is creating for their department
    if (req.user.role === 'department_admin' && req.body.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create resources for other departments'
      });
    }

    // Handle file upload if file is included
    if (req.file) {
      req.body.fileUrl = `/uploads/${req.file.filename}`;
      req.body.type = req.body.type || 'document';
    } else if (req.body.externalUrl) {
      // Check if it's a video URL (simple check)
      if (req.body.externalUrl.includes('youtube.com') || req.body.externalUrl.includes('vimeo.com')) {
        req.body.type = 'video';
      } else {
        req.body.type = 'link';
      }
    }

    // Create resource
    const resource = await Resource.create(req.body);

    // Populate user information
    await resource.populate('uploadedBy', 'name email department');

    res.status(201).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all resources
// @route   GET /api/resources
// @access  Private
exports.getResources = async (req, res) => {
  try {
    let query = {};

    // For employees, only show resources for their department or public resources
    if (req.user.role === 'employee') {
      query.$or = [
        { department: req.user.department },
        { isPublic: true }
      ];
    } 
    // Department admins can see their department resources
    else if (req.user.role === 'department_admin') {
      if (req.query.department) {
        // If they specifically request another department, show only public resources
        if (req.query.department !== req.user.department) {
          query.$and = [
            { department: req.query.department },
            { isPublic: true }
          ];
        } else {
          query.department = req.user.department;
        }
      } else {
        // By default, show all resources from their department
        query.department = req.user.department;
      }
    } 
    // IT admins can see all resources
    else if (req.user.role === 'it_admin') {
      // Filter by department if provided
      if (req.query.department) {
        query.department = req.query.department;
      }
    }

    // Filter by type if provided
    if (req.query.type) {
      query.type = req.query.type;
    }

    // Filter by search term if provided
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: searchRegex }
      ];
    }

    const resources = await Resource.find(query)
      .populate('uploadedBy', 'name email department')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: resources.length,
      data: resources
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single resource
// @route   GET /api/resources/:id
// @access  Private
exports.getResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id)
      .populate('uploadedBy', 'name email department');

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check if user has access to this resource
    if (
      req.user.role === 'employee' &&
      resource.department !== req.user.department &&
      !resource.isPublic
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    if (
      req.user.role === 'department_admin' &&
      resource.department !== req.user.department &&
      !resource.isPublic
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this resource'
      });
    }

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update a resource
// @route   PUT /api/resources/:id
// @access  Private
exports.updateResource = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check if user has access to update this resource
    if (
      req.user.role !== 'it_admin' &&
      (resource.department !== req.user.department ||
        String(resource.uploadedBy) !== String(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this resource'
      });
    }

    // Handle file upload if file is included
    if (req.file) {
      // Delete old file if exists
      if (resource.fileUrl) {
        const oldFilePath = path.join(__dirname, '../../public', resource.fileUrl);
        if (fs.existsSync(oldFilePath)) {
          fs.unlinkSync(oldFilePath);
        }
      }
      req.body.fileUrl = `/uploads/${req.file.filename}`;
      req.body.type = req.body.type || 'document';
    }

    // Update resource
    resource = await Resource.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('uploadedBy', 'name email department');

    res.status(200).json({
      success: true,
      data: resource
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete a resource
// @route   DELETE /api/resources/:id
// @access  Private
exports.deleteResource = async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);

    if (!resource) {
      return res.status(404).json({
        success: false,
        message: 'Resource not found'
      });
    }

    // Check if user has access to delete this resource
    if (
      req.user.role !== 'it_admin' &&
      (resource.department !== req.user.department ||
        String(resource.uploadedBy) !== String(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this resource'
      });
    }

    // Delete file if exists
    if (resource.fileUrl) {
      const filePath = path.join(__dirname, '../../public', resource.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await resource.deleteOne();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 