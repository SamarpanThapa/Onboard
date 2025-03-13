const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Testing MongoDB connection...');
console.log('Connection string (partially masked):', 
  process.env.MONGO_URI.replace(/:([^:@]+)@/, ':********@'));

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000
})
.then(() => {
  console.log('✅ MongoDB connection successful!');
  console.log('Connected to:', mongoose.connection.host);
  console.log('Database name:', mongoose.connection.name);
  process.exit(0);
})
.catch(err => {
  console.error('❌ MongoDB connection failed!');
  console.error('Error:', err.message);
  
  // Provide troubleshooting tips based on error message
  if (err.message.includes('ENOTFOUND')) {
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if your cluster name is correct in the connection string');
    console.log('2. Make sure you have internet connectivity');
  } else if (err.message.includes('Authentication failed')) {
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if your username and password are correct');
    console.log('2. Make sure the user has appropriate permissions');
    console.log('3. If your password contains special characters, ensure they are properly URL-encoded');
  } else if (err.message.includes('timed out')) {
    console.log('\nTroubleshooting tips:');
    console.log('1. Check if your IP address is whitelisted in MongoDB Atlas');
    console.log('2. Go to MongoDB Atlas dashboard → Network Access → Add IP Address');
    console.log('3. You can add your current IP or use "Allow Access from Anywhere" (0.0.0.0/0) for development');
  }
  
  process.exit(1);
}); 