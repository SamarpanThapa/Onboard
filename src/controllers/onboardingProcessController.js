const { validationResult } = require('express-validator');
const OnboardingProcess = require('../models/OnboardingProcess');
const OnboardingTemplate = require('../models/OnboardingTemplate');
const EmployeeTask = require('../models/EmployeeTask');
const User = require('../models/User');
const Document = require('../models/Document');
const Notification = require('../models/Notification');

// @desc    Create a new onboarding process for an employee
// @route   POST /api/onboarding-processes
// @access  Private (HR Admin only)
exports.createOnboardingProcess = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { employee, templateId, startDate, customTasks } = req.body;

    // Validate employee exists
    const employeeExists = await User.findById(employee);
    if (!employeeExists) {
      return res.status(400).json({
        success: false,
        message: 'Employee not found'
      });
    }

    // Check if employee already has an active onboarding process
    const existingProcess = await OnboardingProcess.findOne({
      employee,
      status: { $in: ['not_started', 'in_progress'] }
    });

    if (existingProcess) {
      return res.status(400).json({
        success: false,
        message: 'Employee already has an active onboarding process'
      });
    }

    // Initialize onboarding process data
    const onboardingData = {
      employee,
      startDate: startDate || employeeExists.employmentDetails?.startDate || new Date(),
      createdBy: req.user._id,
      progress: {
        tasksCompleted: 0,
        totalTasks: 0,
        percentComplete: 0
      }
    };

    // If template is provided, get the template
    if (templateId) {
      const template = await OnboardingTemplate.findById(templateId);
      if (!template) {
        return res.status(400).json({
          success: false,
          message: 'Onboarding template not found'
        });
      }

      onboardingData.template = templateId;
      onboardingData.progress.totalTasks = template.tasks.length;

      // Set expected completion date (estimate based on tasks in template)
      if (template.tasks.length > 0) {
        // Find the task with furthest timeline
        const lastTaskOffset = Math.max(...template.tasks.map(task => 
          (task.timeline?.timelineOffset || 0) + (task.timeline?.durationDays || 1)
        ));
        
        const startDateObj = new Date(onboardingData.startDate);
        onboardingData.keyDates = {
          expectedCompletionDate: new Date(startDateObj.setDate(startDateObj.getDate() + lastTaskOffset))
        };
      }
    }

    // Create the onboarding process
    const onboardingProcess = await OnboardingProcess.create(onboardingData);

    // If template is provided, create tasks based on template
    if (templateId) {
      const template = await OnboardingTemplate.findById(templateId);
      
      // Create tasks based on template
      await createTasksFromTemplate(template, onboardingProcess, req.user._id);
    }

    // If custom tasks are provided, add them
    if (customTasks && customTasks.length > 0) {
      await addCustomTasks(customTasks, onboardingProcess, req.user._id);
    }

    // Update employee's onboarding status
    await User.findByIdAndUpdate(employee, {
      'onboarding.status': 'in_progress'
    });

    // Create notification for the employee
    await Notification.create({
      recipient: employee,
      title: 'Onboarding Process Started',
      message: 'Your onboarding process has been created. Please check your tasks.',
      type: 'onboarding',
      relatedObject: {
        objectType: 'onboardingProcess',
        objectId: onboardingProcess._id,
        link: `/onboarding/my-process`
      },
      sender: req.user._id,
      isSystemGenerated: false
    });

    // Fetch the complete process with populated data
    const completedProcess = await OnboardingProcess.findById(onboardingProcess._id)
      .populate('employee', 'name email department position')
      .populate('template', 'name')
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      data: completedProcess
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all onboarding processes
// @route   GET /api/onboarding-processes
// @access  Private (HR Admin only)
exports.getOnboardingProcesses = async (req, res) => {
  try {
    // Build query based on filters
    const query = {};

    // Filter by status if provided
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by department if provided (needs to join with User)
    let processes;
    if (req.query.department) {
      // First get users in that department
      const usersInDept = await User.find({ department: req.query.department }).select('_id');
      const userIds = usersInDept.map(user => user._id);
      query.employee = { $in: userIds };
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await OnboardingProcess.countDocuments(query);

    // Get processes with pagination
    processes = await OnboardingProcess.find(query)
      .populate('employee', 'name email department position')
      .populate('template', 'name')
      .populate('createdBy', 'name email')
      .sort('-createdAt')
      .skip(startIndex)
      .limit(limit);

    // Pagination results
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: processes.length,
      pagination,
      total,
      data: processes
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single onboarding process
// @route   GET /api/onboarding-processes/:id
// @access  Private
exports.getOnboardingProcess = async (req, res) => {
  try {
    const process = await OnboardingProcess.findById(req.params.id)
      .populate('employee', 'name email department position')
      .populate('template', 'name')
      .populate({
        path: 'tasks.taskId',
        model: 'EmployeeTask'
      })
      .populate('involvedUsers.userId', 'name email position')
      .populate('equipmentProvisioning.items.assetId', 'name assetType')
      .populate('documents.documentId', 'title file.fileName file.filePath')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding process not found'
      });
    }

    // Check authorization - HR admin, employee's manager, or the employee themselves
    const isHrAdmin = req.user.role === 'hr_admin';
    const isEmployeeThemselves = process.employee._id.toString() === req.user._id.toString();
    const isEmployeeManager = process.employee.employmentDetails?.manager?.toString() === req.user._id.toString();
    
    if (!isHrAdmin && !isEmployeeThemselves && !isEmployeeManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this onboarding process'
      });
    }

    res.status(200).json({
      success: true,
      data: process
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Onboarding process not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update an onboarding process
// @route   PUT /api/onboarding-processes/:id
// @access  Private (HR Admin only)
exports.updateOnboardingProcess = async (req, res) => {
  try {
    const process = await OnboardingProcess.findById(req.params.id);

    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding process not found'
      });
    }

    // Add who updated it
    req.body.updatedBy = req.user._id;

    // Update the process
    const updatedProcess = await OnboardingProcess.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('employee', 'name email department position')
      .populate('template', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: updatedProcess
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Onboarding process not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Change onboarding process status
// @route   PUT /api/onboarding-processes/:id/status
// @access  Private (HR Admin only)
exports.updateProcessStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !['not_started', 'in_progress', 'completed', 'on_hold', 'terminated'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid status'
      });
    }

    const process = await OnboardingProcess.findById(req.params.id);
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding process not found'
      });
    }

    process.status = status;
    process.updatedBy = req.user._id;

    // If completing the process
    if (status === 'completed') {
      process.keyDates.actualCompletionDate = new Date();
      
      // Update employee's onboarding status
      await User.findByIdAndUpdate(process.employee, {
        'onboarding.status': 'completed',
        'onboarding.completedSteps': [
          ...process.employee.onboarding?.completedSteps || [],
          { step: 'onboarding_completed', completedAt: new Date() }
        ]
      });
    }

    await process.save();

    // Create notification for the employee
    let notificationMessage = '';
    switch (status) {
      case 'completed':
        notificationMessage = 'Your onboarding process has been completed.';
        break;
      case 'on_hold':
        notificationMessage = 'Your onboarding process has been put on hold.';
        break;
      case 'terminated':
        notificationMessage = 'Your onboarding process has been terminated.';
        break;
      default:
        notificationMessage = `Your onboarding process status has been updated to ${status}.`;
    }

    await Notification.create({
      recipient: process.employee,
      title: 'Onboarding Process Update',
      message: notificationMessage,
      type: 'onboarding',
      priority: status === 'terminated' ? 'high' : 'medium',
      relatedObject: {
        objectType: 'onboardingProcess',
        objectId: process._id,
        link: `/onboarding/my-process`
      },
      sender: req.user._id,
      isSystemGenerated: false
    });

    const updatedProcess = await OnboardingProcess.findById(process._id)
      .populate('employee', 'name email department position')
      .populate('template', 'name')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      data: updatedProcess
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Add a task to an onboarding process
// @route   POST /api/onboarding-processes/:id/tasks
// @access  Private (HR Admin only)
exports.addTaskToProcess = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const process = await OnboardingProcess.findById(req.params.id);
    if (!process) {
      return res.status(404).json({
        success: false,
        message: 'Onboarding process not found'
      });
    }

    const {
      title,
      description,
      assignedTo,
      dueDate,
      category,
      priority,
      taskType,
      complianceDetails
    } = req.body;

    // Validate assignedTo user exists
    const userToAssign = await User.findById(assignedTo || process.employee);
    if (!userToAssign) {
      return res.status(400).json({
        success: false,
        message: 'User to assign task to not found'
      });
    }

    // Create task
    const task = await EmployeeTask.create({
      title,
      description,
      assignedTo: assignedTo || process.employee,
      assignedBy: req.user._id,
      dueDate,
      category,
      priority: priority || 'medium',
      taskType: taskType || 'onboarding',
      complianceDetails,
      startDate: new Date()
    });

    // Add task to onboarding process
    process.tasks.push({
      taskId: task._id,
      status: 'not_started',
      assignedDate: new Date(),
      dueDate,
      category,
      assignedTo: assignedTo || process.employee
    });

    // Update progress counters
    process.progress.totalTasks += 1;
    process.updatedBy = req.user._id;

    // Create notification for the assignee
    await Notification.create({
      recipient: assignedTo || process.employee,
      title: 'New Onboarding Task Assigned',
      message: `You have been assigned a new onboarding task: ${title}`,
      type: 'task',
      relatedObject: {
        objectType: 'employeeTask',
        objectId: task._id,
        link: `/tasks/${task._id}`
      },
      sender: req.user._id,
      isSystemGenerated: false
    });

    await process.save();

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get current user's onboarding process
// @route   GET /api/onboarding-processes/me
// @access  Private
exports.getMyOnboardingProcess = async (req, res) => {
  try {
    const process = await OnboardingProcess.findOne({
      employee: req.user._id
    })
    .populate('employee', 'name email department position')
    .populate('template', 'name')
    .populate({
      path: 'tasks.taskId',
      model: 'EmployeeTask'
    });

    // If no process is found, return an empty success response with null data
    if (!process) {
      return res.status(200).json({
        success: true,
        message: 'No active onboarding process found',
        data: null
      });
    }

    // Return the process
    res.status(200).json({
      success: true,
      data: process
    });
  } catch (error) {
    console.error('Error getting user onboarding process:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Get overview of onboarding metrics
// @route   GET /api/onboarding-processes/metrics
// @access  Private (HR Admin only)
exports.getOnboardingMetrics = async (req, res) => {
  try {
    // Get counts by status
    const statusCounts = await OnboardingProcess.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get average completion time (for completed processes)
    const averageCompletionTime = await OnboardingProcess.aggregate([
      {
        $match: {
          status: 'completed',
          'keyDates.actualCompletionDate': { $exists: true }
        }
      },
      {
        $project: {
          completionTimeInDays: {
            $divide: [
              { $subtract: ['$keyDates.actualCompletionDate', '$startDate'] },
              1000 * 60 * 60 * 24 // Convert milliseconds to days
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageDays: { $avg: '$completionTimeInDays' }
        }
      }
    ]);

    // Get recently started processes
    const recentProcesses = await OnboardingProcess.find()
      .sort('-keyDates.created')
      .limit(5)
      .populate('employee', 'name department')
      .populate('createdBy', 'name');

    // Get departments with most active processes
    const departmentCounts = await OnboardingProcess.aggregate([
      {
        $match: {
          status: { $in: ['not_started', 'in_progress'] }
        }
      },
      {
        $lookup: {
          from: 'users',
          localField: 'employee',
          foreignField: '_id',
          as: 'employeeData'
        }
      },
      {
        $unwind: '$employeeData'
      },
      {
        $group: {
          _id: '$employeeData.department',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        averageCompletionDays: averageCompletionTime.length > 0 ? Math.round(averageCompletionTime[0].averageDays) : 0,
        totalActiveProcesses: statusCounts.reduce((acc, curr) => {
          if (['not_started', 'in_progress'].includes(curr._id)) {
            return acc + curr.count;
          }
          return acc;
        }, 0),
        recentProcesses,
        departmentCounts
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Helper Functions

// Create tasks from template
const createTasksFromTemplate = async (template, onboardingProcess, createdBy) => {
  // For each task in the template
  const templateTasks = template.tasks;
  
  for (const templateTask of templateTasks) {
    // Calculate due date based on timeline
    const startDate = new Date(onboardingProcess.startDate);
    let dueDate = new Date(startDate);
    
    // Add timeline offset to start date (could be negative for pre-onboarding tasks)
    dueDate.setDate(dueDate.getDate() + 
      (templateTask.timeline?.timelineOffset || 0) + 
      (templateTask.timeline?.durationDays || 1)
    );

    // Determine assignee based on role
    let assigneeId = onboardingProcess.employee; // Default to the employee
    
    if (templateTask.assignTo && templateTask.assignTo.role !== 'employee') {
      if (templateTask.assignTo.role === 'custom' && templateTask.assignTo.customAssignee) {
        assigneeId = templateTask.assignTo.customAssignee;
      } else {
        // For roles like 'hr', 'it', etc., we would need to find appropriate user
        // For now, assign to the creator of the process
        assigneeId = createdBy;
      }
    }

    // Create the task
    const task = await EmployeeTask.create({
      title: templateTask.title,
      description: templateTask.description,
      assignedTo: assigneeId,
      assignedBy: createdBy,
      dueDate,
      startDate: new Date(),
      category: templateTask.category,
      priority: templateTask.priority,
      taskType: 'onboarding',
      template: template._id,
      requiresVerification: templateTask.requiresVerification
    });

    // Add to onboarding process
    onboardingProcess.tasks.push({
      taskId: task._id,
      status: 'not_started',
      assignedDate: new Date(),
      dueDate,
      category: templateTask.category,
      assignedTo: assigneeId
    });

    // Create notification for the assignee
    await Notification.create({
      recipient: assigneeId,
      title: 'New Onboarding Task Assigned',
      message: `You have been assigned a new onboarding task: ${templateTask.title}`,
      type: 'task',
      relatedObject: {
        objectType: 'employeeTask',
        objectId: task._id,
        link: `/tasks/${task._id}`
      },
      sender: createdBy,
      isSystemGenerated: true
    });
  }

  await onboardingProcess.save();
};

// Add custom tasks to process
const addCustomTasks = async (customTasks, onboardingProcess, createdBy) => {
  for (const taskData of customTasks) {
    // Create the task
    const task = await EmployeeTask.create({
      title: taskData.title,
      description: taskData.description,
      assignedTo: taskData.assignedTo || onboardingProcess.employee,
      assignedBy: createdBy,
      dueDate: taskData.dueDate,
      startDate: new Date(),
      category: taskData.category || 'other',
      priority: taskData.priority || 'medium',
      taskType: 'onboarding'
    });

    // Add to onboarding process
    onboardingProcess.tasks.push({
      taskId: task._id,
      status: 'not_started',
      assignedDate: new Date(),
      dueDate: taskData.dueDate,
      category: taskData.category || 'other',
      assignedTo: taskData.assignedTo || onboardingProcess.employee
    });

    // Update total tasks count
    onboardingProcess.progress.totalTasks += 1;

    // Create notification for the assignee
    await Notification.create({
      recipient: taskData.assignedTo || onboardingProcess.employee,
      title: 'New Onboarding Task Assigned',
      message: `You have been assigned a new onboarding task: ${taskData.title}`,
      type: 'task',
      relatedObject: {
        objectType: 'employeeTask',
        objectId: task._id,
        link: `/tasks/${task._id}`
      },
      sender: createdBy,
      isSystemGenerated: false
    });
  }

  await onboardingProcess.save();
}; 