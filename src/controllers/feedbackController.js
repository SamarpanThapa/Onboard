const { validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const Notification = require('../models/Notification');

/**
 * Submit new feedback
 * @route   POST /api/feedback
 * @access  Private
 */
exports.submitFeedback = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { rating, comments, category } = req.body;

    // Create new feedback
    const newFeedback = new Feedback({
      user: req.user.id,
      rating,
      comments,
      category,
      date: new Date()
    });

    // Save feedback to database
    await newFeedback.save();

    // Get user details for the notification
    const user = await User.findById(req.user.id).select('name email department');

    // Find HR admin users to send notifications to
    const hrAdmins = await User.find({ role: 'hr_admin' }).select('_id');
    
    // If no HR admins exist, find any admin users
    let recipients = hrAdmins.map(admin => admin._id);
    if (recipients.length === 0) {
      const admins = await User.find({ role: 'admin' }).select('_id');
      recipients = admins.map(admin => admin._id);
    }
    
    // Only create notifications if we have recipients
    if (recipients.length > 0) {
      // Create individual notifications for each recipient
      const notificationPromises = recipients.map(recipientId => {
        const notification = new Notification({
          title: 'New Feedback Submitted',
          message: `${user.name} has submitted feedback about the ${category} process.`,
          type: 'feedback',
          priority: 'medium',
          sender: req.user.id,
          recipient: recipientId, // Individual recipient ID
          relatedTo: {
            model: 'Feedback',
            id: newFeedback._id
          }
        });
        return notification.save();
      });
      
      // Save all notifications
      await Promise.all(notificationPromises);
    }

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: newFeedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get all feedback (admin/hr only)
 * @route   GET /api/feedback
 * @access  Private (Admin, HR)
 */
exports.getFeedback = async (req, res) => {
  try {
    // First, clean up expired feedback entries
    const today = new Date();
    await Feedback.deleteMany({ expiryDate: { $lt: today } });

    // Build query with filters
    const queryObj = {};

    // Category filter
    if (req.query.category) {
      queryObj.category = req.query.category;
    }

    // Rating filter
    if (req.query.rating) {
      queryObj.rating = parseInt(req.query.rating);
    }

    // Status filter
    if (req.query.status) {
      queryObj.status = req.query.status;
    }

    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      queryObj.date = {};
      
      if (req.query.startDate) {
        queryObj.date.$gte = new Date(req.query.startDate);
      }
      
      if (req.query.endDate) {
        queryObj.date.$lte = new Date(req.query.endDate);
      }
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Get total count
    const total = await Feedback.countDocuments(queryObj);

    // Get feedback with pagination and populate user details
    const feedback = await Feedback.find(queryObj)
      .populate('user', 'name email department')
      .populate('reviewedBy', 'name email')
      .sort({ date: -1 })
      .skip(skip)
      .limit(limit);

    return res.status(200).json({
      success: true,
      count: feedback.length,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit)
      },
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get feedback submitted by current user
 * @route   GET /api/feedback/user
 * @access  Private
 */
exports.getUserFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.find({ user: req.user.id })
      .sort({ date: -1 });

    return res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching user feedback:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get feedback by ID
 * @route   GET /api/feedback/:id
 * @access  Private (Admin, HR or feedback owner)
 */
exports.getFeedbackById = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate('user', 'name email department')
      .populate('reviewedBy', 'name email');

    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        message: 'Feedback not found' 
      });
    }

    // Check if user is authorized to view this feedback
    const isAdmin = ['admin', 'hr_admin'].includes(req.user.role);
    const isOwner = feedback.user._id.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to access this feedback' 
      });
    }

    return res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Feedback not found' 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Update feedback status, add response
 * @route   PUT /api/feedback/:id
 * @access  Private (Admin, HR)
 */
exports.updateFeedbackStatus = async (req, res) => {
  try {
    const { status, responseMessage } = req.body;

    // Validate inputs
    if (!status || !['pending', 'reviewed', 'archived'].includes(status)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid status value' 
      });
    }

    // Find feedback
    let feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        message: 'Feedback not found' 
      });
    }

    // Update feedback
    feedback.status = status;
    
    if (status === 'reviewed') {
      feedback.reviewedBy = req.user.id;
      feedback.reviewedAt = new Date();
    }
    
    if (responseMessage) {
      feedback.responseMessage = responseMessage;
    }

    await feedback.save();

    // If status changed to reviewed, create notification for the feedback submitter
    if (status === 'reviewed' && responseMessage) {
      const notification = new Notification({
        recipient: feedback.user,
        title: 'Feedback Response',
        message: 'Your feedback has been reviewed. Click to view the response.',
        type: 'feedback_response',
        sender: req.user.id,
        relatedTo: {
          model: 'Feedback',
          id: feedback._id
        }
      });

      await notification.save();
    }

    return res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (error) {
    console.error('Error updating feedback:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Feedback not found' 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Delete feedback
 * @route   DELETE /api/feedback/:id
 * @access  Private (Admin, HR or feedback owner)
 */
exports.deleteFeedback = async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ 
        success: false,
        message: 'Feedback not found' 
      });
    }

    // Check if user is authorized to delete this feedback
    const isAdmin = ['admin', 'hr_admin'].includes(req.user.role);
    const isOwner = feedback.user.toString() === req.user.id;

    if (!isAdmin && !isOwner) {
      return res.status(403).json({ 
        success: false,
        message: 'Not authorized to delete this feedback' 
      });
    }

    // Use findByIdAndDelete instead of the deprecated remove() method
    await Feedback.findByIdAndDelete(req.params.id);

    return res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting feedback:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ 
        success: false,
        message: 'Feedback not found' 
      });
    }
    return res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

/**
 * Get feedback summary statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.getFeedbackSummary = async (req, res) => {
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
 * Submit exit interview feedback
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
exports.submitExitInterview = async (req, res) => {
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
exports.getExitInterview = async (req, res) => {
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
exports.sendExitSurvey = async (req, res) => {
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
exports.getExitSurveyAnalytics = async (req, res) => {
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