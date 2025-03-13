const express = require('express');
const {
  getComplianceItems,
  getComplianceItem,
  createComplianceItem,
  updateComplianceItem,
  deleteComplianceItem
} = require('../controllers/compliance');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Apply protection to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getComplianceItems)
  .post(authorize('hr', 'it'), upload.single('document'), createComplianceItem);

router.route('/:id')
  .get(getComplianceItem)
  .put(upload.single('document'), updateComplianceItem)
  .delete(authorize('hr', 'it'), deleteComplianceItem);

module.exports = router; 