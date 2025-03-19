const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  createOnboardingProcess,
  getOnboardingProcesses,
  getOnboardingProcess,
  updateOnboardingProcess,
  updateProcessStatus,
  addTaskToProcess,
  getMyOnboardingProcess,
  getOnboardingMetrics,
  getAllProcesses,
  getProcessById,
  deleteProcess,
  getProcessesByStatus,
  getKanbanBoardData,
  addEmployeeToOnboarding,
  getPendingSubmissions,
  approveSubmission,
  requestRevision
} = require('../controllers/onboardingProcessController');
const { protect, authorize } = require('../middleware/authMiddleware');
const OnboardingProcess = require('../models/OnboardingProcess');
const User = require('../models/User');

// @route   POST /api/onboarding-processes
// @desc    Create a new onboarding process
// @access  Private (HR Admin only)
router.post(
  '/',
  protect,
  authorize('hr_admin'),
  [
    check('employee', 'Employee ID is required').not().isEmpty(),
    check('startDate', 'Start date must be a valid date').optional().isDate()
  ],
  createOnboardingProcess
);

// @route   GET /api/onboarding-processes
// @desc    Get all onboarding processes
// @access  Private (HR Admin only)
router.get(
  '/',
  protect,
  authorize('hr_admin'),
  getAllProcesses
);

// @route   GET /api/onboarding-processes/me
// @desc    Get my onboarding process (for current employee)
// @access  Private
router.get(
  '/me',
  protect,
  getMyOnboardingProcess
);

// @route   GET /api/onboarding-processes/metrics
// @desc    Get onboarding metrics
// @access  Private (HR Admin only)
router.get(
  '/metrics',
  protect,
  authorize('hr_admin'),
  getOnboardingMetrics
);

// @route   GET /api/onboarding-processes/:id
// @desc    Get a single onboarding process
// @access  Private (HR Admin or relevant manager/employee)
router.get(
  '/:id',
  protect,
  getProcessById
);

// @route   PUT /api/onboarding-processes/:id
// @desc    Update an onboarding process
// @access  Private (HR Admin only)
router.put(
  '/:id',
  protect,
  authorize('hr_admin'),
  updateOnboardingProcess
);

// @route   PUT /api/onboarding-processes/:id/status
// @desc    Update onboarding process status
// @access  Private (HR Admin only)
router.put(
  '/:id/status',
  protect,
  authorize('hr_admin'),
  [
    check('status', 'Status is required').not().isEmpty(),
    check('status', 'Invalid status').isIn(['not_started', 'in_progress', 'completed', 'on_hold', 'terminated'])
  ],
  updateProcessStatus
);

// @route   POST /api/onboarding-processes/:id/tasks
// @desc    Add a task to an onboarding process
// @access  Private (HR Admin only)
router.post(
  '/:id/tasks',
  protect,
  authorize('hr_admin'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('dueDate', 'Due date is required').not().isEmpty()
  ],
  addTaskToProcess
);

