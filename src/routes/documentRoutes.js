const express = require('express');
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { 
  createDocument,
  getDocuments,
  getDocument,
  updateDocument,
  deleteDocument,
  signDocument,
  getPendingSignatures,
  addDocumentNote,
  duplicateDocument
} = require('../controllers/documentController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Set up file filter
const fileFilter = (req, file, cb) => {
  // Accept common document types
  const allowedFileTypes = ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.png', '.jpg', '.jpeg'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedFileTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('File type not supported. Allowed types: ' + allowedFileTypes.join(', ')), false);
  }
};

// Initialize multer upload
const upload = multer({ 
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB file size limit
});

// @route   POST /api/documents
// @desc    Upload and create a new document
// @access  Private
router.post(
  '/',
  protect,
  upload.single('file'),
  [
    check('title', 'Document title is required').not().isEmpty(),
    check('documentType', 'Document type is required').not().isEmpty(),
    check('category', 'Category is required').not().isEmpty()
  ],
  createDocument
);

// @route   GET /api/documents
// @desc    Get all documents (with filtering)
// @access  Private
router.get('/', protect, getDocuments);

// @route   GET /api/documents/pending-signatures
// @desc    Get documents pending signature for current user
// @access  Private
router.get('/pending-signatures', protect, getPendingSignatures);

// @route   GET /api/documents/:id
// @desc    Get a single document
// @access  Private (with permissions check)
router.get('/:id', protect, getDocument);

// @route   PUT /api/documents/:id
// @desc    Update a document
// @access  Private (with permissions check)
router.put(
  '/:id',
  protect,
  upload.single('file'), // Optional file upload for update
  updateDocument
);

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private (with permissions check)
router.delete('/:id', protect, deleteDocument);

// @route   POST /api/documents/:id/sign
// @desc    Sign a document
// @access  Private (for users required to sign)
router.post(
  '/:id/sign',
  protect,
  [
    check('status', 'Status is required').not().isEmpty(),
    check('status', 'Status must be "signed" or "declined"').isIn(['signed', 'declined'])
  ],
  signDocument
);

// @route   POST /api/documents/:id/notes
// @desc    Add a note to a document
// @access  Private (with permissions check)
router.post(
  '/:id/notes',
  protect,
  [
    check('text', 'Note text is required').not().isEmpty()
  ],
  addDocumentNote
);

// @route   POST /api/documents/:id/duplicate
// @desc    Duplicate a document (primarily for templates)
// @access  Private
router.post(
  '/:id/duplicate',
  protect,
  duplicateDocument
);

// @route   GET /api/documents/:id/download
// @desc    Download a document file
// @access  Private
router.get(
  '/:id/download',
  protect,
  async (req, res) => {
    try {
      const documentId = req.params.id;
      
      // Find the document
      const Document = require('../models/Document');
      const document = await Document.findById(documentId);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }
      
      // Check if user has access to document
      // This can be enhanced with more specific permission checks
      const canAccess = (
        // Document owner or uploaded by
        document.createdBy.equals(req.user.id) || 
        (document.file && document.file.uploadedBy && document.file.uploadedBy.equals(req.user.id)) ||
        // Related to user
        (document.relatedUser && document.relatedUser.equals(req.user.id)) ||
        // Admin/HR has access to all documents
        ['admin', 'hr_admin'].includes(req.user.role)
      );
      
      if (!canAccess) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to access this document'
        });
      }
      
      // Check if file exists
      if (!document.file || !document.file.filePath) {
        return res.status(404).json({
          success: false,
          message: 'Document file not found'
        });
      }
      
      // Get the file path
      const filePath = path.join(__dirname, '../../', document.file.filePath);
      
      // Check if file exists in filesystem
      if (!fs.existsSync(filePath)) {
        // For demo purposes, send a placeholder document if real file doesn't exist
        const placeholderPath = path.join(__dirname, '../../public/placeholder.pdf');
        if (fs.existsSync(placeholderPath)) {
          return res.download(placeholderPath, document.file.fileName || 'document.pdf');
        } else {
          return res.status(404).json({
            success: false,
            message: 'Document file not found on server'
          });
        }
      }
      
      // Log file access
      console.log(`User ${req.user.name} (${req.user.id}) downloading document: ${document.title} (${document._id})`);
      
      // Track document view
      document.viewHistory.push({
        user: req.user.id,
        viewedAt: new Date(),
        ipAddress: req.ip
      });
      
      await document.save();
      
      // Send the file
      res.download(filePath, document.file.fileName);
    } catch (error) {
      console.error('Error downloading document:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while downloading document'
      });
    }
  }
);

// Error handler for multer file uploads
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds the 10MB limit'
      });
    }
    return res.status(400).json({
      success: false,
      message: err.message
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
  next();
});

module.exports = router; 