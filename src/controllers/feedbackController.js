const { validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Notification = require('../models/Notification');

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

/**
 * Submit exit interview feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitExitInterview = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { 
      employeeId, 
      overallExperience, 
      reasonForLeaving,
      managerFeedback,
      teamFeedback,
      companyFeedback,
      improvementSuggestions,
      wouldRecommend,
      returnPossibility,
      additionalComments 
    } = req.body;

    // Create feedback schema is too simple for this, so let's make a more detailed feedback
    const exitInterview = new Feedback({
      rating: overallExperience, // Use the overall experience as the main rating
      comments: JSON.stringify({
        reasonForLeaving,
        managerFeedback,
        teamFeedback,
        companyFeedback,
        improvementSuggestions,
        wouldRecommend,
        returnPossibility,
        additionalComments
      }),
      category: 'offboarding',
      user: employeeId || req.user.id,
      date: new Date()
    });

    // Save exit interview
    await exitInterview.save();

    return res.status(201).json({
      success: true,
      message: 'Exit interview submitted successfully',
      data: exitInterview
    });
  } catch (error) {
    console.error('Error submitting exit interview:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get exit interview data for an employee
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExitInterview = async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    // Find the exit interview for this employee
    const exitInterview = await Feedback.findOne({
      user: employeeId,
      category: 'offboarding'
    }).populate('user', 'firstName lastName email department position');

    if (!exitInterview) {
      return res.status(404).json({
        success: false,
        message: 'Exit interview not found for this employee'
      });
    }

    // Parse the JSON stored in comments
    let detailedFeedback = {};
    try {
      detailedFeedback = JSON.parse(exitInterview.comments);
    } catch (e) {
      detailedFeedback = { additionalComments: exitInterview.comments };
    }

    return res.json({
      success: true,
      data: {
        ...exitInterview.toObject(),
        overallExperience: exitInterview.rating,
        ...detailedFeedback
      }
    });
  } catch (error) {
    console.error('Error retrieving exit interview:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Generate and send exit survey
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const sendExitSurvey = async (req, res) => {
  try {
    const { employeeId, customMessage } = req.body;
    
    // This would normally send an email with a link to the exit survey
    // For now, we'll just create a notification or record that a survey was sent
    
    // Check if employee exists
    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    // Create a notification for the employee
    await Notification.create({
      recipient: employeeId,
      title: 'Exit Survey',
      message: customMessage || 'Please complete your exit survey. Your feedback is valuable to us.',
      type: 'offboarding',
      isRead: false,
      sender: req.user._id,
      link: '/exit-survey'
    });
    
    return res.json({
      success: true,
      message: 'Exit survey sent successfully',
      data: {
        sentTo: employee.email,
        sentAt: new Date()
      }
    });
  } catch (error) {
    console.error('Error sending exit survey:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

/**
 * Get exit survey analytics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getExitSurveyAnalytics = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate,
      department
    } = req.query;
    
    // Build filter object
    const filter = {
      category: 'offboarding'
    };
    
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
    
    // Get all exit interviews matching the criteria
    const exitInterviews = await Feedback.find(filter)
      .populate('user', 'firstName lastName email department position');
    
    // Filter by department if specified
    let filteredInterviews = exitInterviews;
    if (department) {
      filteredInterviews = exitInterviews.filter(interview => 
        interview.user && interview.user.department === department
      );
    }
    
    // Calculate analytics
    const totalResponses = filteredInterviews.length;
    
    // Average overall experience
    const totalRating = filteredInterviews.reduce((sum, interview) => sum + interview.rating, 0);
    const averageRating = totalResponses > 0 ? totalRating / totalResponses : 0;
    
    // Analyze reasons for leaving
    const reasonsForLeaving = {};
    const wouldRecommendCount = { yes: 0, no: 0, maybe: 0 };
    const returnPossibilityCount = { yes: 0, no: 0, maybe: 0 };
    
    // Collect all comments for sentiment analysis
    const allComments = [];
    
    filteredInterviews.forEach(interview => {
      try {
        const details = JSON.parse(interview.comments);
        
        // Track reasons for leaving
        if (details.reasonForLeaving) {
          reasonsForLeaving[details.reasonForLeaving] = (reasonsForLeaving[details.reasonForLeaving] || 0) + 1;
        }
        
        // Track recommendation and return possibility
        if (details.wouldRecommend) {
          wouldRecommendCount[details.wouldRecommend.toLowerCase()] = 
            (wouldRecommendCount[details.wouldRecommend.toLowerCase()] || 0) + 1;
        }
        
        if (details.returnPossibility) {
          returnPossibilityCount[details.returnPossibility.toLowerCase()] = 
            (returnPossibilityCount[details.returnPossibility.toLowerCase()] || 0) + 1;
        }
        
        // Collect comments for analysis
        if (details.additionalComments) {
          allComments.push(details.additionalComments);
        }
        if (details.improvementSuggestions) {
          allComments.push(details.improvementSuggestions);
        }
      } catch (e) {
        // If the comments field isn't valid JSON, just skip this interview
        console.error('Error parsing exit interview comments:', e);
      }
    });
    
    // Return the analytics
    return res.json({
      success: true,
      data: {
        totalResponses,
        averageRating,
        reasonsForLeaving,
        wouldRecommendCount,
        returnPossibilityCount,
        departmentBreakdown: filteredInterviews.reduce((acc, interview) => {
          const dept = interview.user?.department || 'Unknown';
          acc[dept] = (acc[dept] || 0) + 1;
          return acc;
        }, {}),
        // Simple word cloud data from comments
        commonTerms: allComments.length > 0 ? extractCommonTerms(allComments.join(' ')) : []
      }
    });
  } catch (error) {
    console.error('Error retrieving exit survey analytics:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

// Helper function to extract common terms for a word cloud
function extractCommonTerms(text) {
  // Remove common stop words
  const stopWords = ['the', 'and', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about', 'as', 'of', 'is', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'but', 'or', 'if', 'because', 'as', 'until', 'while', 'that', 'which', 'this', 'these', 'those', 'then', 'than'];
  
  // Split into words, convert to lowercase, and remove punctuation
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.includes(word));
  
  // Count word frequency
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Convert to array and sort by frequency
  return Object.entries(wordCount)
    .map(([text, value]) => ({ text, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 30); // Return top 30 words
}

module.exports = {
  submitFeedback,
  getFeedback,
  getFeedbackSummary,
  getUserFeedback,
  deleteFeedback,
  submitExitInterview,
  getExitInterview,
  sendExitSurvey,
  getExitSurveyAnalytics
}; 