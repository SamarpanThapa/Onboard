const mongoose = require('mongoose');
const DepartmentCode = require('../models/DepartmentCode');
const User = require('../models/User');
require('dotenv').config();

/**
 * Initialize database with some sample data
 */
const initDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000 // Timeout after 5s instead of 30s
    });
    console.log('MongoDB connected...');

    // Check if any department codes exist
    const existingCodes = await DepartmentCode.countDocuments();
    
    if (existingCodes === 0) {
      console.log('No department codes found. Creating initial department codes...');
      
      // Create default department codes
      await DepartmentCode.create([
        {
          code: 'IT2024',
          department: 'IT',
          description: 'IT Department Code',
          isActive: true,
          allowedRoles: ['employee', 'it_admin']
        },
        {
          code: 'HR2024',
          department: 'HR',
          description: 'HR Department Code',
          isActive: true,
          allowedRoles: ['employee', 'hr_admin']
        },
        {
          code: 'MKT2024',
          department: 'Marketing',
          description: 'Marketing Department Code',
          isActive: true,
          allowedRoles: ['employee', 'department_admin']
        },
        {
          code: 'ENG2024',
          department: 'Engineering',
          description: 'Engineering Department Code',
          isActive: true,
          allowedRoles: ['employee', 'department_admin']
        },
        {
          code: 'FIN2024',
          department: 'Finance',
          description: 'Finance Department Code',
          isActive: true,
          allowedRoles: ['employee', 'department_admin']
        }
      ]);
      
      console.log('Department codes created successfully!');
    } else {
      console.log(`Found ${existingCodes} existing department codes. Skipping creation.`);
    }

    // Create admin user if no users exist
    const existingUsers = await User.countDocuments();
    
    if (existingUsers === 0) {
      console.log('No users found. Creating admin user...');
      
      // Create admin user
      await User.create({
        name: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        password: 'password123',
        department: 'IT',
        role: 'it_admin',
        position: 'IT Administrator',
        isFirstLogin: true,
        onboarding: {
          status: 'completed',
          welcomeMessageSent: true
        }
      });
      
      console.log('Admin user created successfully!');
      console.log('Email: admin@example.com');
      console.log('Password: password123');
    } else {
      console.log(`Found ${existingUsers} existing users. Skipping admin creation.`);
    }

    console.log('Database initialization completed!');
    process.exit(0);
  } catch (error) {
    console.error('Database initialization error:', error);
    process.exit(1);
  }
};

// Run the initialization
initDatabase(); 