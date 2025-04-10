const { validationResult } = require('express-validator');
const User = require('../models/User');
const Document = require('../models/Document');
const EmployeeTask = require('../models/EmployeeTask');
const OnboardingProcess = require('../models/OnboardingProcess');

/**
 * Get all employees with filtering and pagination
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployees = async (req, res) => {
  try {
    const { 
      department, 
      status, 
      onboardingStatus, 
      search,
      page = 1, 
      limit = 20 
    } = req.query;

    console.log('Query parameters:', req.query);

    // Build filter object - match any employee role type including those with department_admin role
    const filter = { 
      role: { $in: ['employee', 'manager'] } 
    };

    if (department) {
      filter.department = department;
    }

    if (status) {
      filter.status = status;
    }

    if (onboardingStatus && onboardingStatus !== 'all') {
      filter['onboarding.status'] = onboardingStatus;
    }

    // Search by name or email
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } }
      ];
    }

    console.log('Query filter:', JSON.stringify(filter, null, 2));

    // Count total employees with the filter
    const totalEmployees = await User.countDocuments(filter);

    // Fetch employees with pagination without problematic populate calls
    const employees = await User.find(filter)
      .select('-password')
      .sort({ lastName: 1, firstName: 1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    console.log(`Found ${employees.length} employees`);

    return res.json({
      employees,
      totalPages: Math.ceil(totalEmployees / limit),
      currentPage: Number(page),
      totalEmployees
    });
  } catch (error) {
    console.error('Error fetching employees:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get current employee details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCurrentEmployee = async (req, res) => {
  try {
    const employee = await User.findById(req.user.id)
      .select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get onboarding process if it exists
    let onboardingProcess = null;
    if (employee.onboarding && employee.onboarding.processId) {
      onboardingProcess = await OnboardingProcess.findById(employee.onboarding.processId)
        .populate('template');
    }

    // Get compliance status
    const complianceStatus = {
      completed: employee.compliance ? employee.compliance.completed : false,
      completedDate: employee.compliance ? employee.compliance.completedDate : null,
      requiredItems: employee.compliance ? employee.compliance.requiredItems : []
    };

    return res.json({
      employee,
      onboardingProcess,
      complianceStatus
    });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update current employee details
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateEmployee = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Fields that an employee can update about themselves
    const {
      phoneNumber,
      address,
      emergencyContact
    } = req.body;

    // Build update object with only the fields provided
    const updateData = {};
    
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address !== undefined) updateData.address = address;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;

    // Update the employee
    const updatedEmployee = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    return res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee details:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update employee status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateStatus = async (req, res) => {
  try {
    const { complianceStatus, completedAt } = req.body;

    // Build update object
    const updateData = {};

    if (complianceStatus) {
      updateData['compliance.completed'] = complianceStatus === 'completed';
      updateData['compliance.completedDate'] = completedAt || new Date();
    }

    // Update the employee
    const updatedEmployee = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('-password');

    return res.json({
      message: 'Status updated successfully',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Error updating employee status:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get employee by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id)
      .select('-password');

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Get tasks assigned to the employee
    const tasks = await EmployeeTask.find({ assignedTo: req.params.id })
      .sort({ dueDate: 1 });

    // Get documents related to the employee
    const documents = await Document.find({ 
      $or: [
        { owner: req.params.id },
        { sharedWith: req.params.id }
      ]
    }).sort({ createdAt: -1 });

    // Get onboarding process if it exists
    let onboardingProcess = null;
    let onboardingData = null;
    
    if (employee.onboarding && employee.onboarding.processId) {
      onboardingProcess = await OnboardingProcess.findById(employee.onboarding.processId)
        .populate('template');
        
      // If we have an onboarding process, check for the form data
      if (onboardingProcess) {
        onboardingData = onboardingProcess.formData || {};
        
        // If we have form data, use it to enhance the employee data
        if (onboardingData && Object.keys(onboardingData).length > 0) {
          console.log('Found onboarding form data for employee:', req.params.id);
          
          // Merge onboarding data into employee
          if (onboardingData.personalInfo) {
            // Create personalInfo if it doesn't exist
            if (!employee.personalInfo) {
              employee.personalInfo = {};
            }
            
            // Merge fields, prioritizing existing values
            employee.personalInfo = {
              ...onboardingData.personalInfo,
              ...employee.personalInfo
            };
          }
          
          if (onboardingData.employmentDetails) {
            // Create employmentDetails if it doesn't exist
            if (!employee.employmentDetails) {
              employee.employmentDetails = {};
            }
            
            // Merge fields, prioritizing existing values
            employee.employmentDetails = {
              ...onboardingData.employmentDetails,
              ...employee.employmentDetails
            };
          }
        }
      }
    }
    
    // Check submitted documents status
    if (documents && documents.length > 0) {
      // Create personalInfo if it doesn't exist
      if (!employee.personalInfo) {
        employee.personalInfo = {};
      }
      
      // Set document flags based on actual documents
      const hasTaxDocument = documents.some(doc => 
        doc.category === 'tax' || 
        (doc.title && doc.title.toLowerCase().includes('tax')) ||
        (doc.documentType === 'tax')
      );
      
      const hasWorkAuthDocument = documents.some(doc => 
        doc.category === 'work_authorization' || 
        (doc.title && doc.title.toLowerCase().includes('work authorization')) ||
        (doc.documentType === 'work_authorization')
      );
      
      const hasCitizenshipDocument = documents.some(doc => 
        doc.category === 'citizenship' || 
        (doc.title && doc.title.toLowerCase().includes('citizenship')) ||
        (doc.documentType === 'citizenship')
      );
      
      // Update document submission flags
      if (hasTaxDocument) {
        employee.personalInfo.taxDocumentsSubmitted = true;
      }
      
      if (hasWorkAuthDocument) {
        employee.personalInfo.workAuthorizationSubmitted = true;
      }
      
      if (hasCitizenshipDocument) {
        employee.personalInfo.citizenshipProofSubmitted = true;
      }
    }

    // Log debugging information
    console.log('Returning employee data with document flags:', 
      employee.personalInfo?.taxDocumentsSubmitted,
      employee.personalInfo?.workAuthorizationSubmitted,
      employee.personalInfo?.citizenshipProofSubmitted
    );

    return res.json({
      employee,
      tasks,
      documents,
      onboardingProcess,
      onboardingData
    });
  } catch (error) {
    console.error('Error fetching employee details:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update employee by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateEmployeeById = async (req, res) => {
  try {
    const employee = await User.findById(req.params.id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Fields that HR/Admin can update about an employee
    const {
      firstName,
      lastName,
      email,
      phoneNumber,
      department,
      manager,
      jobTitle,
      startDate,
      status,
      address,
      emergencyContact
    } = req.body;

    // Build update object with only the fields provided
    const updateData = {};
    
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (email !== undefined) updateData.email = email;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (department !== undefined) updateData.department = department;
    if (manager !== undefined) updateData.manager = manager;
    if (jobTitle !== undefined) updateData.jobTitle = jobTitle;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (status !== undefined) updateData.status = status;
    if (address !== undefined) updateData.address = address;
    if (emergencyContact !== undefined) updateData.emergencyContact = emergencyContact;

    // Update the employee
    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select('-password')
      .populate('department', 'name description')
      .populate('manager', 'firstName lastName email');

    return res.json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update employee onboarding status
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateOnboardingStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { status } = req.body;

    // Update the employee
    const updatedEmployee = await User.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          'onboarding.status': status,
          'onboarding.updatedAt': new Date()
        } 
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    return res.json({
      message: 'Onboarding status updated successfully',
      employee: updatedEmployee
    });
  } catch (error) {
    console.error('Error updating onboarding status:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get employee's documents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployeeDocuments = async (req, res) => {
  try {
    // Check if requesting own documents or has proper permissions
    if (
      req.params.id !== req.user.id &&
      !['admin', 'hr'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Not authorized to access these documents' });
    }

    // Get documents related to the employee
    const documents = await Document.find({ 
      $or: [
        { owner: req.params.id },
        { sharedWith: req.params.id }
      ]
    })
      .populate('owner', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email')
      .populate('signatures.user', 'firstName lastName email')
      .sort({ createdAt: -1 });

    return res.json(documents);
  } catch (error) {
    console.error('Error fetching employee documents:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get employee's tasks
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getEmployeeTasks = async (req, res) => {
  try {
    // Check if requesting own tasks or has proper permissions
    if (
      req.params.id !== req.user.id &&
      !['admin', 'hr', 'manager'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Not authorized to access these tasks' });
    }

    // If manager, verify if the employee reports to them
    if (req.user.role === 'manager') {
      const employee = await User.findById(req.params.id);
      if (!employee || employee.manager.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Not authorized to access these tasks' });
      }
    }

    // Get tasks assigned to the employee
    const tasks = await EmployeeTask.find({ assignedTo: req.params.id })
      .populate('assignedBy', 'firstName lastName email role')
      .populate('category')
      .sort({ dueDate: 1 });

    return res.json(tasks);
  } catch (error) {
    console.error('Error fetching employee tasks:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Employee not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Approve employee onboarding
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const approveOnboarding = async (req, res) => {
  try {
    // Find the employee
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update onboarding status to completed
    employee.onboarding.status = 'completed';
    employee.onboarding.approvedBy = req.user.id;
    employee.onboarding.approvedAt = new Date();
    employee.onboarding.isApproved = true;

    // Save changes
    await employee.save();

    // Create notification for the employee
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        title: 'Onboarding Approved',
        message: 'Your onboarding has been approved. Welcome to the team!',
        type: 'system', // Use valid enum value
        recipient: employee._id,
        isRead: false
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Continue execution even if notification creation fails
    }

    return res.json({
      message: 'Onboarding approved successfully',
      employee: {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        onboarding: employee.onboarding
      }
    });
  } catch (error) {
    console.error('Error approving onboarding:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Reject employee onboarding
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const rejectOnboarding = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { reason, feedback } = req.body;

    // Find the employee
    const employee = await User.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Update onboarding status
    employee.onboarding.status = 'in_progress';
    employee.onboarding.rejectedBy = req.user.id;
    employee.onboarding.rejectedAt = new Date();
    employee.onboarding.rejectionReason = reason;
    employee.onboarding.feedback = feedback;
    employee.onboarding.isApproved = false;

    // Save changes
    await employee.save();

    // Create notification for the employee
    try {
      const Notification = require('../models/Notification');
      await Notification.create({
        title: 'Onboarding Needs Attention',
        message: `Your onboarding requires some updates: ${feedback}`,
        type: 'system', // Use valid enum value
        recipient: employee._id,
        isRead: false
      });
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Continue execution even if notification creation fails
    }

    return res.json({
      message: 'Onboarding rejected with feedback',
      employee: {
        _id: employee._id,
        firstName: employee.firstName,
        lastName: employee.lastName,
        email: employee.email,
        onboarding: employee.onboarding
      }
    });
  } catch (error) {
    console.error('Error rejecting onboarding:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getEmployees,
  getCurrentEmployee,
  updateEmployee,
  updateStatus,
  getEmployeeById,
  updateEmployeeById,
  updateOnboardingStatus,
  getEmployeeDocuments,
  getEmployeeTasks,
  approveOnboarding,
  rejectOnboarding
}; 