const express = require('express');
const {
  getResources,
  getResource,
  createResource,
  updateResource,
  deleteResource,
  downloadResource
} = require('../controllers/resources');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Apply protection to all routes
router.use(protect);

// Routes
router.route('/')
  .get(getResources)
  .post(authorize('hr', 'it'), upload.single('file'), createResource);

router.route('/:id')
  .get(getResource)
  .put(authorize('hr', 'it'), upload.single('file'), updateResource)
  .delete(authorize('hr', 'it'), deleteResource);

router.get('/:id/download', downloadResource);

module.exports = router; 