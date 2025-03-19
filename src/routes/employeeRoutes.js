const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

/**
 * @route GET /api/employees
 * @desc Get all employees
 * @access Private (Admin/HR/Manager)
 */
router.get('/',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'hr', 'manager']),
  employeeController.getEmployees
);

/**
 * @route GET /api/employees/me
 * @desc Get current employee details
 * @access Private
 */
router.get('/me',
  auth.authenticateToken,
  employeeController.getCurrentEmployee
);

/**
 * @route PUT /api/employees/me
 * @desc Update current employee details
 * @access Private
 */
router.put('/me',
  auth.authenticateToken,
  [
    body('phoneNumber')
      .optional()
      .trim(),
    body('address')
      .optional()
      .trim(),
    body('emergencyContact')
      .optional()
      .isObject()
      .withMessage('Emergency contact must be an object'),
    body('emergencyContact.name')
      .optional()
      .trim(),
    body('emergencyContact.phoneNumber')
      .optional()
      .trim(),
    body('emergencyContact.relationship')
      .optional()
      .trim()
  ],
  employeeController.updateEmployee
);

/**
 * @route PUT /api/employees/me/status
 * @desc Update employee status (compliance, etc.)
 * @access Private
 */
router.put('/me/status',
  auth.authenticateToken,
  employeeController.updateStatus
);

/**
 * @route GET /api/employees/:id
 * @desc Get employee by ID
 * @access Private (Admin/HR/Manager)
 */
router.get('/:id',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'hr', 'manager']),
  employeeController.getEmployeeById
);

/**
 * @route PUT /api/employees/:id
 * @desc Update employee by ID
 * @access Private (Admin/HR)
 */
router.put('/:id',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'hr']),
  employeeController.updateEmployeeById
);

/**
 * @route PUT /api/employees/:id/onboarding
 * @desc Update employee onboarding status
 * @access Private (Admin/HR)
 */
router.put('/:id/onboarding',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'hr']),
  [
    body('status')
      .isIn(['not_started', 'in_progress', 'completed'])
      .withMessage('Invalid onboarding status')
  ],
  employeeController.updateOnboardingStatus
);

/**
 * @route GET /api/employees/:id/documents
 * @desc Get employee's documents
 * @access Private (Owner/Admin/HR)
 */
router.get('/:id/documents',
  auth.authenticateToken,
  employeeController.getEmployeeDocuments
);

/**
 * @route GET /api/employees/:id/tasks
 * @desc Get employee's tasks
 * @access Private (Owner/Admin/HR/Manager)
 */
router.get('/:id/tasks',
  auth.authenticateToken,
  employeeController.getEmployeeTasks
);

module.exports = router; 