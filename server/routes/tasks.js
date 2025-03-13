const express = require('express');
const {
  getTasks,
  getTask,
  createTask,
  updateTask,
  deleteTask
} = require('../controllers/tasks');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Apply protection to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getTasks)
  .post(authorize('hr', 'it'), upload.single('attachment'), createTask);

router.route('/:id')
  .get(getTask)
  .put(upload.single('attachment'), updateTask)
  .delete(authorize('hr', 'it'), deleteTask);

module.exports = router; 