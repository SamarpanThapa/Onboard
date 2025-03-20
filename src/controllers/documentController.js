const { validationResult } = require('express-validator');
const Document = require('../models/Document');
const User = require('../models/User');
const Notification = require('../models/Notification');
const fs = require('fs');
const path = require('path');

// @desc    Upload and create a new document
// @route   POST /api/documents
// @access  Private (different roles based on document type)
exports.createDocument = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }

    const { 
      title, 
      description, 
      documentType, 
      category, 
      relatedUser, 
      visibility, 
      tags, 
      expiryDate,
      requiresSignature,
      accessibleTo
    } = req.body;

    // Create document in database
    const document = await Document.create({
      title,
      description,
      documentType,
      category,
      file: {
        fileName: req.file.filename,
        filePath: req.file.path,
        fileType: path.extname(req.file.originalname).substring(1),
        fileSize: req.file.size,
        uploadedAt: new Date(),
        uploadedBy: req.user._id
      },
      relatedUser,
      visibility: visibility || 'private',
      tags: tags ? JSON.parse(tags) : [],
      expiryDate,
      requiresSignature: requiresSignature === 'true',
      accessibleTo: accessibleTo ? JSON.parse(accessibleTo) : [],
      createdBy: req.user._id,
      createdAt: new Date()
    });

    // If this document is related to a user, notify them
    if (relatedUser && relatedUser !== req.user._id.toString()) {
      await Notification.create({
        recipient: relatedUser,
        title: 'New Document Available',
        message: `A new document "${title}" has been uploaded for you.`,
        type: 'document',
        relatedObject: {
          objectType: 'document',
          objectId: document._id,
          link: `/documents/${document._id}`
        },
        sender: req.user._id,
        isSystemGenerated: false
      });
    }

    res.status(201).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get all documents (with filtering options)
