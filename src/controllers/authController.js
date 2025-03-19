const { validationResult } = require('express-validator');
const crypto = require('crypto');
const User = require('../models/User');
const Notification = require('../models/Notification');
const DepartmentCode = require('../models/DepartmentCode');
const generateToken = require('../utils/jwtUtils');
const { sendPasswordResetEmail } = require('../utils/emailUtils');
const nodemailer = require('nodemailer');

// @desc    Register a user
// @route   POST /api/auth/register
// @access  Public
exports.registerUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, departmentCode, position, startDate, role: requestedRole, companyName } = req.body;

    console.log('Registration request received:', { email, requestedRole, departmentCode });

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      console.log(`User with email ${email} already exists`);
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Check if department code is valid
    const departmentCodeObj = await DepartmentCode.findOne({ code: departmentCode, isActive: true });
    if (!departmentCodeObj) {
      return res.status(400).json({
        success: false,
        message: 'Invalid department code'
      });
    }

    console.log('Department code found:', departmentCodeObj);
    console.log('Request body:', req.body);

    // Determine role based on department code and requested role
    let role = 'employee';
    
    // Check if the requested role is allowed for this department code
    if (departmentCodeObj.allowedRoles && departmentCodeObj.allowedRoles.length > 0) {
      if (!departmentCodeObj.allowedRoles.includes(requestedRole)) {
        return res.status(400).json({
          success: false,
          message: `The role ${requestedRole} is not allowed with this department code`
        });
      }
      role = requestedRole;
    }

    // Ensure department is set from the department code object
    const department = departmentCodeObj.department || req.body.department || 'General';
    
    console.log('Creating user with department:', department);
    console.log('Role being assigned:', role);

    try {
      // Create user with isFirstLogin flag
      const user = await User.create({
        name,
        firstName: name.split(' ')[0],
        lastName: name.split(' ').slice(1).join(' '),
        email,
        password,
        department,
        role,
        position,
        companyName,
        startDate: startDate || new Date(),
        isFirstLogin: true,
        onboarding: {
          status: 'not_started',
          welcomeMessageSent: false
        }
      });

      // Return user with token
      res.status(201).json({
        success: true,
        user: {
          _id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          department: user.department,
          position: user.position,
          role: user.role,
          isFirstLogin: true
        },
        token: generateToken(user._id, user.role)
      });
    } catch (err) {
      console.error('Error creating user:', err);
      
      // Check if error is due to duplicate email
      if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
        console.log('Duplicate email error detected');
        return res.status(400).json({
          success: false,
          message: 'User with this email already exists'
        });
      }
      
      // Return general error
      return res.status(500).json({
        success: false,
        message: 'Error creating user',
        error: err.message
      });
    }
  } catch (error) {
    console.error('Server error in registerUser:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.loginUser = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password, role } = req.body;
    console.log('Login attempt:', { email, role });

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found with email:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    console.log('User found:', {
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department
    });

    // Check if password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log('Password does not match for user:', email);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Validate user role matches requested role
    if (role && user.role !== role) {
      console.log('Role mismatch:', { requestedRole: role, userRole: user.role });
      return res.status(403).json({
        success: false,
        message: `You don't have permission to login as ${role}. Your role is ${user.role}.`
      });
    }

    // Update last login
    const isFirstLogin = user.isFirstLogin;
    user.lastLogin = new Date();
    
    // Set first login flag to false if it was true
    if (user.isFirstLogin) {
      user.isFirstLogin = false;
      
      // Create welcome notification if not sent before
      if (!user.onboarding.welcomeMessageSent) {
        // Create welcome notification
        await Notification.create({
          title: 'Welcome to OnboardX!',
          message: 'We are delighted to have you onboard. Please complete your onboarding process to get started with your new role.',
          type: 'system',
          recipient: user._id,
          isRead: false
        });
        
        // Update welcome message status
        user.onboarding.welcomeMessageSent = true;
      }
    }
    
    await user.save();

    // Determine which dashboard to redirect to based on role
    let redirectUrl = 'emp_dashboard.html';
    if (user.role === 'hr_admin') {
      redirectUrl = 'admin.html';
    } else if (user.role === 'it_admin') {
      redirectUrl = 'it_dashboard.html';
    }

    console.log('Login successful:', {
      name: user.name,
      email: user.email,
      role: user.role,
      redirectUrl: redirectUrl
    });

    // Return user with token and firstLogin flag
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName || user.name.split(' ')[0],
        lastName: user.lastName || user.name.split(' ').slice(1).join(' '),
        email: user.email,
        department: user.department,
        position: user.position,
        role: user.role,
        isFirstLogin: isFirstLogin,
        onboardingStatus: user.onboarding.status,
        redirectUrl: redirectUrl
      },
      token: generateToken(user._id, user.role)
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    res.status(200).json({
      success: true,
      user: {
        _id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        department: user.department,
        position: user.position,
        role: user.role,
        onboardingStatus: user.onboarding.status,
        personalInfo: user.personalInfo,
        employmentDetails: user.employmentDetails,
        communications: user.communications
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Logout user
// @route   GET /api/auth/logout
// @access  Private
exports.logoutUser = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Send password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User with this email does not exist'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    const resetTokenExpire = Date.now() + 3600000; // 1 hour

    // Save reset token to user document
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpire = resetTokenExpire;
    await user.save();

    try {
      // Send reset email using our email utility
      const emailInfo = await sendPasswordResetEmail(
        user.email,
        resetToken,
        user.name
      );
      
      // In development mode, send the preview URL
      let responseData = {
        success: true,
        message: 'Password reset email sent'
      };
      
      if (process.env.NODE_ENV === 'development' && emailInfo && emailInfo.messageId) {
        responseData.previewUrl = nodemailer.getTestMessageUrl(emailInfo);
        responseData.note = 'In development mode. Use the preview URL to see the email.';
      }
      
      res.status(200).json(responseData);
    } catch (emailError) {
      console.error('Email sending error:', emailError);
      
      // Clear the reset token since email failed
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save();
      
      return res.status(500).json({
        success: false,
        message: 'Failed to send reset email. Please try again later.'
      });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    
    // If user exists, clear any reset tokens
    if (req.body && req.body.email) {
      const user = await User.findOne({ email: req.body.email });
      if (user) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;
        await user.save();
      }
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to send reset email. Please try again later.'
    });
  }
};

// @desc    Verify reset token
// @route   GET /api/auth/reset-password/:token
// @access  Public
exports.verifyResetToken = async (req, res) => {
  try {
    // Find user with valid token
    const resetPasswordToken = req.params.token;
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token is valid',
      email: user.email
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Reset password using token
// @route   POST /api/auth/reset-password/:token
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Find user with valid token
    const resetPasswordToken = req.params.token;
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Update password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Create notification for user
    await Notification.create({
      title: 'Password Reset Successful',
      message: 'Your password has been changed successfully. If you did not make this change, please contact support immediately.',
      type: 'system',
      recipient: user._id,
      isRead: false
    });

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
}; 