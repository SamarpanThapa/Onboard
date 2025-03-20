require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function createTestEmployees() {
  try {
    // Clear any existing test employees
    await User.deleteMany({ email: /test.*@example\.com/ });
    console.log('Cleared existing test employees');

    // Hash password for test users
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('Test1234', salt);

    // Create test employees for each onboarding stage
    const testEmployees = [
      // To Start Stage
      {
        name: 'John Doe',
        firstName: 'John',
        lastName: 'Doe',
        email: 'test.tostart@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Engineering',
        position: 'Software Developer',
        status: 'active',
        onboarding: {
          status: 'not_started',
          updatedAt: new Date()
        },
        createdAt: new Date(),
        updatedAt: new Date()
      },
      
      // In Progress Stage
      {
        name: 'Jane Smith',
        firstName: 'Jane',
        lastName: 'Smith',
        email: 'test.inprogress@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Marketing',
        position: 'Marketing Specialist',
        status: 'active',
        phone: '555-123-4567',
        onboarding: {
          status: 'in_progress',
          completedSteps: [
            { step: 'personal_info', completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
            { step: 'emergency_contacts', completedAt: new Date() }
          ],
          updatedAt: new Date()
        },
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        updatedAt: new Date()
      },
      
      // Completed Stage
      {
        name: 'Robert Johnson',
        firstName: 'Robert',
        lastName: 'Johnson',
        email: 'test.completed@example.com',
        password: hashedPassword,
        role: 'employee',
        department: 'Finance',
        position: 'Financial Analyst',
        status: 'active',
        phone: '555-987-6543',
        address: '123 Main St',
        city: 'Boston',
        state: 'MA',
        zipCode: '02108',
        startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days in future
        employeeType: 'Full-time',
        manager: 'Sarah Williams',
        onboarding: {
          status: 'completed',
          completedSteps: [
            { step: 'personal_info', completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
            { step: 'emergency_contacts', completedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
            { step: 'tax_information', completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) },
            { step: 'direct_deposit', completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
            { step: 'company_policies', completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) }
          ],
          updatedAt: new Date()
        },
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date()
      }
    ];

    // Insert test employees
    await User.insertMany(testEmployees);
    console.log('Successfully added test employees for all onboarding stages');
    
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
    
  } catch (error) {
    console.error('Error creating test employees:', error);
    await mongoose.connection.close();
    process.exit(1);
  }
}

// Run the function
createTestEmployees(); 