// @route   GET /api/documents
// @access  Private
exports.getDocuments = async (req, res) => {
  try {
    // Build query with filters
    const query = {};

    // Filter by document type
    if (req.query.documentType) {
      query.documentType = req.query.documentType;
    }

    // Filter by isTemplate
    if (req.query.isTemplate !== undefined) {
      query.isTemplate = req.query.isTemplate === 'true';
    }

    // Filter by category
    if (req.query.category) {
      query.category = req.query.category;
    }

    // Filter by relatedUser
    if (req.query.relatedUser) {
      query.relatedUser = req.query.relatedUser;
    }

    // Filter by status
    if (req.query.status) {
      query.status = req.query.status;
    }

    // Filter by tags
    if (req.query.tags) {
      const tags = req.query.tags.split(',');
      query.tags = { $in: tags };
    }

    // Filter by search term in title or description
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex }
      ];
    }

    // Add visibility filter based on user role
    if (req.user.role !== 'hr_admin') {
      // Regular users can only see documents that:
      // 1. They created
      // 2. Are related to them
      // 3. Have appropriate visibility (department, company, or public)
      // 4. Or have explicit access
      query.$or = [
        { createdBy: req.user._id },
        { relatedUser: req.user._id },
        { visibility: 'public' },
        { visibility: 'company' },
        { 
          visibility: 'department', 
          'accessibleTo.department': req.user.department 
        },
        {
          'accessibleTo.role': req.user.role
        }
      ];
    }

    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Document.countDocuments(query);

    // Get documents with pagination
    const documents = await Document.find(query)
      .populate('relatedUser', 'name email department')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort(req.query.sort ? { [req.query.sort]: req.query.order === 'desc' ? -1 : 1 } : { createdAt: -1 })
      .skip(startIndex)
      .limit(limit);

    // Pagination results
    const pagination = {};
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }

    res.status(200).json({
      success: true,
      count: documents.length,
      pagination,
      total,
      data: documents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get a single document
// @route   GET /api/documents/:id
// @access  Private (with permissions check)
exports.getDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id)
      .populate('relatedUser', 'name email department')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .populate('signatures.user', 'name email');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check permissions
    const canAccess = checkDocumentAccess(document, req.user);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }

    // Record view history unless it's the document creator viewing it
    if (document.createdBy._id.toString() !== req.user._id.toString()) {
      document.viewHistory.push({
        user: req.user._id,
        viewedAt: new Date(),
        ipAddress: req.ip
      });

      await document.save();
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Update a document
// @route   PUT /api/documents/:id
// @access  Private (with permissions check)
exports.updateDocument = async (req, res) => {
  try {
    let document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to update
    if (document.createdBy.toString() !== req.user._id.toString() &&
        req.user.role !== 'hr_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this document'
      });
    }

    // Handle file update if a new file is uploaded
    if (req.file) {
      // Store old file path to delete after update
      const oldFilePath = document.file.filePath;
      
      // Update file information
      req.body.file = {
        fileName: req.file.filename,
        filePath: req.file.path,
        fileType: path.extname(req.file.originalname).substring(1),
        fileSize: req.file.size,
        uploadedAt: new Date(),
        uploadedBy: req.user._id
      };

      // Add previous version
      if (!document.previousVersions) {
        document.previousVersions = [];
      }
      
      document.previousVersions.push({
        version: document.version,
        filePath: oldFilePath,
        updatedAt: new Date(),
        updatedBy: req.user._id
      });

      // Increment version
      if (document.version) {
        const versionParts = document.version.split('.');
        const minor = parseInt(versionParts[1] || 0) + 1;
        document.version = `${versionParts[0]}.${minor}`;
      } else {
        document.version = '1.1';
      }
    }

    // Handle tags if they're sent as a string
    if (req.body.tags && typeof req.body.tags === 'string') {
      req.body.tags = JSON.parse(req.body.tags);
    }

    // Handle accessibleTo if it's sent as a string
    if (req.body.accessibleTo && typeof req.body.accessibleTo === 'string') {
      req.body.accessibleTo = JSON.parse(req.body.accessibleTo);
    }

    // Add update tracking
    req.body.updatedBy = req.user._id;
    req.body.updatedAt = new Date();

    // Update document
    document = await Document.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('relatedUser', 'name email department')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    // If an old file exists and was replaced, delete it
    if (req.file && document.previousVersions && document.previousVersions.length > 0) {
      const lastVersion = document.previousVersions[document.previousVersions.length - 1];
      // Don't delete the file here to keep version history, but you could if needed
    }

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error(error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Delete a document
// @route   DELETE /api/documents/:id
// @access  Private (with permissions check)
exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has permission to delete
    // Allow admin, hr_admin, and document creator to delete
    const isAuthorized = 
      req.user.role === 'admin' || 
      req.user.role === 'hr_admin' || 
      (document.createdBy && document.createdBy.toString() === req.user.id);
    
    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this document'
      });
    }

    // Delete the file from storage
    if (document.file && document.file.filePath) {
      try {
        // Ensure we have the full path
        const fullPath = path.join(__dirname, '../../', document.file.filePath);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
          console.log(`Deleted file: ${fullPath}`);
        }
      } catch (fileError) {
        console.error('Error deleting file:', fileError);
        // Continue with document deletion even if file deletion fails
      }
    }

    // Delete previous versions as well
    if (document.previousVersions && document.previousVersions.length > 0) {
      document.previousVersions.forEach(version => {
        if (version.filePath) {
          try {
            const versionPath = path.join(__dirname, '../../', version.filePath);
            if (fs.existsSync(versionPath)) {
              fs.unlinkSync(versionPath);
              console.log(`Deleted version file: ${versionPath}`);
            }
          } catch (versionError) {
            console.error('Error deleting version file:', versionError);
            // Continue with document deletion even if version deletion fails
          }
        }
      });
    }

    // Delete document from database
    await Document.findByIdAndDelete(document._id);

    res.status(200).json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Error in deleteDocument:', error);
    if (error.kind === 'ObjectId') {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server Error: ' + error.message
    });
  }
};

