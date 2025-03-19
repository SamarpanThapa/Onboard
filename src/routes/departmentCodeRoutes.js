const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const { 
  verifyDepartmentCode,
  getDepartmentCodes,
  getActiveDepartmentCodes,
  createDepartmentCode,
  updateDepartmentCode,
  deleteDepartmentCode
} = require('../controllers/departmentCodeController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// @route   POST /api/department-codes/verify
// @desc    Verify a department code
// @access  Public
router.post(
  '/verify',
  [
    check('code', 'Department code is required').not().isEmpty()
  ],
  verifyDepartmentCode
);

// @route   GET /api/department-codes
// @desc    Get all department codes
// @access  Private/IT Admin
router.get(
  '/',
  authenticateToken,
  authorizeRoles('it_admin'),
  getDepartmentCodes
);

// @route   GET /api/department-codes/active
// @desc    Get active department codes
// @access  Private/IT Admin
router.get(
  '/active',
  authenticateToken,
  authorizeRoles('it_admin'),
  getActiveDepartmentCodes
);

// @route   POST /api/department-codes
// @desc    Create a department code
// @access  Private/IT Admin
router.post(
  '/',
  authenticateToken,
  authorizeRoles('it_admin'),
  [
    check('code', 'Department code is required').not().isEmpty(),
    check('department', 'Department name is required').not().isEmpty()
  ],
  createDepartmentCode
);

// @route   PUT /api/department-codes/:id
// @desc    Update a department code
// @access  Private/IT Admin
router.put(
  '/:id',
  authenticateToken,
  authorizeRoles('it_admin'),
  updateDepartmentCode
);

// @route   DELETE /api/department-codes/:id
// @desc    Delete a department code
// @access  Private/IT Admin
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles('it_admin'),
  deleteDepartmentCode
);

module.exports = router; 