// @route   POST /api/onboarding-processes/submit
// @desc    Submit onboarding data from form
// @access  Private
router.post(
  '/submit',
  protect,
  async (req, res) => {
    try {
      const userData = req.user;
      const onboardingData = req.body;
      
      console.log('Received onboarding data:', JSON.stringify(onboardingData, null, 2));
      
      // Check if user already has an onboarding process
      let existingProcess = await OnboardingProcess.findOne({
        employee: userData._id,
      }).populate('employee', 'name email department position');
      
      if (existingProcess) {
        // Update existing process
        existingProcess.status = onboardingData.onboarding.status || 'completed';
        
        // Set progress to 100% when completing the form
        if (!existingProcess.progress) {
          existingProcess.progress = {
            tasksCompleted: 0,
            totalTasks: 0,
            percentComplete: 0
          };
        }
        existingProcess.progress.percentComplete = 100;
        
        // Update personal information
        if (onboardingData.personalInfo) {
          // Get user to update
          const user = await User.findById(userData._id);
          
          if (!user) {
            return res.status(404).json({
              success: false,
              message: 'User not found'
            });
          }
          
          try {
            // Safely update user's personal information
            if (!user.personalInfo) user.personalInfo = {};
            Object.assign(user.personalInfo, onboardingData.personalInfo);
            
            // Safely update employment details
            if (onboardingData.employmentDetails) {
              if (!user.employmentDetails) user.employmentDetails = {};
              
              // Handle special fields like bankDetails and salary separately
              if (onboardingData.employmentDetails.bankDetails) {
                if (!user.employmentDetails.bankDetails) user.employmentDetails.bankDetails = {};
                Object.assign(user.employmentDetails.bankDetails, onboardingData.employmentDetails.bankDetails);
              }
              
              // Make sure salary is properly formatted if it exists
              if (onboardingData.employmentDetails.salary) {
                user.employmentDetails.salary = {
                  amount: onboardingData.employmentDetails.salary.amount || 0,
                  currency: onboardingData.employmentDetails.salary.currency || 'USD',
                  payPeriod: onboardingData.employmentDetails.salary.payPeriod || 'annual'
                };
              }
              
              // Copy remaining simple fields
              ['jobTitle', 'startDate', 'department', 'position', 'workSchedule'].forEach(field => {
                if (onboardingData.employmentDetails[field] !== undefined) {
                  user.employmentDetails[field] = onboardingData.employmentDetails[field];
                }
              });
            }
            
            // Update onboarding status
            user.onboarding = {
              ...user.onboarding,
              status: 'completed',
              completedAt: new Date()
            };
            
            // Save user updates
            await user.save();
          } catch (error) {
            console.error('Error updating user data:', error);
            return res.status(400).json({
              success: false,
              message: 'Failed to update user data',
              error: error.message
            });
          }
          
          // Update onboarding process
          existingProcess.keyDates.lastUpdated = new Date();
          existingProcess.keyDates.actualCompletionDate = new Date();
          existingProcess.updatedBy = userData._id;
          
          // Save onboarding process updates
          await existingProcess.save();
          
          // Return success response
          return res.status(200).json({
            success: true,
            message: 'Onboarding data updated successfully',
            data: existingProcess
          });
        }
      } else {
        // Create new onboarding process
        const newProcess = new OnboardingProcess({
          employee: userData._id,
          startDate: onboardingData.employmentDetails?.startDate || new Date(),
          status: onboardingData.onboarding?.status || 'completed',
          createdBy: userData._id,
          progress: {
            tasksCompleted: 0,
            totalTasks: 0,
            percentComplete: 100  // Set to 100% for completed onboarding
          },
          keyDates: {
            created: new Date(),
            lastUpdated: new Date(),
            actualCompletionDate: new Date()
          }
        });
        
        // Save new process
        await newProcess.save();
        
        // Update user with onboarding data
        const user = await User.findById(userData._id);
        
        if (!user) {
          return res.status(404).json({
            success: false,
            message: 'User not found'
          });
        }
        
        try {
          // Safely update personal information
          if (onboardingData.personalInfo) {
            if (!user.personalInfo) user.personalInfo = {};
            Object.assign(user.personalInfo, onboardingData.personalInfo);
          }
          
          // Safely update employment details
          if (onboardingData.employmentDetails) {
            if (!user.employmentDetails) user.employmentDetails = {};
            
            // Handle special fields like bankDetails and salary separately
            if (onboardingData.employmentDetails.bankDetails) {
              if (!user.employmentDetails.bankDetails) user.employmentDetails.bankDetails = {};
              Object.assign(user.employmentDetails.bankDetails, onboardingData.employmentDetails.bankDetails);
            }
            
            // Make sure salary is properly formatted
            if (onboardingData.employmentDetails.salary) {
              user.employmentDetails.salary = {
                amount: onboardingData.employmentDetails.salary.amount || 0,
                currency: onboardingData.employmentDetails.salary.currency || 'USD',
                payPeriod: onboardingData.employmentDetails.salary.payPeriod || 'annual'
              };
            }
            
            // Copy remaining simple fields
            ['jobTitle', 'startDate', 'department', 'position', 'workSchedule'].forEach(field => {
              if (onboardingData.employmentDetails[field] !== undefined) {
                user.employmentDetails[field] = onboardingData.employmentDetails[field];
              }
            });
          }
          
          // Update onboarding status
          user.onboarding = {
            ...user.onboarding,
            status: 'completed',
            completedAt: new Date()
          };
          
          // Save user updates
          await user.save();
        } catch (error) {
          console.error('Error submitting onboarding data:', error);
          return res.status(400).json({
            success: false,
            message: 'Failed to update user data',
            error: error.message
          });
        }
        
        // Return success response
        return res.status(201).json({
          success: true,
          message: 'Onboarding data submitted successfully',
          data: newProcess
        });
      }
    } catch (error) {
      console.error('Error submitting onboarding data:', error);
      return res.status(500).json({
        success: false,
        message: 'Server Error',
        error: error.message
      });
    }
  }
);

// @route   GET /api/onboarding-processes/status/:status
// @desc    Get onboarding processes by status
// @access  Private (HR Admin only)
router.get(
  '/status/:status',
  protect,
  authorize('hr_admin'),
  getProcessesByStatus
);

// @route   GET /api/onboarding-processes/kanban/board
// @desc    Get onboarding processes for kanban board grouped by status
// @access  Private (HR Admin only)
router.get(
  '/kanban/board',
  protect,
  authorize('hr_admin'),
  getKanbanBoardData
);

// @route   POST /api/onboarding-processes/employee
// @desc    Add employee to onboarding process
// @access  Private (HR Admin only)
router.post(
  '/employee',
  protect,
  authorize('hr_admin'),
  addEmployeeToOnboarding
);

// @route   GET /api/onboarding-processes/submissions/pending
// @desc    Get submissions pending approval
// @access  Private (HR Admin only)
router.get(
  '/submissions/pending',
  protect,
  authorize('hr_admin'),
  getPendingSubmissions
);

// @route   PATCH /api/onboarding-processes/submissions/:id/approve
// @desc    Approve onboarding submission
// @access  Private (HR Admin only)
router.patch(
  '/submissions/:id/approve',
  protect,
  authorize('hr_admin'),
  approveSubmission
);

// @route   PATCH /api/onboarding-processes/submissions/:id/revise
// @desc    Request revision for onboarding submission
// @access  Private (HR Admin only)
router.patch(
  '/submissions/:id/revise',
  protect,
  authorize('hr_admin'),
  requestRevision
);

module.exports = router; 