const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  createAccessRequest,
  getAccessRequests,
  getAccessRequest,
  updateRequestStatus,
  assignRequest,
  addApproval,
  getMyAccessRequests,
  getPendingApprovals
} = require('../controllers/accessRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route   POST /api/access-requests
// @desc    Create a new access request
// @access  Private
router.post(
  '/',
  protect,
  [
    check('requestType', 'Request type is required').not().isEmpty().isIn(['access_grant', 'access_revoke', 'asset_request', 'asset_return', 'software_access', 'other']),
    check('title', 'Title is required').not().isEmpty(),
    check('description', 'Description is required').not().isEmpty()
  ],
  createAccessRequest
);

// @route   GET /api/access-requests
// @desc    Get all access requests
// @access  Private (filtered by user role)
router.get('/', protect, getAccessRequests);

// @route   GET /api/access-requests/me
// @desc    Get my access requests
// @access  Private
router.get('/me', protect, getMyAccessRequests);

// @route   GET /api/access-requests/pending-approval
// @desc    Get access requests pending approval
// @access  Private (Managers only)
router.get(
  '/pending-approval',
  protect,
  authorize('manager', 'department_admin', 'hr_admin'),
  getPendingApprovals
);

// @route   GET /api/access-requests/:id
// @desc    Get a single access request
// @access  Private (with permissions check)
router.get('/:id', protect, getAccessRequest);

// @route   PUT /api/access-requests/:id/status
// @desc    Update access request status
// @access  Private (IT Admin only)
router.put(
  '/:id/status',
  protect,
  authorize('it_admin'),
  [
    check('status', 'Status is required').not().isEmpty().isIn(['pending', 'approved', 'rejected', 'in_progress', 'completed', 'cancelled'])
  ],
  updateRequestStatus
);

// @route   PUT /api/access-requests/:id/assign
// @desc    Assign access request to IT staff
// @access  Private (IT Admin only)
router.put(
  '/:id/assign',
  protect,
  authorize('it_admin'),
  [
    check('assignedTo', 'Assigned user ID is required').not().isEmpty()
  ],
  assignRequest
);

// @route   POST /api/access-requests/:id/approvals
// @desc    Add approval to access request
// @access  Private (Managers, Department Heads)
router.post(
  '/:id/approvals',
  protect,
  authorize('manager', 'department_admin', 'hr_admin'),
  [
    check('status', 'Status is required').not().isEmpty().isIn(['approved', 'rejected', 'pending']),
    check('comments', 'Comments are required').not().isEmpty()
  ],
  addApproval
);

module.exports = router; 