const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const feedbackController = require('../controllers/feedbackController');

/**
 * @route POST /api/feedback
 * @desc Submit new feedback
 * @access Private
 */
router.post('/',
  auth.authenticateToken,
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comments')
      .optional()
      .trim(),
    body('category')
      .optional()
      .isIn(['onboarding', 'offboarding', 'general', 'system', 'resources'])
      .withMessage('Invalid category')
  ],
  feedbackController.submitFeedback
);

/**
 * @route GET /api/feedback
 * @desc Get all feedback (for admin/hr)
 * @access Private (Admin/HR only)
 */
router.get('/',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'hr']),
  feedbackController.getFeedback
);

/**
 * @route GET /api/feedback/summary
 * @desc Get summary statistics of feedback
 * @access Private (Admin/HR only)
 */
router.get('/summary',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'hr']),
  feedbackController.getFeedbackSummary
);

/**
 * @route GET /api/feedback/me
 * @desc Get feedback submitted by the current user
 * @access Private
 */
router.get('/me',
  auth.authenticateToken,
  feedbackController.getUserFeedback
);

/**
 * @route DELETE /api/feedback/:id
 * @desc Delete feedback
 * @access Private (Admin only)
 */
router.delete('/:id',
  auth.authenticateToken,
  auth.authorizeRoles(['admin']),
  feedbackController.deleteFeedback
);

module.exports = router; 