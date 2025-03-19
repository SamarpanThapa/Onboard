const { validationResult } = require('express-validator');
const OnboardingTemplate = require('../models/OnboardingTemplate');

// @desc    Create an onboarding template
// @route   POST /api/onboarding-templates
// @access  Private (IT Admins and Department Admins)
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

    // Add user to request body
    req.body.createdBy = req.user._id;
    
    // If IT admin, they can create for any department
    // If department admin, they can only create for their department
    if (req.user.role === 'department_admin' && req.body.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to create templates for other departments'
      });
    }

    // Create template
    const template = await OnboardingTemplate.create(req.body);

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all onboarding templates
// @route   GET /api/onboarding-templates
// @access  Private (IT Admins see all, Department Admins see their department)
exports.getTemplates = async (req, res) => {
  try {
    let query;

    // If IT Admin, get all templates
    // If Department Admin, get only their department templates
    if (req.user.role === 'it_admin') {
      query = {};
    } else {
      query = { department: req.user.department };
    }

    // Add other filters from query params
    if (req.query.department) {
      query.department = req.query.department;
    }

    if (req.query.isActive) {
      query.isActive = req.query.isActive === 'true';
    }

    const templates = await OnboardingTemplate.find(query)
      .populate('createdBy', 'name email')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single onboarding template
// @route   GET /api/onboarding-templates/:id
// @access  Private
exports.getTemplate = async (req, res) => {
  try {
    const template = await OnboardingTemplate.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if user has access to this template
    if (req.user.role !== 'it_admin' && template.department !== req.user.department) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this template'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update an onboarding template
// @route   PUT /api/onboarding-templates/:id
// @access  Private
exports.updateTemplate = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let template = await OnboardingTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if user has access to update this template
    if (
      req.user.role !== 'it_admin' && 
      (template.department !== req.user.department || 
      String(template.createdBy) !== String(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this template'
      });
    }

    // Update template
    template = await OnboardingTemplate.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete an onboarding template
// @route   DELETE /api/onboarding-templates/:id
// @access  Private
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await OnboardingTemplate.findById(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template not found'
      });
    }

    // Check if user has access to delete this template
    if (
      req.user.role !== 'it_admin' && 
      (template.department !== req.user.department || 
      String(template.createdBy) !== String(req.user._id))
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this template'
      });
    }

    await template.deleteOne();

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