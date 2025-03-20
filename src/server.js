const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve static files
app.use(express.static('public'));
app.use(express.static('views'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads'), {
  maxAge: '1d',
  setHeaders: (res, path) => {
    // Set appropriate content headers based on file type
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Type', 'application/pdf');
    } else if (path.endsWith('.jpg') || path.endsWith('.jpeg')) {
      res.setHeader('Content-Type', 'image/jpeg');
    } else if (path.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
  }
}));

// Connect to MongoDB unless explicitly disabled
if (!process.env.NO_DB) {
  mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
  })
    .then(() => console.log('MongoDB Connected'))
    .catch(err => {
      console.error('MongoDB Connection Error:', err);
      process.exit(1);
    });
}

// API Routes
try {
  // Authentication and user management
  app.use('/api/auth', require('./routes/authRoutes'));
  app.use('/api/users', require('./routes/userRoutes'));
  
  // Department codes and department management
  app.use('/api/department-codes', require('./routes/departmentCodeRoutes'));
  app.use('/api/departments', require('./routes/departmentRoutes'));
  app.use('/api/employees', require('./routes/employeeRoutes'));
  
  // Onboarding and tasks
  app.use('/api/onboarding-processes', require('./routes/onboardingProcessRoutes'));
  // Also register the external API route
  app.use('/api/onboarding-processes', require('../routes/api/onboarding-processes'));
  app.use('/api/tasks', require('./routes/taskRoutes'));
  
  // Document management
  app.use('/api/documents', require('./routes/documentRoutes'));
  app.use('/api/templates', require('./routes/templateRoutes'));
  
  // Training and orientation
  app.use('/api/trainings', require('./routes/trainingRoutes'));
  
  // Notifications and messaging
  app.use('/api/notifications', require('./routes/notificationRoutes'));
  app.use('/api/messages', require('./routes/messageRoutes'));
  
  // Support and feedback
  app.use('/api/support-tickets', require('./routes/supportTicketRoutes'));
  app.use('/api/feedback', require('./routes/feedbackRoutes'));
  
  // IT asset and access management
  app.use('/api/assets', require('./routes/assetRoutes'));
  app.use('/api/access-requests', require('./routes/accessRequestRoutes'));
} catch (error) {
  console.error('Error loading routes:', error);
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err);
  res.status(500).json({
    message: 'Server Error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../views/index.html'));
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  if (process.env.NO_DB) {
    console.log('Warning: Running in NO_DB mode. Database features are disabled.');
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  // Don't crash the server in production
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}); 