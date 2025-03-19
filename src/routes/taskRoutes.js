const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const taskController = require('../controllers/taskController');

/**
 * @route GET /api/tasks
 * @desc Get all tasks with filtering
 * @access Private
 */
router.get('/',
  auth.authenticateToken,
  taskController.getTasks
);

/**
 * @route POST /api/tasks
 * @desc Create a new task
 * @access Private (Admin/HR/Manager)
 */
router.post('/',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'hr', 'manager', 'it']),
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().optional(),
    body('assignedTo').notEmpty().withMessage('Assigned user is required'),
    body('dueDate').optional().isISO8601().withMessage('Invalid date format'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority'),
    body('category').optional(),
    body('type')
      .optional()
      .isIn(['onboarding', 'offboarding', 'general', 'compliance'])
      .withMessage('Invalid task type')
  ],
  taskController.createTask
);

/**
 * @route GET /api/tasks/:id
 * @desc Get a specific task
 * @access Private
 */
router.get('/:id',
  auth.authenticateToken,
  taskController.getTask
);

/**
 * @route PUT /api/tasks/:id
 * @desc Update a task
 * @access Private
 */
router.put('/:id',
  auth.authenticateToken,
  taskController.updateTask
);

/**
 * @route DELETE /api/tasks/:id
 * @desc Delete a task
 * @access Private (Admin/HR/Manager)
 */
router.delete('/:id',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'hr', 'manager', 'it']),
  taskController.deleteTask
);

/**
 * @route PUT /api/tasks/:id/status
 * @desc Update task status
 * @access Private
 */
router.put('/:id/status',
  auth.authenticateToken,
  [
    body('status')
      .isIn(['pending', 'in_progress', 'completed', 'cancelled'])
      .withMessage('Invalid status')
  ],
  taskController.updateTaskStatus
);

/**
 * @route POST /api/tasks/:id/comments
 * @desc Add a comment to a task
 * @access Private
 */
router.post('/:id/comments',
  auth.authenticateToken,
  [
    body('text').trim().notEmpty().withMessage('Comment text is required')
  ],
  taskController.addComment
);

/**
 * @route PUT /api/tasks/batch
 * @desc Update multiple tasks at once
 * @access Private (Admin/HR/Manager)
 */
router.put('/batch',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'hr', 'manager', 'it']),
  [
    body('taskIds').isArray().withMessage('Task IDs must be an array'),
    body('updates').isObject().withMessage('Updates must be an object')
  ],
  taskController.batchUpdateTasks
);

module.exports = router; 