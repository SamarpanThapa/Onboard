const mongoose = require('mongoose');
require('dotenv').config();

console.log('Testing MongoDB connection...');
// Hide password in logs for security
const connectionString = process.env.MONGO_URI;
const maskedConnectionString = connectionString.replace(/:([^:@]+)@/, ':********@');
console.log('Connection string:', maskedConnectionString);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB Connected Successfully!');
    // List all collections in the database
    return mongoose.connection.db.listCollections().toArray();
  })
  .then(collections => {
    console.log('Available collections:');
    collections.forEach(collection => {
      console.log('- ' + collection.name);
    });
    process.exit(0);
  })
  .catch(err => {
    console.error('MongoDB Connection Error:', err);
    process.exit(1);
  }); 