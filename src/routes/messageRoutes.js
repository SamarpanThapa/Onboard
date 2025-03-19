const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const auth = require('../middleware/auth');
const messageController = require('../controllers/messageController');

/**
 * @route GET /api/messages
 * @desc Get messages for the current user
 * @access Private
 */
router.get('/', auth.authenticateToken, messageController.getMessages);

/**
 * @route POST /api/messages
 * @desc Send a new message
 * @access Private
 */
router.post('/',
  auth.authenticateToken,
  [
    body('message').trim().notEmpty().withMessage('Message content is required'),
    body('type')
      .optional()
      .isIn(['question', 'update', 'notification'])
      .withMessage('Invalid message type'),
    body('category')
      .optional()
      .isIn(['onboarding', 'general', 'it', 'hr'])
      .withMessage('Invalid message category'),
  ],
  messageController.sendMessage
);

/**
 * @route GET /api/messages/:id
 * @desc Get a specific message by ID
 * @access Private
 */
router.get('/:id', auth.authenticateToken, messageController.getMessage);

/**
 * @route PUT /api/messages/:id/read
 * @desc Mark a message as read
 * @access Private
 */
router.put('/:id/read', auth.authenticateToken, messageController.markAsRead);

/**
 * @route DELETE /api/messages/:id
 * @desc Delete a message
 * @access Private
 */
router.delete('/:id', auth.authenticateToken, messageController.deleteMessage);

/**
 * @route GET /api/messages/conversations
 * @desc Get conversations for the current user
 * @access Private
 */
router.get('/conversations', auth.authenticateToken, messageController.getConversations);

module.exports = router; 