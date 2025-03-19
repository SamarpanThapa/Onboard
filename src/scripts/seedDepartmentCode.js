const mongoose = require('mongoose');
const dotenv = require('dotenv');
const DepartmentCode = require('../models/DepartmentCode');

// Load environment variables
dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  });

// Function to seed department codes
async function seedDepartmentCodes() {
  try {
    // Clear existing codes
    await DepartmentCode.deleteMany({});
    
    console.log('Creating department codes...');
    
    // Create IT department code
    const itCode = await DepartmentCode.create({
      code: 'IT2024',
      department: 'IT',
      description: 'IT Department Code',
      isActive: true,
      allowedRoles: ['employee', 'it_admin']
    });
    
    console.log('Created IT department code:', itCode);
    
    // Create HR department code
    const hrCode = await DepartmentCode.create({
      code: 'HR2024',
      department: 'HR',
      description: 'HR Department Code',
      isActive: true,
      allowedRoles: ['employee', 'hr_admin']
    });
    
    console.log('Created HR department code:', hrCode);
    
    // Create Marketing department code
    const marketingCode = await DepartmentCode.create({
      code: 'MKT2024',
      department: 'Marketing',
      description: 'Marketing Department Code',
      isActive: true,
      allowedRoles: ['employee', 'department_admin']
    });
    
    console.log('Created Marketing department code:', marketingCode);
    
    console.log('Department codes seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding department codes:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedDepartmentCodes(); 