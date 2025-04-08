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
const mongoose = require('mongoose');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require('express-validator');

// Task Schema
const taskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['todo', 'in-progress', 'completed'],
        default: 'todo'
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    dueDate: { type: Date },
    priority: {
        type: String,
        enum: ['low', 'medium', 'high'],
        default: 'medium'
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Task = mongoose.model('Task', taskSchema);

// Validation middleware
const validateTask = [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('status').optional().isIn(['todo', 'in-progress', 'completed']),
    body('priority').optional().isIn(['low', 'medium', 'high']),
    body('dueDate').optional().isISO8601().toDate(),
    body('assignedTo').optional().isMongoId()
];

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
router.post('/', protect, validateTask, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const task = new Task({
        ...req.body,
        assignedBy: req.user._id // Assuming authenticated user's ID is available
    });

    const newTask = await task.save();
    const populatedTask = await Task.findById(newTask._id)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');

    res.status(201).json(populatedTask);
}));

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
router.put('/:id', protect, validateTask, asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }

    Object.assign(task, req.body);
    task.updatedAt = Date.now();
    
    await task.save();
    
    const updatedTask = await Task.findById(task._id)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');
    
    res.json(updatedTask);
}));

/**
 * @route DELETE /api/tasks/:id
 * @desc Delete a task
 * @access Private (Admin/HR/Manager)
 */
router.delete('/:id', protect, deleteTask);

/**
 * @route PATCH /api/tasks/:id/status
 * @desc Update task status
 * @access Private
 */
router.patch('/:id/status', protect, asyncHandler(async (req, res) => {
    const { status } = req.body;
    
    if (!['todo', 'in-progress', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status value' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) {
        return res.status(404).json({ message: 'Task not found' });
    }

    task.status = status;
    task.updatedAt = Date.now();
    
    await task.save();
    
    const updatedTask = await Task.findById(task._id)
        .populate('assignedTo', 'name email')
        .populate('assignedBy', 'name email');
    
    res.json(updatedTask);
}));

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

/**
 * @route GET /api/tasks/summary
 * @desc Get task summary for dashboard
 * @access Private
 */
router.get('/summary', protect, asyncHandler(async (req, res) => {
    try {
        const today = new Date();
        
        // Get counts for each status
        const [todoTasks, inProgressTasks, completedTasks] = await Promise.all([
            Task.countDocuments({ status: 'todo' }),
            Task.countDocuments({ status: 'in-progress' }),
            Task.countDocuments({ status: 'completed' })
        ]);
        
        // Get count of overdue tasks
        const overdueTasks = await Task.countDocuments({
            status: { $in: ['todo', 'in-progress'] },
            dueDate: { $lt: today }
        });
        
        res.json({
            todo: todoTasks,
            inProgress: inProgressTasks,
            completed: completedTasks,
            overdue: overdueTasks
        });
    } catch (error) {
        console.error('Error getting task summary:', error);
        res.status(500).json({ message: 'Error getting task summary', error: error.message });
    }
}));

module.exports = router; 