const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
  generateOnboardingTasks,
  generateOffboardingTasks,
  addComment,
  updateTaskStatus,
  batchUpdateTasks,
  createAutomatedTasks
} = require('../controllers/taskController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route GET /api/tasks
 * @desc Get all tasks with filtering
 * @access Private
 */
router.get('/', protect, getTasks);

/**
 * @route POST /api/tasks
 * @desc Create a new task
 * @access Private (any authenticated user)
 */
router.post('/', protect, [
  check('title', 'Task title is required').not().isEmpty()
], createTask);

/**
 * @route GET /api/tasks/:id
 * @desc Get a specific task
 * @access Private
 */
router.get('/:id', protect, getTask);

/**
 * @route PUT /api/tasks/:id
 * @desc Update a task
 * @access Private
 */
router.put('/:id', protect, updateTask);

/**
 * @route DELETE /api/tasks/:id
 * @desc Delete a task
 * @access Private (Admin/HR/Manager)
 */
router.delete('/:id', protect, deleteTask);

/**
 * @route PUT /api/tasks/:id/status
 * @desc Update task status
 * @access Private
 */
router.put('/:id/status', protect, [
  check('status')
    .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
    .withMessage('Invalid status')
], updateTaskStatus);

/**
 * @route POST /api/tasks/:id/comments
 * @desc Add a comment to a task
 * @access Private
 */
router.post('/:id/comments', protect, [
  check('text').trim().notEmpty().withMessage('Comment text is required')
], addComment);

/**
 * @route PUT /api/tasks/batch
 * @desc Update multiple tasks at once
 * @access Private (Admin/HR/Manager)
 */
router.put('/batch', protect, [
  check('taskIds').isArray().withMessage('Task IDs must be an array'),
  check('updates').isObject().withMessage('Updates must be an object')
], batchUpdateTasks);

/**
 * @route POST /api/tasks/generate-onboarding/:userId
 * @desc Generate onboarding tasks for a user
 * @access Private (Admin and HR only)
 */
router.post('/generate-onboarding/:userId', protect, authorize('admin', 'hr_admin'), generateOnboardingTasks);

/**
 * @route POST /api/tasks/generate-offboarding/:userId
 * @desc Generate offboarding tasks for a user
 * @access Private (Admin and HR only)
 */
router.post('/generate-offboarding/:userId', protect, authorize('admin', 'hr_admin'), generateOffboardingTasks);

/**
 * @route POST /api/tasks/automated
 * @desc Create automated tasks for onboarding/offboarding
 * @access Private (HR, Admin, IT Admins)
 */
router.post(
  '/automated',
  protect,
  authorize('admin', 'hr_admin', 'it_admin'),
  [
    check('userId', 'User ID is required').not().isEmpty(),
    check('process', 'Process type is required').isIn(['onboarding', 'offboarding'])
  ],
  createAutomatedTasks
);

module.exports = router; 