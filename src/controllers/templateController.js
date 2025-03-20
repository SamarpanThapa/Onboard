const { validationResult } = require('express-validator');
const Document = require('../models/Document');
const path = require('path');
const fs = require('fs');

// @desc    Create a new template
// @route   POST /api/templates
// @access  Private (HR/Admin only)
exports.createTemplate = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a template file'
      });
    }

    const { 
      title, 
      description, 
      documentType, 
      category,
      visibility = 'company',
      tags = []
    } = req.body;

    // Create template document
    const template = await Document.create({
      title,
      description,
      documentType,
      category,
      file: {
        fileName: req.file.filename,
        filePath: req.file.path,
        fileType: path.extname(req.file.originalname).substring(1),
        fileSize: req.file.size,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      },
      isTemplate: true,
      visibility,
      tags: typeof tags === 'string' ? JSON.parse(tags) : tags,
      createdBy: req.user.id,
      createdAt: new Date(),
      version: '1.0'
    });

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all templates
// @route   GET /api/templates
// @access  Private
exports.getTemplates = async (req, res) => {
  try {
    // Build query with filters
    const query = { isTemplate: true };

    // Filter by document type
    if (req.query.documentType) {
      query.documentType = req.query.documentType;
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by search term in title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Document.countDocuments(query);

    // Get templates with pagination
    const templates = await Document.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(req.query.sort ? { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 } : { createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination results
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
      count: templates.length,
      pagination,
      total,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single template
// @route   GET /api/templates/:id
// @access  Private
exports.getTemplate = async (req, res) => {
  try {
    const template = await Document.findOne({
      _id: req.params.id,
      isTemplate: true
    })
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update a template
// @route   PUT /api/templates/:id
// @access  Private (HR/Admin only)
exports.updateTemplate = async (req, res) => {
  try {
    let template = await Document.findOne({
      _id: req.params.id,
      isTemplate: true
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Handle file update if a new file is uploaded
    if (req.file) {
      // Store old file path to delete after update
      const oldFilePath = template.file.filePath;
      
      // Update file information
      req.body.file = {
        fileName: req.file.filename,
        filePath: req.file.path,
        fileType: path.extname(req.file.originalname).substring(1),
        fileSize: req.file.size,
        uploadedAt: new Date(),
        uploadedBy: req.user.id
      };

      // Add previous version
      if (!template.previousVersions) {
        template.previousVersions = [];
      }
      
      template.previousVersions.push({
        version: template.version,
        filePath: oldFilePath,
        updatedAt: new Date(),
        updatedBy: req.user.id
      });

      // Increment version
      const versionParts = template.version.split('.');
      const minor = parseInt(versionParts[1] || 0) + 1;
      template.version = `${versionParts[0]}.${minor}`;
    }

    // Handle tags if they're sent as a string
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }

    // Add update tracking
    req.body.updatedBy = req.user.id;
    req.body.updatedAt = new Date();

    // Update template
    template = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete a template
// @route   DELETE /api/templates/:id
// @access  Private (HR/Admin only)
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Document.findOne({
      _id: req.params.id,
      isTemplate: true
    });

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Delete the file from storage
    if (template.file && template.file.filePath) {
      try {
        const fullPath = path.join(__dirname, '../../', template.file.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      } catch (fileError) {
        console.error('Error deleting template file:', fileError);
      }
    }

    // Delete all previous versions' files
    if (template.previousVersions) {
      for (const version of template.previousVersions) {
        try {
          const versionPath = path.join(__dirname, '../../', version.filePath);
          if (fs.existsSync(versionPath)) {
            fs.unlinkSync(versionPath);
          }
        } catch (fileError) {
          console.error(`Error deleting version file: ${version.filePath}`, fileError);
        }
      }
    }

    // Delete the document from the database
    await template.remove();

    res.status(200).json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 