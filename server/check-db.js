const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define the User schema
const UserSchema = new mongoose.Schema({
  fullName: String,
  email: String,
  role: String,
  department: String,
  companyName: String
});

// Define the DepartmentCode schema
const DepartmentCodeSchema = new mongoose.Schema({
  code: String,
  isActive: Boolean,
  expiresAt: Date,
  createdAt: Date
});

// Create the models
const User = mongoose.model('User', UserSchema);
const DepartmentCode = mongoose.model('DepartmentCode', DepartmentCodeSchema);

// Connect to MongoDB
console.log('Connecting to MongoDB...');
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(async () => {
  console.log('Connected to MongoDB');
  
  try {
    // Find all users
    const users = await User.find();
    console.log('\nUsers in database:', users.length);
    users.forEach(user => {
      console.log({
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        department: user.department,
        companyName: user.companyName
      });
    });

    // Find all department codes
    const codes = await DepartmentCode.find();
    console.log('\nDepartment codes in database:', codes.length);
    codes.forEach(code => {
      console.log({
        code: code.code,
        isActive: code.isActive,
        expiresAt: code.expiresAt,
        createdAt: code.createdAt
      });
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error querying database:', error.message);
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
}); 