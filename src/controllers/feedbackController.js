const { validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');

/**
 * Submit new feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { rating, comments, category = 'general' } = req.body;

    // Create new feedback
    const newFeedback = new Feedback({
      rating,
      comments,
      category,
      user: req.user.id,
      date: new Date()
    });

    // Save feedback
    await newFeedback.save();

    return res.status(201).json({
      message: 'Feedback submitted successfully',
      feedback: newFeedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get all feedback (for admin/hr)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFeedback = async (req, res) => {
  try {
    const { 
      category, 
      rating, 
      startDate, 
      endDate,
      page = 1, 
      limit = 20,
      sort = '-date' 
    } = req.query;

    // Build filter object
    const filter = {};

    if (category) {
      filter.category = category;
    }

    if (rating) {
      filter.rating = parseInt(rating);
    }

    // Date filtering
    if (startDate || endDate) {
      filter.date = {};
      
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    // Count total feedback with the filter
    const totalFeedback = await Feedback.countDocuments(filter);

    // Parse sorting
    const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    const sortOrder = sort.startsWith('-') ? -1 : 1;
    const sortOptions = { [sortField]: sortOrder };

    // Fetch feedback with pagination and populate user details
    const feedback = await Feedback.find(filter)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('user', 'firstName lastName email department');

    return res.json({
      feedback,
      totalPages: Math.ceil(totalFeedback / limit),
      currentPage: Number(page),
      totalFeedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get feedback summary statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getFeedbackSummary = async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;

    // Build filter object
    const filter = {};

    if (category) {
      filter.category = category;
    }

    // Date filtering
    if (startDate || endDate) {
      filter.date = {};
      
      if (startDate) {
        filter.date.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.date.$lte = new Date(endDate);
      }
    }

    // Get overall statistics
    const totalFeedback = await Feedback.countDocuments(filter);
    
    // Get average rating
    const averageRatingResult = await Feedback.aggregate([
      { $match: filter },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } }
    ]);
    
    const averageRating = averageRatingResult.length > 0 
      ? parseFloat(averageRatingResult[0].averageRating.toFixed(1)) 
      : 0;

    // Get rating distribution
    const ratingDistribution = await Feedback.aggregate([
      { $match: filter },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Get category distribution
    const categoryDistribution = await Feedback.aggregate([
      { $match: filter },
      { $group: { _id: '$category', count: { $sum: 1 }, averageRating: { $avg: '$rating' } } },
      { $sort: { _id: 1 } }
    ]);

    // Get recent trend (average rating by month for the last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrend = await Feedback.aggregate([
      { 
        $match: { 
          ...filter,
          date: { $gte: sixMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: '$date' },
            month: { $month: '$date' }
          },
          averageRating: { $avg: '$rating' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    return res.json({
      totalFeedback,
      averageRating,
      ratingDistribution,
      categoryDistribution,
      monthlyTrend
    });
  } catch (error) {
    console.error('Error fetching feedback summary:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Get feedback submitted by the current user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user.id })
      .sort({ date: -1 });

    return res.json(feedback);
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

/**
 * Delete feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    await feedback.deleteOne();

    return res.json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Feedback not found' });
    }
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  submitFeedback,
  getFeedback,
  getFeedbackSummary,
  getUserFeedback,
  deleteFeedback
}; 