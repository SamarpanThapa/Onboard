/**
 * Script to add mock documents to existing onboarding processes
 * Run with: node scripts/addMockDocuments.js
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const OnboardingProcess = require('../src/models/OnboardingProcess');
const Document = require('../src/models/Document');
const User = require('../src/models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB Connected...');
  addMockDocuments();
}).catch(err => {
  console.error('Connection error:', err);
  process.exit(1);
});

// Mock document templates
const mockDocuments = [
  {
    title: 'Employee ID',
    description: 'Government issued ID document',
    documentType: 'identification',
    category: 'onboarding',
    file: {
      fileName: 'employee_id.pdf',
      filePath: '/uploads/documents/employee_id.pdf',
      fileType: 'pdf',
      fileSize: 256000,
      uploadedAt: new Date()
    },
    status: 'approved'
  },
  {
    title: 'Employment Contract',
    description: 'Signed employment contract',
    documentType: 'contract',
    category: 'onboarding',
    file: {
      fileName: 'employment_contract.pdf',
      filePath: '/uploads/documents/employment_contract.pdf',
      fileType: 'pdf',
      fileSize: 512000,
      uploadedAt: new Date()
    },
    status: 'approved'
  },
  {
    title: 'Direct Deposit Form',
    description: 'Banking details for salary payments',
    documentType: 'form',
    category: 'payroll',
    file: {
      fileName: 'direct_deposit.pdf',
      filePath: '/uploads/documents/direct_deposit.pdf',
      fileType: 'pdf',
      fileSize: 128000,
      uploadedAt: new Date()
    },
    status: 'approved'
  },
  {
    title: 'Profile Picture',
    description: 'Employee profile photo',
    documentType: 'image',
    category: 'onboarding',
    file: {
      fileName: 'profile_picture.jpg',
      filePath: '/uploads/documents/profile_picture.jpg',
      fileType: 'jpg',
      fileSize: 80000,
      uploadedAt: new Date()
    },
    status: 'approved'
  },
  {
    title: 'Tax Form',
    description: 'Tax withholding information',
    documentType: 'form',
    category: 'finance',
    file: {
      fileName: 'tax_form.pdf',
      filePath: '/uploads/documents/tax_form.pdf',
      fileType: 'pdf',
      fileSize: 192000,
      uploadedAt: new Date()
    },
    status: 'approved'
  }
];

// Add mock documents to onboarding processes
async function addMockDocuments() {
  try {
    // Find all completed onboarding processes
    const processes = await OnboardingProcess.find();
    
    if (processes.length === 0) {
      console.log('No onboarding processes found in the database');
      process.exit(0);
    }
    
    console.log(`Found ${processes.length} onboarding processes`);
    
    // For each process, add documents
    for (const process of processes) {
      console.log(`Adding documents to process for: ${process._id}`);
      
      const user = await User.findById(process.employee);
      if (!user) {
        console.log(`User not found for process ${process._id}, skipping`);
        continue;
      }
      
      // Create and link documents for this user/process
      const documentPromises = mockDocuments.map(async (docTemplate) => {
        // Create document
        const document = new Document({
          ...docTemplate,
          relatedUser: user._id,
          createdBy: user._id,
          file: {
            ...docTemplate.file,
            uploadedBy: user._id
          }
        });
        
        // Save document
        await document.save();
        
        // Add to onboarding process documents array
        process.documents.push({
          documentId: document._id,
          title: document.title,
          status: 'approved',
          required: true,
          completedDate: new Date()
        });
        
        return document;
      });
      
      // Wait for all documents to be created
      await Promise.all(documentPromises);
      
      // Save the updated process
      await process.save();
      
      console.log(`Added ${mockDocuments.length} documents to process ${process._id}`);
    }
    
    console.log('Successfully added mock documents to all onboarding processes');
    process.exit(0);
  } catch (error) {
    console.error('Error adding mock documents:', error);
    process.exit(1);
  }
} 