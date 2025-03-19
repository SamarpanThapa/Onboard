const { validationResult } = require('express-validator');
const AccessRequest = require('../models/AccessRequest');
const User = require('../models/User');
const Asset = require('../models/Asset');
const Notification = require('../models/Notification');

// @desc    Create a new access request
// @route   POST /api/access-requests
// @access  Private
exports.createAccessRequest = async (req, res) => {
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
      requestType,
      title,
      description,
      requestedFor,
      relatedAsset,
      accessDetails,
      priority
    } = req.body;

    // Validate requestedFor user exists
    if (requestedFor) {
      const forUser = await User.findById(requestedFor);
      if (!forUser) {
        return res.status(400).json({
          success: false,
          message: 'Requested for user not found'
        });
      }
    }

    // Validate asset exists if provided
    if (relatedAsset) {
      const asset = await Asset.findById(relatedAsset);
      if (!asset) {
        return res.status(400).json({
          success: false,
          message: 'Related asset not found'
        });
      }
    }

    // Create the access request
    const request = await AccessRequest.create({
      requestType,
      title,
      description,
      requestedBy: req.user._id,
      requestedFor: requestedFor || req.user._id,
      relatedAsset,
      accessDetails: accessDetails ? 
        (typeof accessDetails === 'string' ? JSON.parse(accessDetails) : accessDetails) : 
        undefined,
      priority: priority || 'medium',
      status: 'pending'
    });

    // Create notification for IT department
    // Find IT admins to notify
    const itAdmins = await User.find({ role: 'it_admin' }).select('_id');
    
    if (itAdmins.length > 0) {
      const notifications = itAdmins.map(admin => ({
        recipient: admin._id,
        title: 'New Access Request',
        message: `A new ${requestType} request has been submitted: ${title}`,
        type: 'access_request',
        priority: priority || 'medium',
        relatedObject: {
          objectType: 'accessRequest',
          objectId: request._id,
          link: `/access-requests/${request._id}`
        },
        sender: req.user._id,
        isSystemGenerated: false
      }));

      await Notification.insertMany(notifications);
    }

    // Populate the created request
    const populatedRequest = await AccessRequest.findById(request._id)
      .populate('requestedBy', 'name email')
      .populate('requestedFor', 'name email department position')
      .populate('relatedAsset', 'name assetType');

    res.status(201).json({
      success: true,
      data: populatedRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all access requests
// @route   GET /api/access-requests
// @access  Private (IT Admin)
exports.getAccessRequests = async (req, res) => {
  try {
    // Build query based on filters
    let query = {};

    // For non-IT admin users, only show their own requests
    if (req.user.role !== 'it_admin') {
      query = {
        $or: [
          { requestedBy: req.user._id },
          { requestedFor: req.user._id }
        ]
      };
    }

    // Filter by request type
    if (req.query.requestType) {
      query.requestType = req.query.requestType;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by priority
    if (req.query.priority) {
      query.priority = req.query.priority;
    }

    // Filter by assigned status
    if (req.query.assigned === 'true') {
      query.assignedTo = { $exists: true, $ne: null };
    } else if (req.query.assigned === 'false') {
      query.assignedTo = { $exists: false };
    }

    // Search by title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await AccessRequest.countDocuments(query);

    // Get access requests with pagination
    const requests = await AccessRequest.find(query)
      .populate('requestedBy', 'name email')
      .populate('requestedFor', 'name email department position')
      .populate('relatedAsset', 'name assetType')
      .populate('assignedTo', 'name email')
      .populate('approvals.approver', 'name email position')
      .sort(req.query.sort ? { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 } : { createdAt: -1 })
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
      count: requests.length,
      pagination,
      total,
      data: requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single access request
// @route   GET /api/access-requests/:id
// @access  Private (with appropriate permissions)
exports.getAccessRequest = async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id)
      .populate('requestedBy', 'name email')
      .populate('requestedFor', 'name email department position')
      .populate('relatedAsset', 'name assetType')
      .populate('assignedTo', 'name email')
      .populate('approvals.approver', 'name email position');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    // Check if user has permission to view
    const isInvolved = 
      request.requestedBy._id.toString() === req.user._id.toString() ||
      request.requestedFor._id.toString() === req.user._id.toString() ||
      (request.assignedTo && request.assignedTo._id.toString() === req.user._id.toString()) ||
      request.approvals.some(approval => approval.approver._id.toString() === req.user._id.toString());

    if (req.user.role !== 'it_admin' && !isInvolved) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this access request'
      });
    }

    res.status(200).json({
      success: true,
      data: request
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update access request status
// @route   PUT /api/access-requests/:id/status
// @access  Private (IT Admin)
exports.updateRequestStatus = async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    const { status, notes } = req.body;

    // Update status
    request.status = status;

    // Add notes if provided
    if (notes) {
      request.notes = request.notes 
        ? `${request.notes}\n\n[${new Date().toISOString()}] Status updated to "${status}" by ${req.user.name}: ${notes}`
        : `[${new Date().toISOString()}] Status updated to "${status}" by ${req.user.name}: ${notes}`;
    }

    // If completed, set completedDate
    if (status === 'completed') {
      request.completedDate = new Date();
    }

    await request.save();

    // Create notification for the requester
    await Notification.create({
      recipient: request.requestedBy,
      title: 'Access Request Status Updated',
      message: `Your access request "${request.title}" has been updated to status: ${status}`,
      type: 'access_request',
      relatedObject: {
        objectType: 'accessRequest',
        objectId: request._id,
        link: `/access-requests/${request._id}`
      },
      sender: req.user._id,
      isSystemGenerated: false
    });

    // If different from requester, also notify the person the request is for
    if (request.requestedBy.toString() !== request.requestedFor.toString()) {
      await Notification.create({
        recipient: request.requestedFor,
        title: 'Access Request Status Updated',
        message: `An access request for you "${request.title}" has been updated to status: ${status}`,
        type: 'access_request',
        relatedObject: {
          objectType: 'accessRequest',
          objectId: request._id,
          link: `/access-requests/${request._id}`
        },
        sender: req.user._id,
        isSystemGenerated: false
      });
    }

    // Get the updated request with populated fields
    const updatedRequest = await AccessRequest.findById(request._id)
      .populate('requestedBy', 'name email')
      .populate('requestedFor', 'name email department position')
      .populate('relatedAsset', 'name assetType')
      .populate('assignedTo', 'name email')
      .populate('approvals.approver', 'name email position');

    res.status(200).json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Assign access request to IT staff
// @route   PUT /api/access-requests/:id/assign
// @access  Private (IT Admin)
exports.assignRequest = async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    const { assignedTo } = req.body;

    // Check if user exists
    const user = await User.findById(assignedTo);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Verify user is IT staff
    if (user.role !== 'it_admin') {
      return res.status(400).json({
        success: false,
        message: 'User must be an IT administrator'
      });
    }

    // Update assignment
    request.assignedTo = assignedTo;
    
    // If status is pending, update to in_progress
    if (request.status === 'pending') {
      request.status = 'in_progress';
    }

    await request.save();

    // Create notification for the assigned IT staff
    await Notification.create({
      recipient: assignedTo,
      title: 'Access Request Assigned',
      message: `You have been assigned to handle the access request: ${request.title}`,
      type: 'access_request',
      priority: request.priority,
      relatedObject: {
        objectType: 'accessRequest',
        objectId: request._id,
        link: `/access-requests/${request._id}`
      },
      sender: req.user._id,
      isSystemGenerated: false
    });

    // Get the updated request with populated fields
    const updatedRequest = await AccessRequest.findById(request._id)
      .populate('requestedBy', 'name email')
      .populate('requestedFor', 'name email department position')
      .populate('relatedAsset', 'name assetType')
      .populate('assignedTo', 'name email')
      .populate('approvals.approver', 'name email position');

    res.status(200).json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Add approval to access request
// @route   POST /api/access-requests/:id/approvals
// @access  Private (Managers, Department Heads)
exports.addApproval = async (req, res) => {
  try {
    const request = await AccessRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Access request not found'
      });
    }

    const { status, comments } = req.body;

    // Check if user already has an approval entry
    const existingApprovalIndex = request.approvals.findIndex(
      approval => approval.approver.toString() === req.user._id.toString()
    );

    if (existingApprovalIndex !== -1) {
      // Update existing approval
      request.approvals[existingApprovalIndex].status = status;
      request.approvals[existingApprovalIndex].comments = comments;
      request.approvals[existingApprovalIndex].timestamp = new Date();
    } else {
      // Add new approval
      request.approvals.push({
        approver: req.user._id,
        status,
        comments,
        timestamp: new Date()
      });
    }

    await request.save();

    // Create notification for the requester
    await Notification.create({
      recipient: request.requestedBy,
      title: 'Access Request Approval Updated',
      message: `Your access request "${request.title}" has received an approval update (${status})`,
      type: 'access_request',
      relatedObject: {
        objectType: 'accessRequest',
        objectId: request._id,
        link: `/access-requests/${request._id}`
      },
      sender: req.user._id,
      isSystemGenerated: false
    });

    // Notify IT admins
    const itAdmins = await User.find({ role: 'it_admin' }).select('_id');
    
    if (itAdmins.length > 0) {
      const notifications = itAdmins.map(admin => ({
        recipient: admin._id,
        title: 'Access Request Approval Updated',
        message: `Access request "${request.title}" has received an approval update (${status})`,
        type: 'access_request',
        relatedObject: {
          objectType: 'accessRequest',
          objectId: request._id,
          link: `/access-requests/${request._id}`
        },
        sender: req.user._id,
        isSystemGenerated: false
      }));

      await Notification.insertMany(notifications);
    }

    // Get the updated request with populated fields
    const updatedRequest = await AccessRequest.findById(request._id)
      .populate('requestedBy', 'name email')
      .populate('requestedFor', 'name email department position')
      .populate('relatedAsset', 'name assetType')
      .populate('assignedTo', 'name email')
      .populate('approvals.approver', 'name email position');

    res.status(200).json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get my access requests
// @route   GET /api/access-requests/me
// @access  Private
exports.getMyAccessRequests = async (req, res) => {
  try {
    // Find requests made by or for the current user
    const requests = await AccessRequest.find({
      $or: [
        { requestedBy: req.user._id },
        { requestedFor: req.user._id }
      ]
    })
      .populate('requestedBy', 'name email')
      .populate('requestedFor', 'name email department position')
      .populate('relatedAsset', 'name assetType')
      .populate('assignedTo', 'name email')
      .populate('approvals.approver', 'name email position')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get access requests pending approval
// @route   GET /api/access-requests/pending-approval
// @access  Private (Managers, Department Heads)
exports.getPendingApprovals = async (req, res) => {
  try {
    // Find users managed by current user
    const managedUsers = await User.find({
      'employmentDetails.manager': req.user._id
    }).select('_id');

    // Create array of managed user IDs
    const managedUserIds = managedUsers.map(user => user._id);

    // Find pending requests for managed users
    const requests = await AccessRequest.find({
      requestedFor: { $in: managedUserIds },
      status: { $in: ['pending', 'in_progress'] },
      // Either no approvals from this user or pending approval
      $or: [
        { 'approvals.approver': { $ne: req.user._id } },
        { 'approvals': { $elemMatch: { approver: req.user._id, status: 'pending' } } }
      ]
    })
      .populate('requestedBy', 'name email')
      .populate('requestedFor', 'name email department position')
      .populate('relatedAsset', 'name assetType')
      .populate('assignedTo', 'name email')
      .populate('approvals.approver', 'name email position')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      data: requests
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 