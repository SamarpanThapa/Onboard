const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Function to fix user roles
async function fixUserRoles() {
  try {
    // Find and update the specific user by email to have the it_admin role
    const result = await User.findOneAndUpdate(
      { email: 'samarpanthapa@gmail.com' },
      { 
        role: 'it_admin',
        department: 'IT',
        position: 'IT Administrator'
      },
      { new: true }
    );
    
    if (result) {
      console.log('User role updated successfully:');
      console.log(`Name: ${result.name}`);
      console.log(`Email: ${result.email}`);
      console.log(`New Role: ${result.role}`);
      console.log(`Department: ${result.department}`);
      console.log(`Position: ${result.position}`);
    } else {
      console.log('User not found with email: samarpanthapa@gmail.com');
    }
    
    // Show all users after update
    const users = await User.find({}).select('name email role department position');
    
    console.log('\n===== ALL USERS IN DATABASE AFTER UPDATE =====');
    console.log(`Total users: ${users.length}`);
    
    users.forEach((user, index) => {
      console.log(`\nUser ${index + 1}:`);
      console.log(`Name: ${user.name || 'undefined'}`);
      console.log(`Email: ${user.email}`);
      console.log(`Role: ${user.role}`);
      console.log(`Department: ${user.department}`);
      console.log(`Position: ${user.position || 'undefined'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing user roles:', error);
    process.exit(1);
  }
}

// Run the function
fixUserRoles(); 