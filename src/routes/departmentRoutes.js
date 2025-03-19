const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  createDepartment,
  getDepartments,
  getDepartment,
  updateDepartment,
  deleteDepartment,
  addTeamToDepartment,
  getDepartmentMetrics
} = require('../controllers/departmentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/departments
// @desc    Create a new department
// @access  Private (HR Admin only)
router.post(
  '/',
  protect,
  authorize('hr_admin'),
  [
    check('name', 'Department name is required').not().isEmpty(),
    check('code', 'Department code is required').not().isEmpty(),
    check('code', 'Department code must be between 2-10 characters').isLength({ min: 2, max: 10 })
  ],
  createDepartment
);

// @route   GET /api/departments
// @desc    Get all departments
// @access  Private
router.get('/', protect, getDepartments);

// @route   GET /api/departments/:id
// @desc    Get a single department
// @access  Private
router.get('/:id', protect, getDepartment);

// @route   PUT /api/departments/:id
// @desc    Update a department
// @access  Private (HR Admin only)
router.put(
  '/:id',
  protect,
  authorize('hr_admin'),
  updateDepartment
);

// @route   DELETE /api/departments/:id
// @desc    Delete a department
// @access  Private (HR Admin only)
router.delete(
  '/:id',
  protect,
  authorize('hr_admin'),
  deleteDepartment
);

// @route   POST /api/departments/:id/teams
// @desc    Add a team to a department
// @access  Private (HR Admin or Department Admin)
router.post(
  '/:id/teams',
  protect,
  authorize('hr_admin', 'department_admin'),
  [
    check('name', 'Team name is required').not().isEmpty()
  ],
  addTeamToDepartment
);

// @route   GET /api/departments/:id/metrics
// @desc    Get department metrics
// @access  Private (HR Admin or Department Admin)
router.get(
  '/:id/metrics',
  protect,
  authorize('hr_admin', 'department_admin'),
  getDepartmentMetrics
);

module.exports = router; 