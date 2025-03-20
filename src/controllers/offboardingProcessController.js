const asyncHandler = require('express-async-handler');
const OffboardingProcess = require('../models/OffboardingProcess');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new offboarding process
// @route   POST /api/offboarding-processes
// @access  Private (HR Admin or Employee)
const createOffboardingProcess = asyncHandler(async (req, res) => {
  try {
    const { exitDate, reason, feedback } = req.body;
    const employeeId = req.body.employeeId || req.user._id;
    
    // Check if user already has an offboarding process
    const existingProcess = await OffboardingProcess.findOne({ employee: employeeId });
    
    if (existingProcess) {
      return res.status(400).json({
        success: false,
        message: 'This employee already has an offboarding process'
      });
    }
    
    // Create new offboarding process
    const newProcess = new OffboardingProcess({
      employee: employeeId,
      exitDate,
      reason,
      feedback,
      status: 'initiated',
      createdBy: req.user._id
    });
    
    // Initialize default tasks
    await newProcess.initializeDefaultTasks();
    
    // Save the process
    await newProcess.save();
    
    // Update user's offboarding status
    const user = await User.findById(employeeId);
    if (user) {
      user.offboarding = {
        ...user.offboarding,
        status: 'in_progress',
        reason,
        exitDate
      };
      await user.save();
    }
    
    // Create notification for HR about new offboarding process
    if (req.user.role !== 'hr_admin') {
      await Notification.create({
        title: 'New Offboarding Process Initiated',
        message: `${user.name} has initiated the offboarding process. Reason: ${reason}`,
        type: 'system',
        recipients: ['hr_admin'],
        sender: req.user._id,
        relatedEntity: {
          type: 'offboarding',
          id: newProcess._id
        }
      });
    }
    
    return res.status(201).json({
      success: true,
      data: newProcess,
      message: 'Offboarding process initiated successfully'
    });
  } catch (error) {
    console.error('Error creating offboarding process:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get all offboarding processes
// @route   GET /api/offboarding-processes
// @access  Private (HR Admin only)
const getOffboardingProcesses = asyncHandler(async (req, res) => {
  try {
    const { status } = req.query;
    
    // Filter by status if provided
    const filter = status ? { status } : {};
    
    const processes = await OffboardingProcess.find(filter)
      .populate('employee', 'name email department position')
      .sort({ 'keyDates.created': -1 });
      
    return res.status(200).json({
      success: true,
      count: processes.length,
      data: processes
    });
  } catch (error) {
    console.error('Error fetching offboarding processes:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get offboarding process by ID
// @route   GET /api/offboarding-processes/:id
// @access  Private
const getOffboardingProcessById = asyncHandler(async (req, res) => {
  try {
    const process = await OffboardingProcess.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('tasks.assignedTo', 'name email')
      .populate('companyAssetsReturned.approvedBy', 'name email');
      
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Offboarding process not found'
      });
    }
    
    // Check if user is allowed to access this process
    if (req.user.role !== 'hr_admin' && 
        req.user.role !== 'it_admin' && 
        process.employee._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this offboarding process'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: process
    });
  } catch (error) {
    console.error('Error fetching offboarding process:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get current user's offboarding process
// @route   GET /api/offboarding-processes/me
// @access  Private
const getMyOffboardingProcess = asyncHandler(async (req, res) => {
  try {
    const process = await OffboardingProcess.findOne({ employee: req.user._id })
      .populate('tasks.assignedTo', 'name email')
      .populate('companyAssetsReturned.approvedBy', 'name email');
      
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'No offboarding process found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: process
    });
  } catch (error) {
    console.error('Error fetching user offboarding process:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update offboarding process
// @route   PUT /api/offboarding-processes/:id
// @access  Private (HR Admin or Process Owner)
const updateOffboardingProcess = asyncHandler(async (req, res) => {
  try {
    const process = await OffboardingProcess.findById(req.params.id);
    
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Offboarding process not found'
      });
    }
    
    // Check authorization
    if (req.user.role !== 'hr_admin' && 
        process.employee.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this process'
      });
    }
    
    // Update allowed fields
    const allowedUpdates = [
      'exitDate', 
      'reason', 
      'feedback', 
      'status', 
      'tasks', 
      'companyAssetsReturned',
      'accountDeactivation',
      'knowledgeTransfer',
      'exitInterview',
      'finalDocumentation',
      'complianceAcknowledged',
      'notes'
    ];
    
    // Apply updates
    for (const field of allowedUpdates) {
      if (req.body[field] !== undefined) {
        process[field] = req.body[field];
      }
    }
    
    // Update progress
    if (req.body.tasks) {
      const completedTasks = process.tasks.filter(task => task.status === 'completed').length;
      process.progress.tasksCompleted = completedTasks;
    }
    
    // Update key dates
    process.keyDates.lastUpdated = new Date();
    if (process.status === 'completed') {
      process.keyDates.completedDate = new Date();
    }
    
    // Track who made the update
    process.updatedBy = req.user._id;
    
    // Save changes
    await process.save();
    
    // Update user's offboarding status
    if (req.body.status) {
      const user = await User.findById(process.employee);
      if (user) {
        user.offboarding.status = req.body.status === 'completed' ? 'completed' : 'in_progress';
        await user.save();
      }
    }
    
    return res.status(200).json({
      success: true,
      data: process,
      message: 'Offboarding process updated successfully'
    });
  } catch (error) {
    console.error('Error updating offboarding process:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update task status
// @route   PUT /api/offboarding-processes/:id/tasks/:taskIndex
// @access  Private
const updateTaskStatus = asyncHandler(async (req, res) => {
  try {
    const { id, taskIndex } = req.params;
    const { status } = req.body;
    
    const process = await OffboardingProcess.findById(id);
    
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Offboarding process not found'
      });
    }
    
    // Check if the task exists
    if (!process.tasks[taskIndex]) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }
    
    // Update the task status
    process.tasks[taskIndex].status = status;
    
    // If marking as completed, set the completion date
    if (status === 'completed') {
      process.tasks[taskIndex].completedDate = new Date();
      process.progress.tasksCompleted += 1;
    } else if (process.tasks[taskIndex].completedDate && status !== 'completed') {
      // If changing from completed to another status, decrement completion count
      process.tasks[taskIndex].completedDate = null;
      process.progress.tasksCompleted = Math.max(0, process.progress.tasksCompleted - 1);
    }
    
    // Update last modified
    process.keyDates.lastUpdated = new Date();
    process.updatedBy = req.user._id;
    
    // Save changes
    await process.save();
    
    return res.status(200).json({
      success: true,
      data: process,
      message: 'Task status updated successfully'
    });
  } catch (error) {
    console.error('Error updating task status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Get offboarding processes for kanban board grouped by status
// @route   GET /api/offboarding-processes/kanban/board
// @access  Private (HR Admin only)
const getKanbanBoardData = asyncHandler(async (req, res) => {
  try {
    const processes = await OffboardingProcess.find()
      .populate('employee', 'name email department position')
      .sort({ 'keyDates.created': -1 });
    
    // Group by status
    const kanbanData = {
      initiated: processes.filter(p => p.status === 'initiated'),
      in_progress: processes.filter(p => p.status === 'in_progress'),
      completed: processes.filter(p => p.status === 'completed')
    };
    
    return res.status(200).json({
      success: true,
      data: kanbanData
    });
  } catch (error) {
    console.error('Error fetching kanban board data:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Update offboarding process status
// @route   PUT /api/offboarding-processes/:id/status
// @access  Private (HR Admin only)
const updateProcessStatus = asyncHandler(async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;
    
    const process = await OffboardingProcess.findById(id);
    
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Offboarding process not found'
      });
    }
    
    // Update status
    process.status = status;
    
    // Update dates based on status
    process.keyDates.lastUpdated = new Date();
    if (status === 'completed') {
      process.keyDates.completedDate = new Date();
    }
    
    // Update who made the change
    process.updatedBy = req.user._id;
    
    // Save changes
    await process.save();
    
    // Update user's status
    const user = await User.findById(process.employee);
    if (user) {
      user.offboarding.status = status === 'completed' ? 'completed' : 'in_progress';
      await user.save();
      
      // If process is completed, deactivate user account
      if (status === 'completed') {
        user.isActive = false;
        await user.save();
      }
    }
    
    return res.status(200).json({
      success: true,
      data: process,
      message: 'Offboarding process status updated successfully'
    });
  } catch (error) {
    console.error('Error updating process status:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

// @desc    Submit offboarding data from form
// @route   POST /api/offboarding-processes/submit
// @access  Private
const submitOffboardingData = asyncHandler(async (req, res) => {
  try {
    const userData = req.user;
    const offboardingData = req.body;
    
    console.log('Received offboarding data:', JSON.stringify(offboardingData, null, 2));
    
    // Check if user already has an offboarding process
    let existingProcess = await OffboardingProcess.findOne({
      employee: userData._id,
    }).populate('employee', 'name email department position');
    
    if (existingProcess) {
      // Update existing process
      existingProcess.reason = offboardingData.reason || existingProcess.reason;
      existingProcess.feedback = offboardingData.feedback || existingProcess.feedback;
      existingProcess.exitDate = offboardingData.exitDate || existingProcess.exitDate;
      existingProcess.status = 'in_progress';
      
      // Update progress tracking
      if (!existingProcess.progress) {
        existingProcess.progress = {
          tasksCompleted: 0,
          totalTasks: 5, // Default number of tasks
          percentComplete: 0
        };
      }
      
      // Update company assets
      if (offboardingData.companyAssetsReturned && offboardingData.companyAssetsReturned.length > 0) {
        existingProcess.companyAssetsReturned = offboardingData.companyAssetsReturned;
      }
      
      // Update account deactivation request
      if (offboardingData.accountDeactivation) {
        existingProcess.accountDeactivation = {
          ...existingProcess.accountDeactivation,
          ...offboardingData.accountDeactivation,
          requested: true
        };
      }
      
      // Update final documentation
      if (offboardingData.finalDocumentation) {
        existingProcess.finalDocumentation = offboardingData.finalDocumentation;
      }
      
      // Update compliance acknowledgment
      if (offboardingData.complianceAcknowledged !== undefined) {
        existingProcess.complianceAcknowledged = offboardingData.complianceAcknowledged;
      }
      
      // Update key dates and who made the update
      existingProcess.keyDates.lastUpdated = new Date();
      existingProcess.updatedBy = userData._id;
      
      // Save the updated process
      await existingProcess.save();
      
      // Update user record
      const user = await User.findById(userData._id);
      if (user) {
        user.offboarding = {
          ...user.offboarding,
          status: 'in_progress',
          reason: offboardingData.reason || user.offboarding.reason,
          exitDate: offboardingData.exitDate || user.offboarding.exitDate
        };
        await user.save();
      }
      
      // Create notification for HR
      await Notification.create({
        title: 'Offboarding Updated',
        message: `${userData.name} has updated their offboarding information.`,
        type: 'system',
        recipients: ['hr_admin'],
        sender: userData._id,
        relatedEntity: {
          type: 'offboarding',
          id: existingProcess._id
        }
      });
      
      return res.status(200).json({
        success: true,
        message: 'Offboarding data updated successfully',
        data: existingProcess
      });
    } else {
      // Create new offboarding process
      const newProcess = new OffboardingProcess({
        employee: userData._id,
        exitDate: offboardingData.exitDate,
        reason: offboardingData.reason,
        feedback: offboardingData.feedback,
        status: 'initiated',
        companyAssetsReturned: offboardingData.companyAssetsReturned || [],
        accountDeactivation: offboardingData.accountDeactivation || { requested: false, status: false },
        finalDocumentation: offboardingData.finalDocumentation || { status: 'not_started', documents: [] },
        complianceAcknowledged: offboardingData.complianceAcknowledged || false,
        createdBy: userData._id,
        keyDates: {
          created: new Date(),
          lastUpdated: new Date()
        }
      });
      
      // Initialize default tasks
      await newProcess.initializeDefaultTasks();
      
      // Save the new process
      await newProcess.save();
      
      // Update user record
      const user = await User.findById(userData._id);
      if (user) {
        user.offboarding = {
          status: 'in_progress',
          reason: offboardingData.reason,
          exitDate: offboardingData.exitDate
        };
        await user.save();
      }
      
      // Create notification for HR
      await Notification.create({
        title: 'New Offboarding Process',
        message: `${userData.name} has initiated the offboarding process. Reason: ${offboardingData.reason}`,
        type: 'system',
        recipients: ['hr_admin'],
        sender: userData._id,
        relatedEntity: {
          type: 'offboarding',
          id: newProcess._id
        }
      });
      
      return res.status(201).json({
        success: true,
        message: 'Offboarding process initiated successfully',
        data: newProcess
      });
    }
  } catch (error) {
    console.error('Error processing offboarding submission:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
});

module.exports = {
  createOffboardingProcess,
  getOffboardingProcesses,
  getOffboardingProcessById,
  getMyOffboardingProcess,
  updateOffboardingProcess,
  updateTaskStatus,
  getKanbanBoardData,
  updateProcessStatus,
  submitOffboardingData
}; 