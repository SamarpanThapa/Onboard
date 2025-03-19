const nodemailer = require('nodemailer');

/**
 * Create a nodemailer transporter object based on environment
 * @returns {object} - Nodemailer transporter object
 */
const createTransporter = async () => {
  // For development, create a test account for each session
  if (process.env.NODE_ENV === 'development') {
    console.log('Creating new Ethereal test account...');
    // Create a test account with Ethereal
    const testAccount = await nodemailer.createTestAccount();
    console.log('Ethereal test account created:', testAccount.user);
    
    // Create a transporter using the test account
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  } else {
    // For production, use environment variables
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT),
      secure: process.env.EMAIL_PORT === '465',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }
};

/**
 * Send an email using nodemailer
 * @param {object} options - Email options object
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject
 * @param {string} options.html - Email HTML content
 * @param {string} options.text - Email plain text content (optional)
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendEmail = async (options) => {
  const transporter = await createTransporter();
  
  const message = {
    from: process.env.EMAIL_FROM || 'onboardx@example.com',
    to: options.to,
    subject: options.subject,
    html: options.html,
    text: options.text || 'Please view this email in a modern email client that supports HTML email.'
  };
  
  // Send the email and get the response info
  const info = await transporter.sendMail(message);
  
  // For development environment, log the preview URL
  if (process.env.NODE_ENV === 'development') {
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  }
  
  return info;
};

/**
 * Send a password reset email to a user
 * @param {string} email - User's email address
 * @param {string} resetToken - Password reset token
 * @param {string} name - User's name
 * @returns {Promise} - Promise that resolves when email is sent
 */
const sendPasswordResetEmail = async (email, resetToken, name) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset_password.html?token=${resetToken}`;
  
  const emailInfo = await sendEmail({
    to: email,
    subject: 'Password Reset Link',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1db954;">OnboardX</h1>
          <p style="color: #666;">Employee Onboarding System</p>
        </div>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin-bottom: 20px;">
          <h2 style="color: #333; margin-top: 0;">Reset Your Password</h2>
          <p>Hello ${name || 'there'},</p>
          <p>You recently requested to reset your password. Click the button below to reset it:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background-color: #1db954; color: white; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
          </div>
          
          <p>This link will expire in 1 hour for security reasons.</p>
          <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
        </div>
        
        <div style="font-size: 12px; color: #999; text-align: center;">
          <p>This is an automated email, please do not reply.</p>
          <p>© ${new Date().getFullYear()} OnboardX. All rights reserved.</p>
        </div>
      </div>
    `
  });
  
  return emailInfo;
};

module.exports = {
  sendEmail,
  sendPasswordResetEmail
}; 