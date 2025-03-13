const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define the DepartmentCode schema
const DepartmentCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Create the model
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
    // Create a new department code
    const departmentCode = new DepartmentCode({
      code: 'IT2024',
      isActive: true,
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year from now
      createdAt: new Date()
    });
    
    // Save the department code
    await departmentCode.save();
    
    console.log('Department code created successfully:');
    console.log({
      code: departmentCode.code,
      isActive: departmentCode.isActive,
      expiresAt: departmentCode.expiresAt
    });
    
    // Check if the code exists
    const codes = await DepartmentCode.find();
    console.log(`Total department codes in database: ${codes.length}`);
    
    // Exit the process
    process.exit(0);
  } catch (error) {
    if (error.code === 11000) {
      console.log('Department code already exists. Here are the existing codes:');
      const codes = await DepartmentCode.find();
      codes.forEach(code => {
        console.log({
          code: code.code,
          isActive: code.isActive,
          expiresAt: code.expiresAt
        });
      });
    } else {
      console.error('Error creating department code:', error.message);
    }
    process.exit(1);
  }
})
.catch(err => {
  console.error('MongoDB connection error:', err.message);
  process.exit(1);
}); 