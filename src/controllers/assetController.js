const { validationResult } = require('express-validator');
const Asset = require('../models/Asset');
const User = require('../models/User');
const Notification = require('../models/Notification');

// @desc    Create a new asset
// @route   POST /api/assets
// @access  Private (IT Admin only)
exports.createAsset = async (req, res) => {
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
      assetType,
      name,
      description,
      hardwareDetails,
      softwareDetails,
      location,
      department,
      notes
    } = req.body;

    // Create asset data object
    const assetData = {
      assetType,
      name,
      description,
      location,
      department,
      notes,
      created: {
        by: req.user._id,
        at: new Date()
      }
    };

    // Add type-specific details
    if (assetType === 'hardware' && hardwareDetails) {
      assetData.hardwareDetails = typeof hardwareDetails === 'string' 
        ? JSON.parse(hardwareDetails) 
        : hardwareDetails;
    }

    if (assetType === 'software' && softwareDetails) {
      assetData.softwareDetails = typeof softwareDetails === 'string' 
        ? JSON.parse(softwareDetails) 
        : softwareDetails;
    }

    // Create the asset
    const asset = await Asset.create(assetData);

    res.status(201).json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all assets
// @route   GET /api/assets
// @access  Private (IT Admin)
exports.getAssets = async (req, res) => {
  try {
    // Build query based on filters
    const query = {};

    // Filter by asset type
    if (req.query.assetType) {
      query.assetType = req.query.assetType;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by department
    if (req.query.department) {
      query.department = req.query.department;
    }

    // Filter by location
    if (req.query.location) {
      query.location = req.query.location;
    }

    // Filter by assigned status
    if (req.query.assigned === 'true') {
      query.assignedTo = { $exists: true, $ne: null };
    } else if (req.query.assigned === 'false') {
      query.assignedTo = { $exists: false };
    }

    // Search by name or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex }
      ];
      
      // Also search in hardware details for serial number
      if (req.query.includeSerialSearch === 'true') {
        query.$or.push({ 'hardwareDetails.serialNumber': searchRegex });
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Asset.countDocuments(query);

    // Get assets with pagination
    const assets = await Asset.find(query)
      .populate('assignedTo', 'name email department')
      .populate('created.by', 'name email')
      .populate('lastUpdated.by', 'name email')
      .sort(req.query.sort ? { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 } : { 'created.at': -1 })
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
      count: assets.length,
      pagination,
      total,
      data: assets
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single asset
// @route   GET /api/assets/:id
// @access  Private
exports.getAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id)
      .populate('assignedTo', 'name email department position')
      .populate('created.by', 'name email')
      .populate('lastUpdated.by', 'name email')
      .populate('attachments.uploadedBy', 'name email');

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update an asset
// @route   PUT /api/assets/:id
// @access  Private (IT Admin)
exports.updateAsset = async (req, res) => {
  try {
    let asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Parse JSON strings if needed
    if (req.body.hardwareDetails && typeof req.body.hardwareDetails === 'string') {
      req.body.hardwareDetails = JSON.parse(req.body.hardwareDetails);
    }

    if (req.body.softwareDetails && typeof req.body.softwareDetails === 'string') {
      req.body.softwareDetails = JSON.parse(req.body.softwareDetails);
    }

    // Add last updated info
    req.body.lastUpdated = {
      by: req.user._id,
      at: new Date()
    };

    // Update the asset
    asset = await Asset.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('assignedTo', 'name email department position')
      .populate('created.by', 'name email')
      .populate('lastUpdated.by', 'name email');

    res.status(200).json({
      success: true,
      data: asset
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete an asset
// @route   DELETE /api/assets/:id
// @access  Private (IT Admin)
exports.deleteAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check if asset is currently assigned
    if (asset.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an asset that is currently assigned. Please unassign it first.'
      });
    }

    await asset.remove();

    res.status(200).json({
      success: true,
      message: 'Asset deleted successfully'
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Assign asset to a user
// @route   PUT /api/assets/:id/assign
// @access  Private (IT Admin)
exports.assignAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const { userId, notes } = req.body;

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if asset is already assigned
    if (asset.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Asset is already assigned to a user. Please unassign it first.'
      });
    }

    // Update asset with assignment info
    asset.assignedTo = userId;
    asset.assignedDate = new Date();
    asset.status = 'assigned';
    if (notes) {
      asset.notes = asset.notes ? `${asset.notes}\n\nAssignment note: ${notes}` : `Assignment note: ${notes}`;
    }

    // Add update info
    asset.lastUpdated = {
      by: req.user._id,
      at: new Date()
    };

    await asset.save();

    // Create notification for the user
    await Notification.create({
      recipient: userId,
      title: 'Asset Assigned',
      message: `You have been assigned a new ${asset.assetType}: ${asset.name}`,
      type: 'asset',
      priority: 'medium',
      relatedObject: {
        objectType: 'asset',
        objectId: asset._id,
        link: `/assets/${asset._id}`
      },
      sender: req.user._id,
      isSystemGenerated: false
    });

    // Get the updated asset with populated fields
    const updatedAsset = await Asset.findById(asset._id)
      .populate('assignedTo', 'name email department position')
      .populate('created.by', 'name email')
      .populate('lastUpdated.by', 'name email');

    res.status(200).json({
      success: true,
      data: updatedAsset
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Unassign asset from a user
// @route   PUT /api/assets/:id/unassign
// @access  Private (IT Admin)
exports.unassignAsset = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    // Check if asset is assigned
    if (!asset.assignedTo) {
      return res.status(400).json({
        success: false,
        message: 'Asset is not currently assigned to anyone'
      });
    }

    const { notes, condition } = req.body;

    // Store the user who had the asset for notification
    const previousUserId = asset.assignedTo;

    // Update asset with return info
    asset.returnDate = new Date();
    asset.assignedTo = null;
    asset.status = condition && condition === 'maintenance' ? 'maintenance' : 'available';
    
    // If hardware, update condition if provided
    if (asset.assetType === 'hardware' && condition) {
      asset.hardwareDetails.condition = condition;
    }
    
    if (notes) {
      asset.notes = asset.notes 
        ? `${asset.notes}\n\nReturn note: ${notes}` 
        : `Return note: ${notes}`;
    }

    // Add update info
    asset.lastUpdated = {
      by: req.user._id,
      at: new Date()
    };

    await asset.save();

    // Create notification for the previous user
    await Notification.create({
      recipient: previousUserId,
      title: 'Asset Returned',
      message: `The ${asset.assetType} "${asset.name}" has been returned and is no longer assigned to you.`,
      type: 'asset',
      relatedObject: {
        objectType: 'asset',
        objectId: asset._id,
        link: `/assets/${asset._id}`
      },
      sender: req.user._id,
      isSystemGenerated: false
    });

    // Get the updated asset with populated fields
    const updatedAsset = await Asset.findById(asset._id)
      .populate('created.by', 'name email')
      .populate('lastUpdated.by', 'name email');

    res.status(200).json({
      success: true,
      data: updatedAsset
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Add maintenance record to an asset
// @route   POST /api/assets/:id/maintenance
// @access  Private (IT Admin)
exports.addMaintenanceRecord = async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Asset not found'
      });
    }

    const { type, date, performedBy, cost, description, notes } = req.body;

    // Create maintenance record
    const maintenanceRecord = {
      type: type || 'other',
      date: date || new Date(),
      performedBy,
      cost: cost ? (typeof cost === 'string' ? JSON.parse(cost) : cost) : undefined,
      description,
      notes
    };

    // Add to maintenance history
    if (!asset.maintenanceHistory) {
      asset.maintenanceHistory = [];
    }
    
    asset.maintenanceHistory.push(maintenanceRecord);

    // Update asset status if it's in maintenance
    if (asset.status === 'maintenance' && req.body.updateStatus === 'true') {
      asset.status = asset.assignedTo ? 'assigned' : 'available';
    }

    // Add update info
    asset.lastUpdated = {
      by: req.user._id,
      at: new Date()
    };

    await asset.save();

    // Get the updated asset with populated fields
    const updatedAsset = await Asset.findById(asset._id)
      .populate('assignedTo', 'name email department position')
      .populate('created.by', 'name email')
      .populate('lastUpdated.by', 'name email');

    res.status(200).json({
      success: true,
      data: updatedAsset
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get assets assigned to a user
// @route   GET /api/assets/user/:userId
// @access  Private
exports.getUserAssets = async (req, res) => {
  try {
    const { userId } = req.params;

    // Verify the user exists
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if the requester has permission
    const isAdmin = ['hr_admin', 'it_admin'].includes(req.user.role);
    const isSelf = req.user._id.toString() === userId.toString();
    const isManager = user.employmentDetails?.manager?.toString() === req.user._id.toString();

    if (!isAdmin && !isSelf && !isManager) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this user\'s assets'
      });
    }

    // Get all assets assigned to the user
    const assets = await Asset.find({ assignedTo: userId })
      .populate('created.by', 'name email')
      .populate('lastUpdated.by', 'name email');

    res.status(200).json({
      success: true,
      count: assets.length,
      data: assets
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get asset inventory summary
// @route   GET /api/assets/inventory
// @access  Private (IT Admin)
exports.getInventorySummary = async (req, res) => {
  try {
    // Get counts by asset type
    const assetTypeCounts = await Asset.aggregate([
      {
        $group: {
          _id: '$assetType',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get counts by status
    const statusCounts = await Asset.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get total assets assigned vs. available
    const assignedCount = await Asset.countDocuments({ 
      assignedTo: { $exists: true, $ne: null } 
    });
    
    const totalCount = await Asset.countDocuments();

    // Get most recently updated assets
    const recentAssets = await Asset.find()
      .sort({ 'lastUpdated.at': -1 })
      .limit(5)
      .populate('assignedTo', 'name email')
      .populate('lastUpdated.by', 'name');

    res.status(200).json({
      success: true,
      data: {
        assetTypeCounts: assetTypeCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        statusCounts: statusCounts.reduce((acc, curr) => {
          acc[curr._id] = curr.count;
          return acc;
        }, {}),
        totalAssets: totalCount,
        assignedAssets: assignedCount,
        availableAssets: totalCount - assignedCount,
        recentAssets
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 