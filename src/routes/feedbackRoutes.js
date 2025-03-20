const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const { 
  submitFeedback, 
  getFeedback, 
  getFeedbackSummary,
  getUserFeedback,
  deleteFeedback,
  submitExitInterview,
  getExitInterview,
  sendExitSurvey,
  getExitSurveyAnalytics
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
    check('rating', 'Rating must be between 1 and 5').isInt({ min: 1, max: 5 })
  ],
  submitFeedback
);

/**
 * @route GET /api/feedback
 * @desc Get all feedback (for admin/hr)
 * @access Private (Admin/HR only)
 */
router.get('/',
  protect,
  authorize('admin', 'hr_admin'),
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
 * @route GET /api/feedback/me
 * @desc Get feedback submitted by the current user
 * @access Private
 */
router.get('/user',
  protect,
  getUserFeedback
);

/**
 * @route DELETE /api/feedback/:id
 * @desc Delete feedback
 * @access Private (Admin only)
 */
router.delete('/:id',
  protect,
  authorize('admin', 'hr_admin'),
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

module.exports = router; 