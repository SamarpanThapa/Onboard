const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const auth = require('../middleware/auth');
const { checkRole } = require('../middleware/checkRole');
const {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  getTemplatesByDepartment
} = require('../controllers/onboardingTemplateController');

// Validation middleware
const templateValidation = [
  check('name', 'Template name is required').not().isEmpty(),
  check('department', 'Department is required').not().isEmpty(),
  check('tasks', 'Tasks must be an array').isArray(),
  check('tasks.*.title', 'Task title is required').not().isEmpty(),
  check('tasks.*.assignedTo', 'Task assignee is required').not().isEmpty(),
  check('duration', 'Duration must be a number').optional().isNumeric()
];

// Create template - IT and HR only
router.post(
  '/',
  [auth, checkRole(['it', 'hr']), ...templateValidation],
  createTemplate
);

// Get all templates - IT and HR only
router.get(
  '/',
  [auth, checkRole(['it', 'hr'])],
  getAllTemplates
);

// Get template by ID - IT and HR only
router.get(
  '/:id',
  [auth, checkRole(['it', 'hr'])],
  getTemplateById
);

// Update template - IT and HR only
router.put(
  '/:id',
  [auth, checkRole(['it', 'hr']), ...templateValidation],
  updateTemplate
);

// Delete template - IT and HR only
router.delete(
  '/:id',
  [auth, checkRole(['it', 'hr'])],
  deleteTemplate
);

// Get templates by department - IT and HR only
router.get(
  '/department/:department',
  [auth, checkRole(['it', 'hr'])],
  getTemplatesByDepartment
);

module.exports = router; 