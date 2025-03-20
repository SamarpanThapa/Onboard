const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const { 
  createTraining,
  getTrainings,
  getTraining,
  updateTraining,
  deleteTraining,
  completeTraining,
  assignTraining,
  unassignTraining,
  getUserTrainings,
  setupOrientationTraining,
  getOrientationProgress
} = require('../controllers/trainingController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/trainings
// @desc    Create a new training
// @access  Private (Admin, HR)
router.post(
  '/',
  protect,
  authorize('admin', 'hr_admin'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('trainingType', 'Training type is required').not().isEmpty()
  ],
  createTraining
);

// @route   GET /api/trainings
// @desc    Get all trainings with filtering
// @access  Private
router.get('/', protect, getTrainings);

// @route   GET /api/trainings/:id
// @desc    Get a single training by ID
// @access  Private
router.get('/:id', protect, getTraining);

// @route   PUT /api/trainings/:id
// @desc    Update a training
// @access  Private (Admin, HR)
router.put(
  '/:id',
  protect,
  authorize('admin', 'hr_admin'),
  updateTraining
);

// @route   DELETE /api/trainings/:id
// @desc    Delete a training
// @access  Private (Admin, HR)
router.delete(
  '/:id',
  protect,
  authorize('admin', 'hr_admin'),
  deleteTraining
);

// @route   POST /api/trainings/:id/complete
// @desc    Mark a training as completed for the current user
// @access  Private
router.post(
  '/:id/complete',
  protect,
  completeTraining
);

// @route   POST /api/trainings/:id/assign
// @desc    Assign training to users
// @access  Private (Admin, HR, Manager)
router.post(
  '/:id/assign',
  protect,
  authorize('admin', 'hr_admin', 'manager'),
  [
    check('userIds', 'User IDs are required').isArray(),
    check('dueDate', 'Due date must be a valid date').optional().isISO8601()
  ],
  assignTraining
);

// @route   DELETE /api/trainings/:id/assign/:userId
// @desc    Remove training assignment for a user
// @access  Private (Admin, HR, Manager)
router.delete(
  '/:id/assign/:userId',
  protect,
  authorize('admin', 'hr_admin', 'manager'),
  unassignTraining
);

// @route   GET /api/trainings/user/assignments
// @desc    Get training assignments for the current user
// @access  Private
router.get(
  '/user/assignments',
  protect,
  getUserTrainings
);

// @route   POST /api/trainings/orientation
// @desc    Set up orientation training for a new employee
// @access  Private (Admin, HR)
router.post(
  '/orientation',
  protect,
  authorize('admin', 'hr_admin'),
  [
    check('employeeId', 'Employee ID is required').not().isEmpty(),
    check('startDate', 'Start date must be a valid date').optional().isISO8601()
  ],
  setupOrientationTraining
);

// @route   GET /api/trainings/orientation/:employeeId
// @desc    Get orientation training progress for an employee
// @access  Private (Admin, HR, Manager)
router.get(
  '/orientation/:employeeId',
  protect,
  authorize('admin', 'hr_admin', 'manager'),
  getOrientationProgress
);

module.exports = router; 