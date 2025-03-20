const express = require('express');
const router = express.Router();
const { 
  createOffboardingProcess,
  getOffboardingProcesses,
  getOffboardingProcessById,
  getMyOffboardingProcess,
  updateOffboardingProcess,
  updateTaskStatus,
  getKanbanBoardData,
  updateProcessStatus,
  submitOffboardingData
} = require('../controllers/offboardingProcessController');
const { protect, authorize } = require('../middleware/authMiddleware');
const { check } = require('express-validator');

// @route   POST /api/offboarding-processes
// @desc    Create a new offboarding process
// @access  Private (HR Admin or Employee)
router.post(
  '/',
  protect,
  [
    check('exitDate', 'Exit date is required').notEmpty(),
    check('reason', 'Reason is required').notEmpty()
  ],
  createOffboardingProcess
);

// @route   GET /api/offboarding-processes
// @desc    Get all offboarding processes
// @access  Private (HR Admin only)
router.get(
  '/',
  protect,
  authorize('hr_admin'),
  getOffboardingProcesses
);

// @route   GET /api/offboarding-processes/:id
// @desc    Get offboarding process by ID
// @access  Private (HR Admin or Process Owner)
router.get(
  '/:id',
  protect,
  getOffboardingProcessById
);

// @route   GET /api/offboarding-processes/me
// @desc    Get current user's offboarding process
// @access  Private
router.get(
  '/me',
  protect,
  getMyOffboardingProcess
);

// @route   PUT /api/offboarding-processes/:id
// @desc    Update offboarding process
// @access  Private (HR Admin or Process Owner)
router.put(
  '/:id',
  protect,
  updateOffboardingProcess
);

// @route   PUT /api/offboarding-processes/:id/tasks/:taskIndex
// @desc    Update task status
// @access  Private (HR Admin or assigned user)
router.put(
  '/:id/tasks/:taskIndex',
  protect,
  [
    check('status', 'Status is required').notEmpty(),
    check('status', 'Invalid status').isIn(['not_started', 'in_progress', 'completed', 'cancelled'])
  ],
  updateTaskStatus
);

// @route   GET /api/offboarding-processes/kanban/board
// @desc    Get offboarding processes for kanban board
// @access  Private (HR Admin only)
router.get(
  '/kanban/board',
  protect,
  authorize('hr_admin'),
  getKanbanBoardData
);

// @route   PUT /api/offboarding-processes/:id/status
// @desc    Update offboarding process status
// @access  Private (HR Admin only)
router.put(
  '/:id/status',
  protect,
  authorize('hr_admin'),
  [
    check('status', 'Status is required').notEmpty(),
    check('status', 'Invalid status').isIn(['initiated', 'in_progress', 'completed'])
  ],
  updateProcessStatus
);

// @route   POST /api/offboarding-processes/submit
// @desc    Submit offboarding data from form
// @access  Private
router.post(
  '/submit',
  protect,
  submitOffboardingData
);

module.exports = router; 