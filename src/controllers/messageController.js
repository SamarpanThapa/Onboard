const { validationResult } = require('express-validator');
const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Get messages for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMessages = async (req, res) => {
  try {
    const { page = 1, limit = 20, conversation, category, type } = req.query;
    const filter = {
      $or: [
        { sender: req.user.id },
        { recipient: req.user.id }
      ]
    };

    // Add optional filters
    if (conversation) {
      const otherUser = await User.findById(conversation);
      if (!otherUser) {
        return res.status(404).json({ message: 'Conversation partner not found' });
      }
      filter.$or = [
        { sender: req.user.id, recipient: conversation },
        { sender: conversation, recipient: req.user.id }
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (type) {
      filter.type = type;
    }

    // Paginate and fetch messages
    const messages = await Message.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('sender', 'firstName lastName email profileImage')
      .populate('recipient', 'firstName lastName email profileImage');

    // Get total count for pagination
    const totalMessages = await Message.countDocuments(filter);

    return res.json({
      messages,
      totalPages: Math.ceil(totalMessages / limit),
      currentPage: Number(page),
      totalMessages
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Send a new message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendMessage = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { message, recipient, type = 'question', category = 'general' } = req.body;

    // Create message object
    const newMessage = new Message({
      message,
      sender: req.user.id,
      recipient: recipient || null, // If no recipient, it's a broadcast or system message
      type,
      category,
      isRead: false,
      createdAt: new Date()
    });

    // Save to database
    await newMessage.save();

    // Populate sender and recipient details
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'firstName lastName email profileImage')
      .populate('recipient', 'firstName lastName email profileImage');

    return res.status(201).json(populatedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a specific message by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id)
      .populate('sender', 'firstName lastName email profileImage')
      .populate('recipient', 'firstName lastName email profileImage');

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is authorized to view this message
    if (
      message.sender._id.toString() !== req.user.id &&
      (!message.recipient || message.recipient._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({ message: 'Not authorized to view this message' });
    }

    return res.json(message);
  } catch (error) {
    console.error('Error fetching message:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Mark a message as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markAsRead = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is the recipient
    if (!message.recipient || message.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to mark this message as read' });
    }

    // Update message
    message.isRead = true;
    message.readAt = new Date();
    await message.save();

    return res.json({ message: 'Message marked as read', data: message });
  } catch (error) {
    console.error('Error marking message as read:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete a message
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    // Check if user is authorized to delete this message
    if (message.sender.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this message' });
    }

    await message.deleteOne();

    return res.json({ message: 'Message deleted' });
  } catch (error) {
    console.error('Error deleting message:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Message not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get conversations for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getConversations = async (req, res) => {
  try {
    // Find all unique conversations
    const sentMessages = await Message.find({ sender: req.user.id })
      .distinct('recipient')
      .populate('recipient', 'firstName lastName email profileImage');

    const receivedMessages = await Message.find({ recipient: req.user.id })
      .distinct('sender')
      .populate('sender', 'firstName lastName email profileImage');

    // Combine and deduplicate conversation partners
    const conversationPartnerIds = new Set([
      ...sentMessages.map(id => id?.toString()),
      ...receivedMessages.map(id => id?.toString())
    ].filter(Boolean));

    // Fetch details for each conversation partner
    const conversations = await Promise.all(
      Array.from(conversationPartnerIds).map(async (userId) => {
        const partner = await User.findById(userId).select('firstName lastName email profileImage');
        
        if (!partner) return null;

        // Get the latest message in this conversation
        const latestMessage = await Message.findOne({
          $or: [
            { sender: req.user.id, recipient: userId },
            { sender: userId, recipient: req.user.id }
          ]
        })
          .sort({ createdAt: -1 })
          .select('message createdAt isRead type');

        // Count unread messages
        const unreadCount = await Message.countDocuments({
          sender: userId,
          recipient: req.user.id,
          isRead: false
        });

        return {
          partner,
          latestMessage,
          unreadCount
        };
      })
    );

    // Filter out null values and sort by latest message date
    const validConversations = conversations
      .filter(Boolean)
      .sort((a, b) => {
        if (!a.latestMessage || !b.latestMessage) return 0;
        return new Date(b.latestMessage.createdAt) - new Date(a.latestMessage.createdAt);
      });

    return res.json(validConversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getMessages,
  sendMessage,
  getMessage,
  markAsRead,
  deleteMessage,
  getConversations
}; 