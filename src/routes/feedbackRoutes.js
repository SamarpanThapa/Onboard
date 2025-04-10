const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
  submitFeedback, 
  getFeedback, 
  getFeedbackSummary,
  getUserFeedback,
  getFeedbackById,
  updateFeedbackStatus,
  deleteFeedback,
  submitExitInterview,
  getExitInterview,
  sendExitSurvey,
  getExitSurveyAnalytics,
  respondToFeedback
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/authMiddleware');

/**
 * @route POST /api/feedback
 * @desc Submit new feedback
 * @access Private
 */
router.post('/',
  protect,
  [
    check('rating', 'Rating is required').isNumeric(),
    check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('comments', 'Please provide your feedback').not().isEmpty(),
    check('category', 'Category is required').isIn(['onboarding', 'system', 'support', 'documentation', 'general'])
  ],
  submitFeedback
);

/**
 * @route GET /api/feedback
 * @desc Get all feedback (admin/hr only)
 * @access Private (Admin, HR)
 */
router.get('/', 
  protect, 
  authorize('hr_admin', 'admin'),
  getFeedback
);

/**
 * @route GET /api/feedback/summary
 * @desc Get summary statistics of feedback
 * @access Private (Admin/HR only)
 */
router.get('/summary',
  protect,
  authorize('admin', 'hr_admin'),
  getFeedbackSummary
);

/**
 * @route GET /api/feedback/user
 * @desc Get feedback submitted by current user
 * @access Private
 */
router.get('/user', 
  protect, 
  getUserFeedback
);

/**
 * @route GET /api/feedback/:id
 * @desc Get feedback by ID
 * @access Private (Admin, HR or feedback owner)
 */
router.get('/:id', 
  protect,
  getFeedbackById
);

/**
 * @route PUT /api/feedback/:id
 * @desc Update feedback status, add response
 * @access Private (Admin, HR)
 */
router.put('/:id',
  protect,
  authorize('hr_admin', 'admin'),
  updateFeedbackStatus
);

/**
 * @route DELETE /api/feedback/:id
 * @desc Delete feedback
 * @access Private (Admin, HR or feedback owner)
 */
router.delete('/:id',
  protect,
  deleteFeedback
);

/**
 * @route POST /api/feedback/exit-interview
 * @desc Submit exit interview
 * @access Private
 */
router.post('/exit-interview',
  protect,
  [
    check('overallExperience', 'Overall experience rating is required').isNumeric(),
    check('overallExperience', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 }),
    check('reasonForLeaving', 'Reason for leaving is required').not().isEmpty()
  ],
  submitExitInterview
);

/**
 * @route GET /api/feedback/exit-interview/:employeeId
 * @desc Get exit interview for an employee
 * @access Private/Admin
 */
router.get('/exit-interview/:employeeId',
  protect,
  authorize('admin', 'hr_admin'),
  getExitInterview
);

/**
 * @route POST /api/feedback/exit-survey
 * @desc Send exit survey to employee
 * @access Private/Admin
 */
router.post('/exit-survey',
  protect,
  authorize('admin', 'hr_admin'),
  [
    check('employeeId', 'Employee ID is required').not().isEmpty()
  ],
  sendExitSurvey
);

/**
 * @route GET /api/feedback/exit-survey/analytics
 * @desc Get exit survey analytics
 * @access Private/Admin
 */
router.get('/exit-survey/analytics',
  protect,
  authorize('admin', 'hr_admin'),
  getExitSurveyAnalytics
);

/**
 * @route POST /api/feedback/:id/respond
 * @desc Respond to specific feedback
 * @access Private (Admin, HR)
 */
router.post('/:id/respond',
  protect,
  authorize('hr_admin', 'admin'),
  [
    check('responseMessage', 'Response message is required').not().isEmpty(),
    check('status', 'Status is required').isIn(['reviewed', 'archived'])
  ],
  respondToFeedback
);

module.exports = router; 