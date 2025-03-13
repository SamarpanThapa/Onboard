const express = require('express');
const {
  getDepartmentCodes,
  getActiveDepartmentCodes,
  createDepartmentCode,
  updateDepartmentCode,
  deleteDepartmentCode,
  verifyDepartmentCode
} = require('../controllers/departmentCodes');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Public routes
router.post('/verify', verifyDepartmentCode);

// Protected routes
router.use(protect);
router.use(authorize('it'));

router.route('/')
  .get(getDepartmentCodes)
  .post(createDepartmentCode);

router.get('/active', getActiveDepartmentCodes);

router.route('/:id')
  .put(updateDepartmentCode)
  .delete(deleteDepartmentCode);

module.exports = router; 