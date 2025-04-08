const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

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

// Get all tasks
router.get('/', async (req, res) => {
    try {
        const tasks = await Task.find()
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create new task
router.post('/', async (req, res) => {
    try {
        console.log('Received task creation request:', req.body);
        
        const task = new Task({
            title: req.body.title,
            description: req.body.description,
            status: req.body.status || 'todo',
            assignedTo: req.body.assignedTo,
            dueDate: req.body.dueDate,
            priority: req.body.priority || 'medium'
        });

        console.log('Created task object:', task);

        const newTask = await task.save();
        console.log('Saved task:', newTask);

        const populatedTask = await Task.findById(newTask._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email');
        
        console.log('Sending populated task:', populatedTask);
        res.status(201).json(populatedTask);
    } catch (error) {
        console.error('Error in task creation:', error);
        res.status(400).json({ 
            message: error.message,
            details: error.errors || error.stack
        });
    }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        task.status = req.body.status;
        task.updatedAt = Date.now();
        
        const updatedTask = await task.save();
        const populatedTask = await Task.findById(updatedTask._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email');
        res.json(populatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update task
router.put('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }

        Object.assign(task, req.body);
        task.updatedAt = Date.now();
        
        const updatedTask = await task.save();
        const populatedTask = await Task.findById(updatedTask._id)
            .populate('assignedTo', 'name email')
            .populate('assignedBy', 'name email');
        res.json(populatedTask);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete task
router.delete('/:id', async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);
        if (!task) {
            return res.status(404).json({ message: 'Task not found' });
        }
        await task.remove();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router; 