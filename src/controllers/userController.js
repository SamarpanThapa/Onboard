const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Asset = require('../models/Asset');
const OnboardingProcess = require('../models/OnboardingProcess');
const AccessRequest = require('../models/AccessRequest');
const Notification = require('../models/Notification');
const crypto = require('crypto');

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin, HR)
exports.getUsers = async (req, res) => {
  try {
    // Build query based on filters
    const query = {};

    // Filter by role
    if (req.query.role) {
      query.role = req.query.role;
    }

    // Filter by department
    if (req.query.department) {
      query.department = req.query.department;
    }

    // Filter by active status
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true';
    }

    // Filter by onboarding status
    if (req.query.onboardingStatus) {
      query['onboarding.status'] = req.query.onboardingStatus;
    }

    // Search by name or email
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await User.countDocuments(query);

    // Get users with pagination
    const users = await User.find(query)
      .select('-password')
      .sort(req.query.sort ? { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 } : { name: 1 })
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
      count: users.length,
      pagination,
      total,
      data: users
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single user
// @route   GET /api/users/:id
// @access  Private (Admin, HR, IT Admin, or the user themselves)
exports.getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('employmentDetails.manager', 'name email position');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if requesting user has permission (is admin, HR, IT Admin, or the user themselves)
    const isAdmin = ['admin', 'hr_admin', 'it_admin'].includes(req.user.role);
    const isSelf = req.user._id.toString() === req.params.id;
    const isManager = user.employmentDetails?.manager?.toString() === req.user._id.toString();

    if (!isAdmin && !isSelf && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user profile'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Create a new user
// @route   POST /api/users
// @access  Private (Admin, HR)
exports.createUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { 
      email, 
      name, 
      password, 
      role, 
      department,
      position,
      personalInfo,
      employmentDetails,
      contactInfo
    } = req.body;

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // If manager ID is provided, check if it's valid
    if (employmentDetails && employmentDetails.manager) {
      const managerExists = await User.findById(employmentDetails.manager);
      if (!managerExists) {
        return res.status(400).json({
          success: false,
          message: 'Specified manager does not exist'
        });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the user
    const userData = {
      email,
      name,
      password: hashedPassword,
      role: role || 'employee',
      department,
      position,
      createdAt: new Date()
    };

    // Add personal info if provided
    if (personalInfo) {
      userData.personalInfo = typeof personalInfo === 'string' 
        ? JSON.parse(personalInfo) 
        : personalInfo;
        
      // Encrypt SSN if provided
      if (userData.personalInfo && userData.personalInfo.ssn) {
        // Simple encryption, in production you'd use a more secure method
        const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
        let encrypted = cipher.update(userData.personalInfo.ssn, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        userData.personalInfo.ssn = encrypted;
      }
    }

    // Add employment details if provided
    if (employmentDetails) {
      userData.employmentDetails = typeof employmentDetails === 'string' 
        ? JSON.parse(employmentDetails) 
        : employmentDetails;
    }

    // Add contact info if provided
    if (contactInfo) {
      userData.contactInfo = typeof contactInfo === 'string' 
        ? JSON.parse(contactInfo) 
        : contactInfo;
    }

    // Initialize onboarding status
    userData.onboarding = {
      status: 'not_started',
      completedSteps: [],
      welcomeMessageSent: false,
      documentsSubmitted: false
    };

    const user = await User.create(userData);

    // Create notification for HR team about new user
    const hrAdmins = await User.find({ role: 'hr_admin' }).select('_id');
    
    if (hrAdmins.length > 0) {
      const notifications = hrAdmins.map(admin => ({
        recipient: admin._id,
        title: 'New User Created',
        message: `A new user account has been created for ${name}`,
        type: 'user',
        relatedObject: {
          objectType: 'user',
          objectId: user._id,
          link: `/users/${user._id}`
        },
        sender: req.user._id,
        isSystemGenerated: false
      }));

      await Notification.insertMany(notifications);
    }

    // Return the created user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update a user
// @route   PUT /api/users/:id
// @access  Private (Admin, HR, or the user themselves with limited fields)
exports.updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions
    const isAdmin = ['admin', 'hr_admin'].includes(req.user.role);
    const isSelf = req.user._id.toString() === req.params.id;

    // If not admin or self, deny access
    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this user'
      });
    }

    // If self but not admin, limit fields that can be updated
    if (isSelf && !isAdmin) {
      const allowedFields = ['name', 'contactInfo', 'password'];
      const attemptedFields = Object.keys(req.body);
      
      for (const field of attemptedFields) {
        if (!allowedFields.includes(field)) {
          return res.status(403).json({
            success: false,
            message: `You don't have permission to update the ${field} field`
          });
        }
      }
    }

    // Handle password update
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10);
      req.body.password = await bcrypt.hash(req.body.password, 12);
    }

    // Handle personal info
    if (req.body.personalInfo) {
      req.body.personalInfo = typeof req.body.personalInfo === 'string' 
        ? JSON.parse(req.body.personalInfo) 
        : req.body.personalInfo;
        
      // Encrypt SSN if provided and changed
      if (req.body.personalInfo.ssn && 
          (!user.personalInfo || req.body.personalInfo.ssn !== user.personalInfo.ssn)) {
        const cipher = crypto.createCipher('aes-256-cbc', process.env.ENCRYPTION_KEY || 'default-key');
        let encrypted = cipher.update(req.body.personalInfo.ssn, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        req.body.personalInfo.ssn = encrypted;
      }
    }

    // Handle employment details
    if (req.body.employmentDetails) {
      req.body.employmentDetails = typeof req.body.employmentDetails === 'string' 
        ? JSON.parse(req.body.employmentDetails) 
        : req.body.employmentDetails;
    }

    // Handle contact info
    if (req.body.contactInfo) {
      req.body.contactInfo = typeof req.body.contactInfo === 'string' 
        ? JSON.parse(req.body.contactInfo) 
        : req.body.contactInfo;
    }

    // Update the user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete a user
// @route   DELETE /api/users/:id
// @access  Private (Admin, HR, IT Admin)
exports.deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has assigned assets
    const assignedAssets = await Asset.find({ assignedTo: req.params.id });
    if (assignedAssets.length > 0) {
      return res.status(400).json({
        success: false,
        message: `User has ${assignedAssets.length} assigned assets. Please reassign or return these assets before deleting the user.`
      });
    }

    // Check if user has active onboarding process
    const activeOnboarding = await OnboardingProcess.findOne({
      employee: req.params.id,
      status: { $in: ['not_started', 'in_progress'] }
    });
    
    if (activeOnboarding) {
      return res.status(400).json({
        success: false,
        message: 'User has an active onboarding process. Please complete or terminate it before deleting the user.'
      });
    }

    // Check if user is anyone's manager
    const managedUsers = await User.find({
      'employmentDetails.manager': req.params.id
    });
    
    if (managedUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: `User is a manager for ${managedUsers.length} employees. Please reassign these employees to a different manager before deleting.`
      });
    }

    // If safe to delete, proceed
    // Using findByIdAndDelete instead of remove() which might be deprecated
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Change user active status (activate/deactivate)
// @route   PUT /api/users/:id/status
// @access  Private (Admin, HR, IT Admin)
exports.changeUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { isActive, deactivationReason } = req.body;

    // Update active status
    user.isActive = isActive;

    // If deactivating and reason provided, update offboarding info
    if (isActive === false && deactivationReason) {
      if (!user.offboarding) {
        user.offboarding = {};
      }
      
      user.offboarding.status = 'in_progress';
      user.offboarding.reason = deactivationReason;
      user.offboarding.accountDeactivated = {
        status: true,
        deactivatedBy: req.user._id,
        deactivationDate: new Date()
      };
    }

    await user.save();

    // Create notification for HR team
    const hrAdmins = await User.find({ role: 'hr_admin' }).select('_id');
    
    if (hrAdmins.length > 0) {
      const notifications = hrAdmins.map(admin => ({
        recipient: admin._id,
        title: `User ${isActive ? 'Activated' : 'Deactivated'}`,
        message: `User ${user.name} has been ${isActive ? 'activated' : 'deactivated'}${deactivationReason ? ': ' + deactivationReason : ''}`,
        type: 'user',
        priority: 'medium',
        relatedObject: {
          objectType: 'user',
          objectId: user._id,
          link: `/users/${user._id}`
        },
        sender: req.user._id,
        isSystemGenerated: false
      }));

      await Notification.insertMany(notifications);
    }

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get user dashboard data
// @route   GET /api/users/:id/dashboard
// @access  Private (User themselves or Admin/HR)
exports.getUserDashboard = async (req, res) => {
  try {
    const userId = req.params.id;

    // Check permissions
    const isAdmin = ['admin', 'hr_admin'].includes(req.user.role);
    const isSelf = req.user._id.toString() === userId;

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this dashboard'
      });
    }

    // Get user data
    const user = await User.findById(userId)
      .select('-password')
      .populate('employmentDetails.manager', 'name email position');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get onboarding process if exists
    const onboardingProcess = await OnboardingProcess.findOne({
      employee: userId,
      status: { $in: ['not_started', 'in_progress', 'on_hold'] }
    }).populate('tasks.taskId');

    // Get pending tasks
    const pendingTasks = await OnboardingProcess.aggregate([
      { $match: { employee: user._id } },
      { $unwind: '$tasks' },
      { $match: { 'tasks.status': { $in: ['not_started', 'in_progress'] } } },
      { $lookup: {
          from: 'employeetasks',
          localField: 'tasks.taskId',
          foreignField: '_id',
          as: 'taskDetails'
        }
      },
      { $unwind: '$taskDetails' },
      { $project: {
          _id: '$taskDetails._id',
          title: '$taskDetails.title',
          description: '$taskDetails.description',
          dueDate: '$taskDetails.dueDate',
          status: '$tasks.status',
          priority: '$taskDetails.priority'
        }
      },
      { $sort: { dueDate: 1 } },
      { $limit: 5 }
    ]);

    // Get assigned assets
    const assignedAssets = await Asset.find({ assignedTo: userId })
      .sort('assignedDate')
      .limit(5);

    // Get pending access requests
    const accessRequests = await AccessRequest.find({
      $or: [
        { requestedBy: userId },
        { requestedFor: userId }
      ],
      status: { $in: ['pending', 'in_progress'] }
    })
      .sort('createdAt')
      .limit(5);

    // Get unread notifications count
    const unreadNotifications = await Notification.countDocuments({
      recipient: userId,
      status: 'unread'
    });

    // Get documents requiring signature
    const pendingDocuments = await User.aggregate([
      { $match: { _id: user._id } },
      { $lookup: {
          from: 'documents',
          let: { userId: '$_id' },
          pipeline: [
            { $match: {
                $expr: {
                  $and: [
                    { $eq: ['$relatedUser', '$$userId'] },
                    { $eq: ['$requiresSignature', true] },
                    { $in: ['$status', ['published', 'pending_review']] }
                  ]
                }
              }
            },
            { $match: {
                'signatures': {
                  $not: {
                    $elemMatch: {
                      'user': user._id,
                      'status': 'signed'
                    }
                  }
                }
              }
            }
          ],
          as: 'pendingDocuments'
        }
      },
      { $project: {
          _id: 0,
          pendingDocuments: {
            _id: 1,
            title: 1,
            documentType: 1,
            category: 1,
            status: 1
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        user,
        onboardingStatus: onboardingProcess ? {
          status: onboardingProcess.status,
          progress: onboardingProcess.progress,
          startDate: onboardingProcess.startDate,
          expectedCompletionDate: onboardingProcess.keyDates?.expectedCompletionDate
        } : null,
        pendingTasks,
        assignedAssets,
        pendingAccessRequests: accessRequests,
        unreadNotifications,
        pendingDocuments: pendingDocuments.length > 0 ? pendingDocuments[0].pendingDocuments : []
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

// @desc    Get current user profile
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('employmentDetails.manager', 'name email position');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update current user profile
// @route   PUT /api/users/me
// @access  Private
exports.updateMe = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Get the current user
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Determine which fields can be updated based on onboarding status
    let allowedFields = ['name', 'contactInfo', 'password'];
    
    // If this is an onboarding update, allow more fields
    if (req.body.onboarding) {
      allowedFields = [
        ...allowedFields,
        'personalInfo',
        'employmentDetails',
        'onboarding'
      ];
    }

    const updatedData = {};

    // Handle allowed fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        if (field === 'onboarding' || field === 'personalInfo' || field === 'employmentDetails') {
          // For nested objects, merge with existing data instead of replacing
          updatedData[field] = {
            ...user[field],
            ...req.body[field]
          };
        } else {
          updatedData[field] = req.body[field];
        }
      }
    }

    // Handle password update
    if (updatedData.password) {
      const salt = await bcrypt.genSalt(10);
      updatedData.password = await bcrypt.hash(updatedData.password, 12);
    }

    // Handle onboarding status update
    if (updatedData.onboarding && updatedData.onboarding.status === 'completed' && user.onboarding.status !== 'completed') {
      // First time completing onboarding - add a notification
      if (!user.communications) user.communications = { notifications: [] };
      
      // Add a welcome notification if this is the first login
      if (!user.communications.notifications.some(n => n.type === 'system' && n.message.includes('Welcome'))) {
        updatedData.communications = {
          ...user.communications,
          notifications: [
            ...(user.communications.notifications || []),
            {
              message: `Welcome to Onboard-X! Your onboarding is now complete.`,
              read: false,
              type: 'system',
              createdAt: new Date()
            }
          ]
        };
      }
      
      // Log the onboarding completion time
      if (!updatedData.onboarding.completedSteps) {
        updatedData.onboarding.completedSteps = [];
      }
      
      updatedData.onboarding.completedSteps.push({
        step: 'onboarding_completed',
        completedAt: new Date()
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      updatedData,
      { new: true, runValidators: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 