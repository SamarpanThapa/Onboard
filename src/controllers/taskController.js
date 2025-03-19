const { validationResult } = require('express-validator');
const EmployeeTask = require('../models/EmployeeTask');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Get tasks with filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTasks = async (req, res) => {
  try {
    const { 
      assignedTo, 
      status, 
      priority, 
      category,
      type,
      dueDate,
      page = 1, 
      limit = 20 
    } = req.query;

    // Build filter object
    const filter = {};

    // If 'me' is specified, get tasks assigned to the current user
    if (assignedTo === 'me') {
      filter.assignedTo = req.user.id;
    } else if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // For non-admin users, limit to tasks they are assigned to or created
    if (!['admin', 'hr', 'it'].includes(req.user.role)) {
      if (!filter.assignedTo) {
        filter.$or = [
          { assignedTo: req.user.id },
          { assignedBy: req.user.id }
        ];
      }
    }

    if (status) {
      filter.status = status;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (category) {
      filter.category = category;
    }

    if (type) {
      filter.type = type;
    }

    // Due date filtering
    if (dueDate) {
      if (dueDate === 'today') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        filter.dueDate = {
          $gte: today,
          $lt: tomorrow
        };
      } else if (dueDate === 'overdue') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        filter.dueDate = { $lt: today };
        filter.status = { $ne: 'completed' };
      } else if (dueDate === 'week') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(endOfWeek.getDate() + 7);
        
        filter.dueDate = {
          $gte: today,
          $lt: endOfWeek
        };
      }
    }

    // Count total tasks with the filter
    const totalTasks = await EmployeeTask.countDocuments(filter);

    // Fetch tasks with pagination and populate references
    const tasks = await EmployeeTask.find(filter)
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('assignedBy', 'firstName lastName email profileImage')
      .populate('category', 'name color description')
      .sort({ dueDate: 1, priority: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    return res.json({
      tasks,
      totalPages: Math.ceil(totalTasks / limit),
      currentPage: Number(page),
      totalTasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTask = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      title, 
      description, 
      assignedTo,
      dueDate,
      priority = 'medium',
      category,
      type = 'general'
    } = req.body;

    // Verify assignedTo user exists
    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    // Create new task
    const newTask = new EmployeeTask({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id,
      dueDate: dueDate || null,
      priority,
      category: category || null,
      type,
      status: 'pending',
      createdAt: new Date()
    });

    // Save task
    await newTask.save();

    // Populate task with user details
    const populatedTask = await EmployeeTask.findById(newTask._id)
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('assignedBy', 'firstName lastName email profileImage')
      .populate('category', 'name color description');

    // Create notification for the assigned user
    await Notification.create({
      title: 'New Task Assigned',
      message: `You have been assigned a new task: ${title}`,
      type: 'task',
      recipient: assignedTo,
      relatedRecord: {
        model: 'EmployeeTask',
        id: newTask._id
      }
    });

    return res.status(201).json(populatedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a task by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTask = async (req, res) => {
  try {
    const task = await EmployeeTask.findById(req.params.id)
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('assignedBy', 'firstName lastName email profileImage')
      .populate('category', 'name color description')
      .populate('comments.user', 'firstName lastName email profileImage');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to view the task
    if (
      !['admin', 'hr', 'it'].includes(req.user.role) &&
      task.assignedTo._id.toString() !== req.user.id &&
      task.assignedBy._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: 'Not authorized to view this task' });
    }

    return res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTask = async (req, res) => {
  try {
    const task = await EmployeeTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to update the task
    const isAdmin = ['admin', 'hr', 'it'].includes(req.user.role);
    const isCreator = task.assignedBy.toString() === req.user.id;
    const isAssignee = task.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Not authorized to update this task' });
    }

    // Regular users can only update their own assigned tasks with limited fields
    if (!isAdmin && !isCreator && isAssignee) {
      const allowedFields = ['status', 'comments'];
      const updateFields = Object.keys(req.body);
      
      const hasInvalidFields = updateFields.some(field => !allowedFields.includes(field));
      if (hasInvalidFields) {
        return res.status(403).json({ 
          message: 'You are only allowed to update the status and add comments' 
        });
      }
    }

    // Update task fields
    const updatedFields = req.body;
    
    // Update last modified
    updatedFields.lastModified = {
      date: new Date(),
      user: req.user.id
    };

    // If status is being updated, add status history
    if (req.body.status && req.body.status !== task.status) {
      const statusUpdate = {
        status: req.body.status,
        changedBy: req.user.id,
        changedAt: new Date()
      };
      
      if (!task.statusHistory) {
        updatedFields.statusHistory = [statusUpdate];
      } else {
        updatedFields.statusHistory = [...task.statusHistory, statusUpdate];
      }

      // If task is being completed, set completedAt and completedBy
      if (req.body.status === 'completed') {
        updatedFields.completedAt = new Date();
        updatedFields.completedBy = req.user.id;
      }
    }

    // Update the task
    const updatedTask = await EmployeeTask.findByIdAndUpdate(
      req.params.id,
      { $set: updatedFields },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('assignedBy', 'firstName lastName email profileImage')
      .populate('category', 'name color description')
      .populate('comments.user', 'firstName lastName email profileImage');

    // Create notification for status updates
    if (req.body.status && req.body.status !== task.status) {
      // If the assignee updated the status, notify the creator
      if (isAssignee && !isCreator) {
        await Notification.create({
          title: 'Task Status Updated',
          message: `Task "${task.title}" has been updated to ${req.body.status}`,
          type: 'task',
          recipient: task.assignedBy,
          relatedRecord: {
            model: 'EmployeeTask',
            id: task._id
          }
        });
      }
      
      // If the creator updated the status, notify the assignee
      if ((isCreator || isAdmin) && !isAssignee) {
        await Notification.create({
          title: 'Task Status Updated',
          message: `Task "${task.title}" has been updated to ${req.body.status}`,
          type: 'task',
          recipient: task.assignedTo,
          relatedRecord: {
            model: 'EmployeeTask',
            id: task._id
          }
        });
      }
    }

    return res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteTask = async (req, res) => {
  try {
    const task = await EmployeeTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only admins, HR, IT, or the creator can delete tasks
    const isAdmin = ['admin', 'hr', 'it'].includes(req.user.role);
    const isCreator = task.assignedBy.toString() === req.user.id;

    if (!isAdmin && !isCreator) {
      return res.status(403).json({ message: 'Not authorized to delete this task' });
    }

    await task.deleteOne();

    // Notify the assignee about the deleted task
    if (task.assignedTo.toString() !== req.user.id) {
      await Notification.create({
        title: 'Task Deleted',
        message: `Task "${task.title}" has been deleted`,
        type: 'task',
        recipient: task.assignedTo,
        relatedRecord: {
          model: 'User',
          id: req.user.id // Reference to the user who deleted it
        }
      });
    }

    return res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update task status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTaskStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;
    const task = await EmployeeTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to update the task status
    const isAdmin = ['admin', 'hr', 'it'].includes(req.user.role);
    const isCreator = task.assignedBy.toString() === req.user.id;
    const isAssignee = task.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Not authorized to update this task status' });
    }

    // Update task status and related fields
    const updateData = {
      status,
      lastModified: {
        date: new Date(),
        user: req.user.id
      }
    };

    // Add to status history
    const statusUpdate = {
      status,
      changedBy: req.user.id,
      changedAt: new Date()
    };

    // If task is being completed, set completedAt and completedBy
    if (status === 'completed') {
      updateData.completedAt = new Date();
      updateData.completedBy = req.user.id;
    }

    // Update the task
    const updatedTask = await EmployeeTask.findByIdAndUpdate(
      req.params.id,
      { 
        $set: updateData,
        $push: { statusHistory: statusUpdate }
      },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('assignedBy', 'firstName lastName email profileImage')
      .populate('category', 'name color description');

    // Create notification for status updates
    // If the assignee updated the status, notify the creator
    if (isAssignee && !isCreator) {
      await Notification.create({
        title: 'Task Status Updated',
        message: `Task "${task.title}" has been updated to ${status}`,
        type: 'task',
        recipient: task.assignedBy,
        relatedRecord: {
          model: 'EmployeeTask',
          id: task._id
        }
      });
    }
    
    // If the creator updated the status, notify the assignee
    if ((isCreator || isAdmin) && !isAssignee) {
      await Notification.create({
        title: 'Task Status Updated',
        message: `Task "${task.title}" has been updated to ${status}`,
        type: 'task',
        recipient: task.assignedTo,
        relatedRecord: {
          model: 'EmployeeTask',
          id: task._id
        }
      });
    }

    return res.json({
      message: 'Task status updated successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Add a comment to a task
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { text } = req.body;
    const task = await EmployeeTask.findById(req.params.id);

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Check if user has permission to comment on the task
    const isAdmin = ['admin', 'hr', 'it'].includes(req.user.role);
    const isCreator = task.assignedBy.toString() === req.user.id;
    const isAssignee = task.assignedTo.toString() === req.user.id;

    if (!isAdmin && !isCreator && !isAssignee) {
      return res.status(403).json({ message: 'Not authorized to comment on this task' });
    }

    // Create the comment
    const comment = {
      text,
      user: req.user.id,
      createdAt: new Date()
    };

    // Add the comment to the task
    const updatedTask = await EmployeeTask.findByIdAndUpdate(
      req.params.id,
      { 
        $push: { comments: comment },
        $set: { 
          lastModified: {
            date: new Date(),
            user: req.user.id
          }
        }
      },
      { new: true, runValidators: true }
    )
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('assignedBy', 'firstName lastName email profileImage')
      .populate('category', 'name color description')
      .populate('comments.user', 'firstName lastName email profileImage');

    // Create notification for the comment
    // If the assignee commented, notify the creator
    if (isAssignee && !isCreator) {
      await Notification.create({
        title: 'New Comment on Task',
        message: `New comment on task "${task.title}"`,
        type: 'task',
        recipient: task.assignedBy,
        relatedRecord: {
          model: 'EmployeeTask',
          id: task._id
        }
      });
    }
    
    // If the creator commented, notify the assignee
    if ((isCreator || isAdmin) && !isAssignee) {
      await Notification.create({
        title: 'New Comment on Task',
        message: `New comment on task "${task.title}"`,
        type: 'task',
        recipient: task.assignedTo,
        relatedRecord: {
          model: 'EmployeeTask',
          id: task._id
        }
      });
    }

    return res.json({
      message: 'Comment added successfully',
      task: updatedTask
    });
  } catch (error) {
    console.error('Error adding comment to task:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Task not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update multiple tasks at once
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const batchUpdateTasks = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { taskIds, updates } = req.body;

    if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
      return res.status(400).json({ message: 'Task IDs are required' });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'Updates are required' });
    }

    // Add last modified info
    const updateData = {
      ...updates,
      lastModified: {
        date: new Date(),
        user: req.user.id
      }
    };

    // If status is being updated, we need to handle status history separately
    let statusUpdate = null;
    if (updates.status) {
      statusUpdate = {
        status: updates.status,
        changedBy: req.user.id,
        changedAt: new Date()
      };

      // Remove status from updateData since we'll handle it separately
      delete updateData.status;
    }

    // Process each task
    const results = [];
    for (const taskId of taskIds) {
      const task = await EmployeeTask.findById(taskId);
      
      if (!task) {
        results.push({
          taskId,
          success: false,
          message: 'Task not found'
        });
        continue;
      }

      // Check permissions
      const isAdmin = ['admin', 'hr', 'it'].includes(req.user.role);
      const isCreator = task.assignedBy.toString() === req.user.id;
      
      if (!isAdmin && !isCreator) {
        results.push({
          taskId,
          success: false,
          message: 'Not authorized to update this task'
        });
        continue;
      }

      // Handle status history update if needed
      if (statusUpdate) {
        if (!task.statusHistory) {
          task.statusHistory = [statusUpdate];
        } else {
          task.statusHistory.push(statusUpdate);
        }
        
        task.status = statusUpdate.status;

        // If task is being completed, set completedAt and completedBy
        if (statusUpdate.status === 'completed') {
          task.completedAt = new Date();
          task.completedBy = req.user.id;
        }
      }

      // Apply updates
      Object.keys(updateData).forEach(key => {
        if (key !== 'lastModified') {
          task[key] = updateData[key];
        }
      });

      task.lastModified = updateData.lastModified;

      // Save the updated task
      await task.save();

      // Create notification about the update
      if (task.assignedTo.toString() !== req.user.id) {
        await Notification.create({
          title: 'Task Updated',
          message: `Task "${task.title}" has been updated`,
          type: 'task',
          recipient: task.assignedTo,
          relatedRecord: {
            model: 'EmployeeTask',
            id: task._id
          }
        });
      }

      results.push({
        taskId,
        success: true,
        message: 'Task updated successfully'
      });
    }

    return res.json({
      message: 'Batch update completed',
      results
    });
  } catch (error) {
    console.error('Error in batch update tasks:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTasks,
  createTask,
  getTask,
  updateTask,
  deleteTask,
  updateTaskStatus,
  addComment,
  batchUpdateTasks
}; 