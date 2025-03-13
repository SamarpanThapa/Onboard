const express = require('express');
const {
  getFeedback,
  getUserFeedback,
  getSingleFeedback,
  createFeedback,
  updateFeedback,
  deleteFeedback
} = require('../controllers/feedback');

const router = express.Router();

const { protect, authorize } = require('../middleware/auth');

// Apply protection to all routes
router.use(protect);

// Routes
router.route('/')
  .get(authorize('hr', 'it'), getFeedback)
  .post(createFeedback);

router.get('/me', getUserFeedback);

router.route('/:id')
  .get(getSingleFeedback)
  .put(authorize('hr', 'it'), updateFeedback)
  .delete(deleteFeedback);

module.exports = router; 