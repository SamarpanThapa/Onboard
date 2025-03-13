const OnboardingTemplate = require('../models/OnboardingTemplate');
const { validationResult } = require('express-validator');

// Create a new onboarding template
exports.createTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const templateData = {
      ...req.body,
      createdBy: req.user.id,
      lastModifiedBy: req.user.id
    };

    const template = new OnboardingTemplate(templateData);
    await template.save();

    res.status(201).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error creating onboarding template:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating onboarding template',
      error: error.message
    });
  }
};

// Get all onboarding templates
exports.getAllTemplates = async (req, res) => {
  try {
    const templates = await OnboardingTemplate.find()
      .populate('createdBy', 'fullName email')
      .populate('lastModifiedBy', 'fullName email');

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching onboarding templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching onboarding templates',
      error: error.message
    });
  }
};

// Get template by ID
exports.getTemplateById = async (req, res) => {
  try {
    const template = await OnboardingTemplate.findById(req.params.id)
      .populate('createdBy', 'fullName email')
      .populate('lastModifiedBy', 'fullName email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error fetching onboarding template:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching onboarding template',
      error: error.message
    });
  }
};

// Update template
exports.updateTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const updateData = {
      ...req.body,
      lastModifiedBy: req.user.id
    };

    const template = await OnboardingTemplate.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName email')
      .populate('lastModifiedBy', 'fullName email');

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding template not found'
      });
    }

    res.status(200).json({
      success: true,
      data: template
    });
  } catch (error) {
    console.error('Error updating onboarding template:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating onboarding template',
      error: error.message
    });
  }
};

// Delete template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await OnboardingTemplate.findByIdAndDelete(req.params.id);

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding template not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Onboarding template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting onboarding template:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting onboarding template',
      error: error.message
    });
  }
};

// Get templates by department
exports.getTemplatesByDepartment = async (req, res) => {
  try {
    const templates = await OnboardingTemplate.find({ 
      department: req.params.department,
      isActive: true 
    }).populate('createdBy', 'fullName email')
      .populate('lastModifiedBy', 'fullName email');

    res.status(200).json({
      success: true,
      count: templates.length,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching department templates:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching department templates',
      error: error.message
    });
  }
}; 