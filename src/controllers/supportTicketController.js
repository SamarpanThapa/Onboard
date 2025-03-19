const { validationResult } = require('express-validator');
const SupportTicket = require('../models/SupportTicket');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Get all support tickets (with filtering)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTickets = async (req, res) => {
  try {
    const { 
      status, 
      category, 
      priority, 
      assignedTo, 
      page = 1, 
      limit = 20,
      sort = '-createdAt' 
    } = req.query;

    // Build filter object
    const filter = {};

    // Only admins, IT, and HR can see all tickets
    if (!['admin', 'it', 'hr'].includes(req.user.role)) {
      filter.createdBy = req.user.id;
    }

    if (status) {
      filter.status = status;
    }

    if (category) {
      filter.category = category;
    }

    if (priority) {
      filter.priority = priority;
    }

    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }

    // Count total tickets with the filter
    const totalTickets = await SupportTicket.countDocuments(filter);

    // Parse sorting
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const sortOptions = { [sortField]: sortOrder };

    // Fetch tickets with pagination and populate references
    const tickets = await SupportTicket.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('createdBy', 'firstName lastName email profileImage')
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('comments.user', 'firstName lastName email profileImage');

    return res.json({
      tickets,
      totalPages: Math.ceil(totalTickets / limit),
      currentPage: Number(page),
      totalTickets
    });
  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get support tickets for the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserTickets = async (req, res) => {
  try {
    const { 
      status, 
      page = 1, 
      limit = 20,
      sort = '-createdAt' 
    } = req.query;

    // Build filter object
    const filter = { createdBy: req.user.id };

    if (status) {
      filter.status = status;
    }

    // Count total tickets with the filter
    const totalTickets = await SupportTicket.countDocuments(filter);

    // Parse sorting
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const sortOptions = { [sortField]: sortOrder };

    // Fetch tickets with pagination and populate references
    const tickets = await SupportTicket.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('comments.user', 'firstName lastName email profileImage');

    return res.json({
      tickets,
      totalPages: Math.ceil(totalTickets / limit),
      currentPage: Number(page),
      totalTickets
    });
  } catch (error) {
    console.error('Error fetching user support tickets:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Create a new support ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { title, description, category, priority } = req.body;

    // Create new ticket
    const newTicket = new SupportTicket({
      title,
      description,
      category,
      priority,
      status: 'open',
      createdBy: req.user.id,
      createdAt: new Date()
    });

    // Save ticket
    await newTicket.save();

    // Create notification for IT or HR staff (based on category)
    const staffRole = category === 'it' ? 'it' : 'hr';
    const staffMembers = await User.find({ role: staffRole }).select('_id');
    
    if (staffMembers.length > 0) {
      const notifications = staffMembers.map(staff => ({
        title: 'New Support Ticket',
        message: `A new ${category} support ticket has been created: ${title}`,
        type: 'ticket',
        recipient: staff._id,
        relatedRecord: {
          model: 'SupportTicket',
          id: newTicket._id
        }
      }));
      
      await Notification.insertMany(notifications);
    }

    // Return the created ticket
    const populatedTicket = await SupportTicket.findById(newTicket._id)
      .populate('createdBy', 'firstName lastName email profileImage');

    return res.status(201).json(populatedTicket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get a specific support ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getTicket = async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email profileImage')
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('comments.user', 'firstName lastName email profileImage');

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Check if user is authorized to view the ticket
    if (
      ticket.createdBy._id.toString() !== req.user.id &&
      !['admin', 'it', 'hr'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }

    return res.json(ticket);
  } catch (error) {
    console.error('Error fetching support ticket:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Update a support ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Check authorization for the update
    const isCreator = ticket.createdBy.toString() === req.user.id;
    const isStaff = ['admin', 'it', 'hr'].includes(req.user.role);
    
    if (!isCreator && !isStaff) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    // Regular users can only update their own tickets with limited fields
    if (isCreator && !isStaff) {
      const allowedFields = ['description', 'priority'];
      const updateFields = Object.keys(req.body);
      
      const hasInvalidFields = updateFields.some(field => !allowedFields.includes(field));
      if (hasInvalidFields) {
        return res.status(403).json({ 
          message: 'You are only allowed to update the description and priority' 
        });
      }
    }

    // Update the ticket
    const updatedTicket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { 
        ...req.body,
        lastUpdated: {
          date: new Date(),
          user: req.user.id
        }
      },
      { new: true, runValidators: true }
    )
      .populate('createdBy', 'firstName lastName email profileImage')
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('comments.user', 'firstName lastName email profileImage');

    // Create notification for status updates
    if (req.body.status && req.body.status !== ticket.status) {
      // Notify ticket creator
      await Notification.create({
        title: 'Support Ticket Update',
        message: `Your support ticket "${ticket.title}" has been updated to ${req.body.status}`,
        type: 'ticket',
        recipient: ticket.createdBy,
        relatedRecord: {
          model: 'SupportTicket',
          id: ticket._id
        }
      });
    }

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Error updating support ticket:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Add a comment to a support ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const addComment = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Check if user is authorized to comment on the ticket
    if (
      ticket.createdBy.toString() !== req.user.id &&
      !['admin', 'it', 'hr'].includes(req.user.role)
    ) {
      return res.status(403).json({ message: 'Not authorized to comment on this ticket' });
    }

    // Create comment
    const newComment = {
      text: req.body.text,
      user: req.user.id,
      createdAt: new Date()
    };

    // Add comment to ticket
    ticket.comments.push(newComment);
    ticket.lastUpdated = {
      date: new Date(),
      user: req.user.id
    };

    await ticket.save();

    // Populate the updated ticket
    const updatedTicket = await SupportTicket.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email profileImage')
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('comments.user', 'firstName lastName email profileImage');

    // Create notification
    // If staff commented, notify the creator
    // If creator commented, notify staff assigned or all staff of that category
    const isStaff = ['admin', 'it', 'hr'].includes(req.user.role);
    
    if (isStaff && ticket.createdBy.toString() !== req.user.id) {
      // Staff commented, notify creator
      await Notification.create({
        title: 'New Comment on Your Ticket',
        message: `A staff member has commented on your support ticket "${ticket.title}"`,
        type: 'ticket',
        recipient: ticket.createdBy,
        relatedRecord: {
          model: 'SupportTicket',
          id: ticket._id
        }
      });
    } else if (!isStaff) {
      // User commented, notify assigned staff or all staff in category
      let recipients = [];
      
      if (ticket.assignedTo) {
        recipients.push(ticket.assignedTo);
      } else {
        // If no assigned staff, notify all staff in the category
        const staffRole = ticket.category === 'it' ? 'it' : 'hr';
        const staffMembers = await User.find({ role: staffRole }).select('_id');
        recipients = staffMembers.map(staff => staff._id);
      }
      
      if (recipients.length > 0) {
        const notifications = recipients.map(recipient => ({
          title: 'New Comment on Ticket',
          message: `The user has added a comment to support ticket "${ticket.title}"`,
          type: 'ticket',
          recipient,
          relatedRecord: {
            model: 'SupportTicket',
            id: ticket._id
          }
        }));
        
        await Notification.insertMany(notifications);
      }
    }

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Error adding comment to support ticket:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Assign a support ticket to a staff member
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const assignTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    const { assignedTo } = req.body;

    // Verify the assignee exists and is staff
    const assignee = await User.findById(assignedTo);
    if (!assignee) {
      return res.status(404).json({ message: 'Assigned user not found' });
    }

    if (!['admin', 'it', 'hr'].includes(assignee.role)) {
      return res.status(400).json({ message: 'Can only assign tickets to staff members' });
    }

    // Update ticket
    ticket.assignedTo = assignedTo;
    ticket.status = 'in_progress';
    ticket.lastUpdated = {
      date: new Date(),
      user: req.user.id
    };

    await ticket.save();

    // Notify the assigned staff member
    await Notification.create({
      title: 'Ticket Assigned to You',
      message: `You have been assigned to support ticket "${ticket.title}"`,
      type: 'ticket',
      recipient: assignedTo,
      relatedRecord: {
        model: 'SupportTicket',
        id: ticket._id
      }
    });

    // Notify the ticket creator
    await Notification.create({
      title: 'Ticket Assigned',
      message: `Your support ticket "${ticket.title}" has been assigned to a staff member`,
      type: 'ticket',
      recipient: ticket.createdBy,
      relatedRecord: {
        model: 'SupportTicket',
        id: ticket._id
      }
    });

    // Return the updated ticket
    const updatedTicket = await SupportTicket.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email profileImage')
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('comments.user', 'firstName lastName email profileImage');

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Error assigning support ticket:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Resolve a support ticket
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const resolveTicket = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const ticket = await SupportTicket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }

    // Update ticket
    ticket.status = 'resolved';
    ticket.resolution = req.body.resolution;
    ticket.resolvedAt = new Date();
    ticket.resolvedBy = req.user.id;
    ticket.lastUpdated = {
      date: new Date(),
      user: req.user.id
    };

    await ticket.save();

    // Notify the ticket creator
    await Notification.create({
      title: 'Support Ticket Resolved',
      message: `Your support ticket "${ticket.title}" has been resolved`,
      type: 'ticket',
      recipient: ticket.createdBy,
      relatedRecord: {
        model: 'SupportTicket',
        id: ticket._id
      }
    });

    // Return the updated ticket
    const updatedTicket = await SupportTicket.findById(req.params.id)
      .populate('createdBy', 'firstName lastName email profileImage')
      .populate('assignedTo', 'firstName lastName email profileImage')
      .populate('resolvedBy', 'firstName lastName email profileImage')
      .populate('comments.user', 'firstName lastName email profileImage');

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Error resolving support ticket:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getTickets,
  getUserTickets,
  createTicket,
  getTicket,
  updateTicket,
  addComment,
  assignTicket,
  resolveTicket
}; 