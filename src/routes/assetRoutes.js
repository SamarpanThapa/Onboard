const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  createAsset,
  getAssets,
  getAsset,
  updateAsset,
  deleteAsset,
  assignAsset,
  unassignAsset,
  addMaintenanceRecord,
  getUserAssets,
  getInventorySummary
} = require('../controllers/assetController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/assets
// @desc    Create a new asset
// @access  Private (IT Admin only)
router.post(
  '/',
  protect,
  authorize('it_admin'),
  [
    check('assetType', 'Asset type is required').not().isEmpty().isIn(['hardware', 'software', 'peripheral', 'other']),
    check('name', 'Asset name is required').not().isEmpty()
  ],
  createAsset
);

// @route   GET /api/assets
// @desc    Get all assets
// @access  Private (IT Admin)
router.get(
  '/',
  protect,
  authorize('it_admin', 'hr_admin'),
  getAssets
);

// @route   GET /api/assets/inventory
// @desc    Get asset inventory summary
// @access  Private (IT Admin)
router.get(
  '/inventory',
  protect,
  authorize('it_admin', 'hr_admin'),
  getInventorySummary
);

// @route   GET /api/assets/user/:userId
// @desc    Get assets assigned to a user
// @access  Private
router.get(
  '/user/:userId',
  protect,
  getUserAssets
);

// @route   GET /api/assets/:id
// @desc    Get a single asset
// @access  Private
router.get(
  '/:id',
  protect,
  getAsset
);

// @route   PUT /api/assets/:id
// @desc    Update an asset
// @access  Private (IT Admin)
router.put(
  '/:id',
  protect,
  authorize('it_admin'),
  updateAsset
);

// @route   DELETE /api/assets/:id
// @desc    Delete an asset
// @access  Private (IT Admin)
router.delete(
  '/:id',
  protect,
  authorize('it_admin'),
  deleteAsset
);

// @route   PUT /api/assets/:id/assign
// @desc    Assign asset to a user
// @access  Private (IT Admin)
router.put(
  '/:id/assign',
  protect,
  authorize('it_admin'),
  [
    check('userId', 'User ID is required').not().isEmpty()
  ],
  assignAsset
);

// @route   PUT /api/assets/:id/unassign
// @desc    Unassign asset from a user
// @access  Private (IT Admin)
router.put(
  '/:id/unassign',
  protect,
  authorize('it_admin'),
  unassignAsset
);

// @route   POST /api/assets/:id/maintenance
// @desc    Add maintenance record to an asset
// @access  Private (IT Admin)
router.post(
  '/:id/maintenance',
  protect,
  authorize('it_admin'),
  [
    check('type', 'Maintenance type is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty()
  ],
  addMaintenanceRecord
);

module.exports = router; 