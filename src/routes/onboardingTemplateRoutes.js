const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/onboardingTemplateController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes are protected
router.use(protect);

// @route   POST /api/onboarding-templates
// @desc    Create an onboarding template
// @access  Private (IT Admins and Department Admins)
router.post(
  '/',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty()
  ],
  authorize('it_admin', 'department_admin'),
  createTemplate
);

// @route   GET /api/onboarding-templates
// @desc    Get all templates (filtered by department if Department Admin)
// @access  Private
router.get('/', getTemplates);

// @route   GET /api/onboarding-templates/:id
// @desc    Get a single template
// @access  Private
router.get('/:id', getTemplate);

// @route   PUT /api/onboarding-templates/:id
// @desc    Update a template
// @access  Private (IT Admins and Department Admins who created the template)
router.put(
  '/:id',
  [
    check('title', 'Title is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty()
  ],
  authorize('it_admin', 'department_admin'),
  updateTemplate
);

// @route   DELETE /api/onboarding-templates/:id
// @desc    Delete a template
// @access  Private (IT Admins and Department Admins who created the template)
router.delete(
  '/:id',
  authorize('it_admin', 'department_admin'),
  deleteTemplate
);

module.exports = router; 