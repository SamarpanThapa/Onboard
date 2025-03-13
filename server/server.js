const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/error');

// Load env vars
dotenv.config();

// Connect to database
connectDB().catch(err => {
  console.error('MongoDB connection error:', err.message);
  console.log('Please check your MongoDB connection string and make sure MongoDB Atlas is accessible.');
  console.log('You can continue development without database connection, but database features will not work.');
});

// Route files
const auth = require('./routes/auth');
const tasks = require('./routes/tasks');
const resources = require('./routes/resources');
const feedback = require('./routes/feedback');
const compliance = require('./routes/compliance');
const departmentCodes = require('./routes/departmentCodes');
const onboardingTemplates = require('./routes/onboardingTemplateRoutes');

const app = express();

// Body parser
app.use(express.json());

// Enable CORS
app.use(cors());

// Set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Mount routers
app.use('/api/auth', auth);
app.use('/api/tasks', tasks);
app.use('/api/resources', resources);
app.use('/api/feedback', feedback);
app.use('/api/compliance', compliance);
app.use('/api/department-codes', departmentCodes);
app.use('/api/onboarding-templates', onboardingTemplates);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client', 'build', 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send('API is running...');
  });
}

// Error handler middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5001;

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`);
  // Don't exit the process, just log the error
  console.log('Unhandled Rejection. Server will continue to run.');
}); 