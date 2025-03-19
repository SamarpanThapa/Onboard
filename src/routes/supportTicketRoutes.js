const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const supportTicketController = require('../controllers/supportTicketController');

/**
 * @route GET /api/support-tickets
 * @desc Get all support tickets (filtered by status, category, etc.)
 * @access Private
 */
router.get('/', 
  auth.authenticateToken, 
  supportTicketController.getTickets
);

/**
 * @route GET /api/support-tickets/me
 * @desc Get all support tickets for the current user
 * @access Private
 */
router.get('/me', 
  auth.authenticateToken, 
  supportTicketController.getUserTickets
);

/**
 * @route POST /api/support-tickets
 * @desc Create a new support ticket
 * @access Private
 */
router.post('/',
  auth.authenticateToken,
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('description').trim().notEmpty().withMessage('Description is required'),
    body('category')
      .isIn(['it', 'hr', 'onboarding', 'other'])
      .withMessage('Invalid category'),
    body('priority')
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority')
  ],
  supportTicketController.createTicket
);

/**
 * @route GET /api/support-tickets/:id
 * @desc Get a specific support ticket
 * @access Private
 */
router.get('/:id', 
  auth.authenticateToken, 
  supportTicketController.getTicket
);

/**
 * @route PUT /api/support-tickets/:id
 * @desc Update a support ticket
 * @access Private
 */
router.put('/:id',
  auth.authenticateToken,
  [
    body('status')
      .optional()
      .isIn(['open', 'in_progress', 'resolved', 'closed'])
      .withMessage('Invalid status'),
    body('priority')
      .optional()
      .isIn(['low', 'medium', 'high'])
      .withMessage('Invalid priority')
  ],
  supportTicketController.updateTicket
);

/**
 * @route POST /api/support-tickets/:id/comments
 * @desc Add a comment to a support ticket
 * @access Private
 */
router.post('/:id/comments',
  auth.authenticateToken,
  [
    body('text').trim().notEmpty().withMessage('Comment text is required')
  ],
  supportTicketController.addComment
);

/**
 * @route POST /api/support-tickets/:id/assign
 * @desc Assign a support ticket to a staff member
 * @access Private (Staff only)
 */
router.post('/:id/assign',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'it', 'hr']),
  [
    body('assignedTo').notEmpty().withMessage('Assigned user ID is required')
  ],
  supportTicketController.assignTicket
);

/**
 * @route POST /api/support-tickets/:id/resolve
 * @desc Resolve a support ticket
 * @access Private (Staff only)
 */
router.post('/:id/resolve',
  auth.authenticateToken,
  auth.authorizeRoles(['admin', 'it', 'hr']),
  [
    body('resolution').trim().notEmpty().withMessage('Resolution details are required')
  ],
  supportTicketController.resolveTicket
);

module.exports = router; 