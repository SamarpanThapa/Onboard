const { validationResult } = require('express-validator');
const Training = require('../models/Training');
const User = require('../models/User');
const Notification = require('../models/Notification');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const asyncHandler = require('express-async-handler');
const TrainingAssignment = require('../models/TrainingAssignment');

// Configure multer storage for training materials
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/training');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'training-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
}).array('materials', 10); // Allow up to 10 files

// @desc    Create a new training
// @route   POST /api/trainings
// @access  Private (Admin, HR)
exports.createTraining = async (req, res) => {
  try {
    // Handle file uploads
    upload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
          });
        }
        return res.status(500).json({
          success: false,
          message: `Error uploading files: ${err.message}`
        });
      }

      // Check for validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          errors: errors.array()
        });
      }

      try {
        // Process uploaded files
        const materials = [];
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            materials.push({
              title: file.originalname,
              description: `Uploaded file: ${file.originalname}`,
              fileType: path.extname(file.originalname).substring(1),
              fileName: file.filename,
              filePath: file.path,
              fileSize: file.size,
              uploadedAt: new Date()
            });
          });
        }

        // Parse JSON fields that may be sent as strings
        let requiredFor = req.body.requiredFor;
        if (typeof requiredFor === 'string') {
          try {
            requiredFor = JSON.parse(requiredFor);
          } catch (e) {
            requiredFor = {};
          }
        }

        let schedule = req.body.schedule;
        if (typeof schedule === 'string') {
          try {
            schedule = JSON.parse(schedule);
          } catch (e) {
            schedule = {};
          }
        }

        let assessment = req.body.assessment;
        if (typeof assessment === 'string') {
          try {
            assessment = JSON.parse(assessment);
          } catch (e) {
            assessment = {};
          }
        }

        let feedbackSurvey = req.body.feedbackSurvey;
        if (typeof feedbackSurvey === 'string') {
          try {
            feedbackSurvey = JSON.parse(feedbackSurvey);
          } catch (e) {
            feedbackSurvey = {};
          }
        }

        let content = req.body.content || {};
        if (typeof content === 'string') {
          try {
            content = JSON.parse(content);
          } catch (e) {
            content = {};
          }
        }

        // Add materials to content
        content.materials = materials;

        // Create training in database
        const training = await Training.create({
          title: req.body.title,
          description: req.body.description,
          trainingType: req.body.trainingType,
          format: req.body.format,
          content,
          requiredFor,
          schedule,
          assessment,
          feedbackSurvey,
          certificate: req.body.certificate,
          status: req.body.status || 'draft',
          compliance: req.body.compliance,
          createdBy: req.user._id
        });

        // If training is marked as active and has assigned users, notify them
        if (training.status === 'active' && req.body.assignUsers && req.body.assignUsers.length > 0) {
          await assignTrainingToUsers(training._id, req.body.assignUsers, req.user._id);
        }

        res.status(201).json({
          success: true,
          data: training
        });
      } catch (error) {
        console.error('Error creating training:', error);
        res.status(500).json({
          success: false,
          message: 'Server Error'
        });
      }
    });
  } catch (error) {
    console.error('Error in createTraining controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all trainings
// @route   GET /api/trainings
// @access  Private
exports.getTrainings = async (req, res) => {
  try {
    let query = {};

    // Filter by training type
    if (req.query.trainingType) {
      query.trainingType = req.query.trainingType;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by required department
    if (req.query.department) {
      query['requiredFor.departments'] = req.query.department;
    }

    // Filter by required role
    if (req.query.role) {
      query['requiredFor.roles'] = req.query.role;
    }

    // Filter by format
    if (req.query.format) {
      query.format = req.query.format;
    }

    // For regular employees, only show trainings that are active and assigned to them
    if (req.user.role !== 'admin' && req.user.role !== 'hr_admin') {
      query.status = 'active';
      query.$or = [
        { 'assignments.user': req.user._id },
        { 'requiredFor.departments': req.user.department },
        { 'requiredFor.roles': req.user.role },
        { 'requiredFor.isAllEmployees': true }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Execute query
    const trainings = await Training.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get count for pagination
    const total = await Training.countDocuments(query);

    res.status(200).json({
      success: true,
      count: trainings.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: trainings
    });
  } catch (error) {
    console.error('Error getting trainings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single training
// @route   GET /api/trainings/:id
// @access  Private
exports.getTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('assignments.user', 'name email department role')
      .populate('assignments.assignedBy', 'name email');

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    // For regular employees, check if they have access
    if (req.user.role !== 'admin' && req.user.role !== 'hr_admin') {
      const isAssigned = training.assignments.some(
        assignment => assignment.user._id.toString() === req.user._id.toString()
      );
      const isDepartmentRequired = training.requiredFor.departments.includes(req.user.department);
      const isRoleRequired = training.requiredFor.roles.includes(req.user.role);
      const isAllEmployeesRequired = training.requiredFor.isAllEmployees;

      if (!isAssigned && !isDepartmentRequired && !isRoleRequired && !isAllEmployeesRequired) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this training'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: training
    });
  } catch (error) {
    console.error('Error getting training:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update a training
// @route   PUT /api/trainings/:id
// @access  Private (Admin, HR)
exports.updateTraining = async (req, res) => {
  try {
    // Handle file uploads
    upload(req, res, async (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
          });
        }
        return res.status(500).json({
          success: false,
          message: `Error uploading files: ${err.message}`
        });
      }

      try {
        // Find the training
        let training = await Training.findById(req.params.id);

        if (!training) {
          return res.status(404).json({
            success: false,
            message: 'Training not found'
          });
        }

        // Process uploaded files
        const newMaterials = [];
        if (req.files && req.files.length > 0) {
          req.files.forEach(file => {
            newMaterials.push({
              title: file.originalname,
              description: `Uploaded file: ${file.originalname}`,
              fileType: path.extname(file.originalname).substring(1),
              fileName: file.filename,
              filePath: file.path,
              fileSize: file.size,
              uploadedAt: new Date()
            });
          });
        }

        // Parse JSON fields that may be sent as strings
        let requiredFor = req.body.requiredFor;
        if (typeof requiredFor === 'string') {
          try {
            requiredFor = JSON.parse(requiredFor);
          } catch (e) {
            requiredFor = undefined;
          }
        }

        let schedule = req.body.schedule;
        if (typeof schedule === 'string') {
          try {
            schedule = JSON.parse(schedule);
          } catch (e) {
            schedule = undefined;
          }
        }

        let assessment = req.body.assessment;
        if (typeof assessment === 'string') {
          try {
            assessment = JSON.parse(assessment);
          } catch (e) {
            assessment = undefined;
          }
        }

        let feedbackSurvey = req.body.feedbackSurvey;
        if (typeof feedbackSurvey === 'string') {
          try {
            feedbackSurvey = JSON.parse(feedbackSurvey);
          } catch (e) {
            feedbackSurvey = undefined;
          }
        }

        let content = req.body.content;
        if (typeof content === 'string') {
          try {
            content = JSON.parse(content);
          } catch (e) {
            content = undefined;
          }
        }

        // Prepare update object
        const updateData = {
          updatedBy: req.user._id,
          updatedAt: new Date()
        };

        // Only update fields that are provided
        if (req.body.title) updateData.title = req.body.title;
        if (req.body.description) updateData.description = req.body.description;
        if (req.body.trainingType) updateData.trainingType = req.body.trainingType;
        if (req.body.format) updateData.format = req.body.format;
        if (req.body.status) updateData.status = req.body.status;
        if (req.body.certificate) updateData.certificate = req.body.certificate;
        if (req.body.compliance) updateData.compliance = req.body.compliance;

        // Update complex objects if provided
        if (requiredFor) updateData.requiredFor = requiredFor;
        if (schedule) updateData.schedule = schedule;
        if (assessment) updateData.assessment = assessment;
        if (feedbackSurvey) updateData.feedbackSurvey = feedbackSurvey;

        // Handle content update with new materials
        if (content || newMaterials.length > 0) {
          // Start with existing content or empty object
          const updatedContent = content || {};
          
          // If we have new materials, add them to existing ones
          if (newMaterials.length > 0) {
            const existingMaterials = training.content && training.content.materials 
              ? training.content.materials 
              : [];
            
            updatedContent.materials = [...existingMaterials, ...newMaterials];
          }
          
          updateData.content = updatedContent;
        }

        // Update the training
        training = await Training.findByIdAndUpdate(
          req.params.id,
          { $set: updateData },
          { new: true, runValidators: true }
        );

        // If status changed to active and there are new assignments, notify users
        if (
          req.body.status === 'active' && 
          training.status === 'active' && 
          req.body.assignUsers && 
          req.body.assignUsers.length > 0
        ) {
          await assignTrainingToUsers(training._id, req.body.assignUsers, req.user._id);
        }

        res.status(200).json({
          success: true,
          data: training
        });
      } catch (error) {
        console.error('Error updating training:', error);
        res.status(500).json({
          success: false,
          message: 'Server Error'
        });
      }
    });
  } catch (error) {
    console.error('Error in updateTraining controller:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete a training
// @route   DELETE /api/trainings/:id
// @access  Private (Admin, HR)
exports.deleteTraining = async (req, res) => {
  try {
    const training = await Training.findById(req.params.id);

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    // Delete training materials files
    if (training.content && training.content.materials && training.content.materials.length > 0) {
      for (const material of training.content.materials) {
        if (material.filePath) {
          try {
            if (fs.existsSync(material.filePath)) {
              fs.unlinkSync(material.filePath);
            }
          } catch (err) {
            console.error(`Error deleting file ${material.filePath}:`, err);
          }
        }
      }
    }

    await training.remove();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error('Error deleting training:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Assign training to users
// @route   POST /api/trainings/:id/assign
// @access  Private (Admin, HR)
exports.assignTraining = async (req, res) => {
  try {
    const { users, dueDate } = req.body;

    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an array of user IDs'
      });
    }

    const training = await Training.findById(req.params.id);

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    const assignmentResults = await assignTrainingToUsers(
      training._id,
      users,
      req.user._id,
      dueDate
    );

    res.status(200).json({
      success: true,
      data: assignmentResults
    });
  } catch (error) {
    console.error('Error assigning training:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update training assignment status
// @route   PUT /api/trainings/:id/assignments/:userId
// @access  Private
exports.updateAssignmentStatus = async (req, res) => {
  try {
    const { status, feedback, score } = req.body;
    const { id, userId } = req.params;

    // Validate status
    if (!status || !['in_progress', 'completed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Valid status (in_progress, completed) is required'
      });
    }

    // Find the training
    const training = await Training.findById(id);

    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    // Find the assignment
    const assignmentIndex = training.assignments.findIndex(
      assignment => assignment.user.toString() === userId
    );

    if (assignmentIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Assignment not found for this user'
      });
    }

    // Check if user is authorized to update
    if (
      req.user._id.toString() !== userId &&
      req.user.role !== 'admin' &&
      req.user.role !== 'hr_admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this assignment'
      });
    }

    // Update the assignment
    const assignment = training.assignments[assignmentIndex];

    // If starting the training
    if (status === 'in_progress' && assignment.status === 'assigned') {
      assignment.startedAt = new Date();
    }

    // If completing the training
    if (status === 'completed' && assignment.status !== 'completed') {
      assignment.completedAt = new Date();
    }

    // Update status
    assignment.status = status;

    // Update score if provided
    if (score !== undefined) {
      assignment.score = score;
    }

    // Update feedback if provided
    if (feedback) {
      assignment.feedback = {
        ...assignment.feedback,
        ...feedback,
        submittedAt: new Date()
      };
    }

    // Update assignment in the training document
    training.assignments[assignmentIndex] = assignment;
    await training.save();

    // If completion: send notification to HR/creator
    if (status === 'completed') {
      // Send notification to training creator
      if (training.createdBy.toString() !== req.user._id.toString()) {
        await Notification.create({
          recipient: training.createdBy,
          title: 'Training Completed',
          message: `${req.user.name} completed the training "${training.title}"`,
          type: 'training',
          relatedObject: {
            objectType: 'training',
            objectId: training._id,
            link: `/trainings/${training._id}`
          },
          sender: req.user._id,
          isSystemGenerated: false
        });
      }

      // Notify HR admin if this is compliance training
      if (training.compliance && training.compliance.isComplianceRequired) {
        const hrAdmins = await User.find({ role: 'hr_admin' }).select('_id');
        for (const admin of hrAdmins) {
          if (admin._id.toString() !== req.user._id.toString() && admin._id.toString() !== training.createdBy.toString()) {
            await Notification.create({
              recipient: admin._id,
              title: 'Compliance Training Completed',
              message: `${req.user.name} completed the compliance training "${training.title}"`,
              type: 'training',
              relatedObject: {
                objectType: 'training',
                objectId: training._id,
                link: `/trainings/${training._id}`
              },
              sender: req.user._id,
              isSystemGenerated: true
            });
          }
        }
      }
    }

    res.status(200).json({
      success: true,
      data: assignment
    });
  } catch (error) {
    console.error('Error updating assignment status:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get trainings for a specific user
// @route   GET /api/trainings/user/:userId
// @access  Private
exports.getUserTrainings = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions - only allow users to view their own trainings or admin/HR
    if (
      userId !== req.user._id.toString() && 
      req.user.role !== 'admin' && 
      req.user.role !== 'hr_admin'
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view these trainings'
      });
    }

    // Build query to find:
    // 1. Trainings explicitly assigned to user
    // 2. Trainings required for user's department
    // 3. Trainings required for user's role
    // 4. Trainings required for all employees
    // 5. Only active trainings for regular users
    const query = {
      status: 'active',
      $or: [
        { 'assignments.user': userId },
        { 'requiredFor.departments': user.department },
        { 'requiredFor.roles': user.role },
        { 'requiredFor.isAllEmployees': true }
      ]
    };

    // Filter by status if admin/HR
    if (req.query.status && (req.user.role === 'admin' || req.user.role === 'hr_admin')) {
      query.status = req.query.status;
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;

    // Get trainings
    const trainings = await Training.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Get total count
    const total = await Training.countDocuments(query);

    // For each training, check user's assignment status
    const trainingWithStatus = trainings.map(training => {
      const assignment = training.assignments.find(
        a => a.user.toString() === userId
      );

      // Create a training object with status information
      const trainingObj = training.toObject();
      trainingObj.userStatus = assignment
        ? {
            status: assignment.status,
            assignedAt: assignment.assignedAt,
            startedAt: assignment.startedAt,
            completedAt: assignment.completedAt,
            dueDate: assignment.dueDate,
            score: assignment.score,
            feedback: assignment.feedback
          }
        : {
            status: 'not_assigned'
          };

      return trainingObj;
    });

    res.status(200).json({
      success: true,
      count: trainings.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: trainingWithStatus
    });
  } catch (error) {
    console.error('Error getting user trainings:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Generate onboarding training plan for a new employee
// @route   POST /api/trainings/generate-onboarding/:userId
// @access  Private (Admin, HR)
exports.generateOnboardingTraining = async (req, res) => {
  try {
    const userId = req.params.userId;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find all active onboarding trainings
    const onboardingTrainings = await Training.find({
      status: 'active',
      trainingType: { $in: ['onboarding', 'orientation'] },
      $or: [
        { 'requiredFor.departments': user.department },
        { 'requiredFor.roles': user.role },
        { 'requiredFor.isAllEmployees': true }
      ]
    });

    // Calculate due dates based on training requirements
    const now = new Date();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
    const twoWeeks = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

    // Assign trainings to user
    const assignments = [];
    for (const training of onboardingTrainings) {
      // Don't reassign if already assigned
      const alreadyAssigned = training.assignments.some(
        a => a.user.toString() === userId
      );

      if (!alreadyAssigned) {
        // Set due date based on training type
        let dueDate;
        if (training.trainingType === 'orientation') {
          dueDate = new Date(now.getTime() + oneWeek); // Orientation due in 1 week
        } else {
          dueDate = new Date(now.getTime() + twoWeeks); // Other onboarding due in 2 weeks
        }

        // Add assignment to training
        training.assignments.push({
          user: userId,
          assignedAt: now,
          assignedBy: req.user._id,
          dueDate,
          status: 'assigned'
        });

        await training.save();
        assignments.push({
          trainingId: training._id,
          title: training.title,
          dueDate
        });

        // Send notification to user
        await Notification.create({
          recipient: userId,
          title: 'New Training Assigned',
          message: `You have been assigned the training "${training.title}" as part of onboarding.`,
          type: 'training',
          relatedObject: {
            objectType: 'training',
            objectId: training._id,
            link: `/trainings/${training._id}`
          },
          sender: req.user._id,
          isSystemGenerated: false
        });
      }
    }

    res.status(200).json({
      success: true,
      count: assignments.length,
      data: assignments
    });
  } catch (error) {
    console.error('Error generating onboarding training:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Helper function to assign training to multiple users
async function assignTrainingToUsers(trainingId, userIds, assignerId, dueDate = null) {
  try {
    // Find the training
    const training = await Training.findById(trainingId);
    if (!training) {
      throw new Error('Training not found');
    }

    const results = {
      successful: [],
      alreadyAssigned: [],
      failed: []
    };

    // Process each user
    for (const userId of userIds) {
      try {
        // Check if user exists
        const user = await User.findById(userId);
        if (!user) {
          results.failed.push({
            userId,
            reason: 'User not found'
          });
          continue;
        }

        // Check if already assigned
        const alreadyAssigned = training.assignments.some(
          assignment => assignment.user.toString() === userId
        );

        if (alreadyAssigned) {
          results.alreadyAssigned.push(userId);
          continue;
        }

        // Create new assignment
        const newAssignment = {
          user: userId,
          assignedAt: new Date(),
          assignedBy: assignerId,
          status: 'assigned'
        };

        // Add due date if provided
        if (dueDate) {
          newAssignment.dueDate = new Date(dueDate);
        }

        // Add assignment to training
        training.assignments.push(newAssignment);

        // Send notification to user
        await Notification.create({
          recipient: userId,
          title: 'New Training Assigned',
          message: `You have been assigned the training "${training.title}".`,
          type: 'training',
          relatedObject: {
            objectType: 'training',
            objectId: training._id,
            link: `/trainings/${training._id}`
          },
          sender: assignerId,
          isSystemGenerated: false
        });

        results.successful.push(userId);
      } catch (error) {
        console.error(`Error assigning training to user ${userId}:`, error);
        results.failed.push({
          userId,
          reason: error.message
        });
      }
    }

    // Save the training with new assignments
    await training.save();

    return results;
  } catch (error) {
    console.error('Error in assignTrainingToUsers helper:', error);
    throw error;
  }
}

// @desc    Set up orientation training for a new employee
// @route   POST /api/trainings/orientation
// @access  Private (Admin, HR)
exports.setupOrientationTraining = async (req, res) => {
  try {
    const { employeeId, startDate } = req.body;
    
    if (!employeeId) {
      return res.status(400).json({
        success: false,
        message: 'Employee ID is required'
      });
    }
    
    // Find the employee
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Check if orientation training already exists
    const existingOrientationTraining = await Training.findOne({
      trainingType: 'orientation',
      'assignments.user': employeeId,
      'status': 'active'
    });
    
    if (existingOrientationTraining) {
      return res.status(400).json({
        success: false,
        message: 'Orientation training already set up for this employee'
      });
    }
    
    // Set due date (default 1 week from now or specified start date)
    const today = new Date();
    let dueDate;
    
    if (startDate) {
      // If start date is provided, orientation should be completed by then
      dueDate = new Date(startDate);
    } else {
      // Default: 7 days from now
      dueDate = new Date(today);
      dueDate.setDate(dueDate.getDate() + 7);
    }
    
    // Create standard orientation training modules
    const orientationModules = [
      {
        title: 'Company Introduction',
        description: 'Overview of company history, mission, vision, and values',
        trainingType: 'orientation',
        format: 'self_paced',
        content: {
          materials: [],
          duration: 60 // minutes
        }
      },
      {
        title: 'HR Policies and Procedures',
        description: 'Essential HR policies, code of conduct, and employee handbook overview',
        trainingType: 'orientation',
        format: 'self_paced',
        content: {
          materials: [],
          duration: 90 // minutes
        }
      },
      {
        title: 'IT Systems Introduction',
        description: 'Overview of company IT systems, security policies, and access procedures',
        trainingType: 'orientation',
        format: 'self_paced',
        content: {
          materials: [],
          duration: 60 // minutes
        }
      },
      {
        title: 'Department Introduction',
        description: `Introduction to the ${employee.department} department, its function, and key team members`,
        trainingType: 'orientation',
        format: 'self_paced',
        content: {
          materials: [],
          duration: 45 // minutes
        }
      },
      {
        title: 'Safety and Security Training',
        description: 'Essential safety procedures, emergency protocols, and security guidelines',
        trainingType: 'orientation',
        format: 'self_paced',
        content: {
          materials: [],
          duration: 45 // minutes
        }
      }
    ];
    
    // Create each training module and assign to the employee
    const createdTrainings = [];
    
    for (const module of orientationModules) {
      const training = new Training({
        ...module,
        requiredFor: {
          departments: [employee.department],
          roles: [employee.role],
          isAllEmployees: false
        },
        status: 'active',
        createdBy: req.user._id,
        assignments: [{
          user: employeeId,
          assignedAt: new Date(),
          assignedBy: req.user._id,
          dueDate: dueDate,
          status: 'assigned'
        }]
      });
      
      await training.save();
      createdTrainings.push(training);
      
      // Send notification to the employee
      await Notification.create({
        recipient: employeeId,
        type: 'training',
        title: `New Training Assigned: ${module.title}`,
        message: `You have been assigned orientation training: ${module.title}. Please complete by ${dueDate.toLocaleDateString()}.`,
        relatedObject: {
          objectType: 'training',
          objectId: training._id
        },
        isRead: false,
        sender: req.user._id
      });
    }
    
    // Create welcome orientation meeting if start date is provided
    if (startDate) {
      const scheduledDate = new Date(startDate);
      
      // Create meeting for first day orientation session
      const orientationMeeting = new Training({
        title: 'Welcome and Orientation Session',
        description: 'Live orientation and welcome session for new employee',
        trainingType: 'orientation',
        format: 'in_person',
        schedule: {
          isScheduled: true,
          startDate: scheduledDate,
          endDate: scheduledDate,
          recurrence: 'once',
          sessions: [{
            date: scheduledDate,
            startTime: '09:00',
            endTime: '12:00',
            location: 'Main Conference Room',
            instructor: req.user._id,
            maxAttendees: 1
          }]
        },
        content: {
          duration: 180 // 3 hours
        },
        requiredFor: {
          departments: [employee.department],
          roles: [employee.role],
          isAllEmployees: false
        },
        status: 'active',
        createdBy: req.user._id,
        assignments: [{
          user: employeeId,
          assignedAt: new Date(),
          assignedBy: req.user._id,
          dueDate: scheduledDate,
          status: 'assigned'
        }]
      });
      
      await orientationMeeting.save();
      createdTrainings.push(orientationMeeting);
      
      // Send notification about the meeting
      await Notification.create({
        recipient: employeeId,
        type: 'training',
        title: 'Welcome Orientation Session Scheduled',
        message: `Your welcome orientation session is scheduled for ${scheduledDate.toLocaleDateString()} at 9:00 AM in the Main Conference Room.`,
        relatedObject: {
          objectType: 'training',
          objectId: orientationMeeting._id
        },
        isRead: false,
        sender: req.user._id
      });
    }
    
    return res.status(201).json({
      success: true,
      message: 'Orientation training has been set up successfully',
      data: {
        employee: {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          department: employee.department
        },
        trainings: createdTrainings.map(training => ({
          id: training._id,
          title: training.title,
          dueDate: training.assignments[0].dueDate
        })),
        count: createdTrainings.length
      }
    });
  } catch (error) {
    console.error('Error setting up orientation training:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while setting up orientation training',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

// @desc    Get orientation tracking for an employee
// @route   GET /api/trainings/orientation/:employeeId
// @access  Private (Admin, HR, Manager)
exports.getOrientationProgress = async (req, res) => {
  try {
    const { employeeId } = req.params;
    
    // Find the employee
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Find all orientation trainings assigned to the employee
    const orientationTrainings = await Training.find({
      trainingType: 'orientation',
      'assignments.user': employeeId
    }).sort({ 'assignments.assignedAt': 1 });
    
    if (orientationTrainings.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No orientation training found for this employee'
      });
    }
    
    // Calculate overall progress
    let completedCount = 0;
    const totalCount = orientationTrainings.length;
    
    // Format the training data
    const trainings = orientationTrainings.map(training => {
      const assignment = training.assignments.find(
        a => a.user.toString() === employeeId
      );
      
      if (assignment && assignment.status === 'completed') {
        completedCount++;
      }
      
      return {
        id: training._id,
        title: training.title,
        description: training.description,
        format: training.format,
        duration: training.content.duration,
        status: assignment ? assignment.status : 'unknown',
        assignedAt: assignment ? assignment.assignedAt : null,
        dueDate: assignment ? assignment.dueDate : null,
        completedAt: assignment ? assignment.completedAt : null,
        isLate: assignment && assignment.dueDate < new Date() && assignment.status !== 'completed'
      };
    });
    
    // Calculate completion percentage
    const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
    
    return res.json({
      success: true,
      data: {
        employee: {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          department: employee.department
        },
        progress: {
          completed: completedCount,
          total: totalCount,
          percentage: completionPercentage
        },
        trainings
      }
    });
  } catch (error) {
    console.error('Error getting orientation progress:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while getting orientation progress',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * @desc    Mark a training as completed for the current user
 * @route   POST /api/trainings/:id/complete
 * @access  Private
 */
exports.completeTraining = asyncHandler(async (req, res) => {
  const trainingId = req.params.id;
  const userId = req.user._id;

  // Find the training
  const training = await Training.findById(trainingId);
  if (!training) {
    return res.status(404).json({
      success: false,
      message: 'Training not found'
    });
  }

  // Find the assignment for this user
  const assignment = await TrainingAssignment.findOne({
    training: trainingId,
    user: userId
  });

  if (!assignment) {
    return res.status(404).json({
      success: false,
      message: 'Training not assigned to you'
    });
  }

  // Update completion status
  assignment.completionStatus = 'completed';
  assignment.completedDate = new Date();
  
  await assignment.save();

  // Update user's training record
  const user = await User.findById(userId);
  if (user) {
    // Add to completed trainings if not already there
    if (!user.completedTrainings.includes(trainingId)) {
      user.completedTrainings.push(trainingId);
      await user.save();
    }
  }

  res.status(200).json({
    success: true,
    data: assignment
  });
});

/**
 * @desc    Unassign a training from a user
 * @route   DELETE /api/trainings/:id/assign/:userId
 * @access  Private (Admin, HR, Manager)
 */
exports.unassignTraining = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Check if training exists
    const training = await Training.findById(id);
    if (!training) {
      return res.status(404).json({
        success: false,
        message: 'Training not found'
      });
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if assignment exists
    const assignment = await TrainingAssignment.findOne({
      training: id,
      user: userId
    });

    if (!assignment) {
      return res.status(404).json({
        success: false,
        message: 'Training assignment not found'
      });
    }

    // Delete the assignment
    await assignment.deleteOne();

    // Notify user
    await Notification.create({
      recipient: userId,
      title: 'Training Unassigned',
      message: `The training "${training.title}" has been unassigned from you.`,
      type: 'training',
      relatedRecord: {
        model: 'Training',
        id: training._id
      }
    });

    return res.status(200).json({
      success: true,
      message: 'Training successfully unassigned from user'
    });
  } catch (error) {
    console.error('Error unassigning training:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

module.exports = {
  createTraining: exports.createTraining,
  getTrainings: exports.getTrainings,
  getTraining: exports.getTraining,
  updateTraining: exports.updateTraining,
  deleteTraining: exports.deleteTraining,
  completeTraining: exports.completeTraining,
  assignTraining: exports.assignTraining,
  unassignTraining: exports.unassignTraining,
  getUserTrainings: exports.getUserTrainings,
  generateOnboardingTraining: exports.generateOnboardingTraining,
  setupOrientationTraining: exports.setupOrientationTraining,
  getOrientationProgress: exports.getOrientationProgress
}; 