// @desc    Sign a document
// @route   POST /api/documents/:id/sign
// @access  Private (for users required to sign)
exports.signDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user is related to this document or has permission
    const isRelatedUser = document.relatedUser && document.relatedUser.toString() === req.user._id.toString();
    const isRequiredSigner = document.signatures.some(sig => 
      sig.user.toString() === req.user._id.toString() && sig.status === 'pending'
    );

    if (!isRelatedUser && !isRequiredSigner && req.user.role !== 'hr_admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to sign this document'
      });
    }

    // Get signature info from request
    const { signatureType, status } = req.body;

    // Find the user's signature entry or create one
    let signatureIndex = document.signatures.findIndex(sig => 
      sig.user.toString() === req.user._id.toString()
    );

    if (signatureIndex === -1) {
      // Create a new signature if user doesn't have one
      document.signatures.push({
        user: req.user._id,
        dateSigned: new Date(),
        signatureType: signatureType || 'electronic',
        ipAddress: req.ip,
        status: status || 'signed'
      });
    } else {
      // Update existing signature
      document.signatures[signatureIndex].dateSigned = new Date();
      document.signatures[signatureIndex].signatureType = signatureType || document.signatures[signatureIndex].signatureType;
      document.signatures[signatureIndex].ipAddress = req.ip;
      document.signatures[signatureIndex].status = status || 'signed';
    }

    document.updatedBy = req.user._id;
    document.updatedAt = new Date();

    await document.save();

    // Notify the document creator
    await Notification.create({
      recipient: document.createdBy,
      title: 'Document Signed',
      message: `Document "${document.title}" has been ${status === 'declined' ? 'declined' : 'signed'} by ${req.user.name}.`,
      type: 'document',
      priority: 'medium',
      relatedObject: {
        objectType: 'document',
        objectId: document._id,
        link: `/documents/${document._id}`
      },
      sender: req.user._id,
      isSystemGenerated: false
    });

    res.status(200).json({
      success: true,
      data: document
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Get documents pending signature for current user
// @route   GET /api/documents/pending-signatures
// @access  Private
exports.getPendingSignatures = async (req, res) => {
  try {
    const documents = await Document.find({
      'signatures.user': req.user._id,
      'signatures.status': 'pending',
      requiresSignature: true
    }).populate('createdBy', 'name email');

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Add a note to a document
// @route   POST /api/documents/:id/notes
// @access  Private (with permissions check)
exports.addDocumentNote = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }

    // Check if user has access to the document
    const canAccess = checkDocumentAccess(document, req.user);
    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this document'
      });
    }

    const { text } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Note text is required'
      });
    }

    document.notes.push({
      user: req.user._id,
      text,
      createdAt: new Date()
    });

    document.updatedBy = req.user._id;
    document.updatedAt = new Date();

    await document.save();

    // Get the newly added note with populated user
    const newNote = document.notes[document.notes.length - 1];
    await Document.populate(newNote, { path: 'user', select: 'name email' });

    res.status(201).json({
      success: true,
      data: newNote
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// @desc    Duplicate a document (primarily for templates)
// @route   POST /api/documents/:id/duplicate
// @access  Private
exports.duplicateDocument = async (req, res) => {
  try {
    // Find the original document
    const originalDocument = await Document.findById(req.params.id);
    
    if (!originalDocument) {
      return res.status(404).json({
        success: false,
        message: 'Document not found'
      });
    }
    
    // Check permissions - simple check: you can duplicate if you can view
    // More complex permission systems would go here
    
    // Extract file information
    const originalFilePath = originalDocument.file.filePath;
    const fileExt = path.extname(originalFilePath);
    const newFileName = `${path.basename(originalFilePath, fileExt)}-copy-${Date.now()}${fileExt}`;
    const uploadDir = path.join(__dirname, '../../uploads/documents');
    const newFilePath = path.join(uploadDir, newFileName);
    
    // Create uploads directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    // Copy the file
    fs.copyFileSync(originalFilePath, newFilePath);
    
    // Create new document with copied data
    const newDocument = new Document({
      title: req.body.title || `${originalDocument.title} (Copy)`,
      description: req.body.description || originalDocument.description,
      documentType: req.body.documentType || originalDocument.documentType,
      category: req.body.category || originalDocument.category,
      file: {
        fileName: newFileName,
        filePath: newFilePath,
        fileType: originalDocument.file.fileType,
        fileSize: originalDocument.file.fileSize,
        uploadedAt: new Date(),
        uploadedBy: req.user._id
      },
      visibility: req.body.visibility || originalDocument.visibility,
      tags: req.body.tags || originalDocument.tags,
      isTemplate: req.body.isTemplate !== undefined ? req.body.isTemplate : originalDocument.isTemplate,
      createdBy: req.user._id,
      createdAt: new Date()
    });
    
    await newDocument.save();
    
    res.status(201).json({
      success: true,
      message: 'Document duplicated successfully',
      data: newDocument
    });
    
  } catch (error) {
    console.error('Error duplicating document:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error'
    });
  }
};

// Helper function to check document access permissions
const checkDocumentAccess = (document, user) => {
  // Admin always has access
  if (user.role === 'hr_admin') {
    return true;
  }

  // Creator always has access
  if (document.createdBy.toString() === user._id.toString()) {
    return true;
  }

  // RelatedUser has access
  if (document.relatedUser && document.relatedUser.toString() === user._id.toString()) {
    return true;
  }

  // Check visibility settings
  switch (document.visibility) {
    case 'public':
      return true;
    case 'company':
      return true;
    case 'department':
      return document.accessibleTo.some(access => 
        access.department === user.department
      );
    case 'private':
      return document.accessibleTo.some(access => 
        access.role === user.role || (access.department === user.department)
      );
    default:
      return false;
  }
};

module.exports = exports; 