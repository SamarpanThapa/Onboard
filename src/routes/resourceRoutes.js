const express = require('express');
const { check } = require('express-validator');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const {
  createResource,
  getResources,
  getResource,
  updateResource,
  deleteResource
} = require('../controllers/resourceController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/resources');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|zip|rar/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb('Error: Only specified file formats are allowed!');
    }
  }
});

// All routes are protected
router.use(protect);

// @route   POST /api/resources
// @desc    Create a resource
// @access  Private (IT Admins and Department Admins)
router.post(
  '/',
  upload.single('file'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty()
  ],
  authorize('it_admin', 'department_admin'),
  createResource
);

// @route   GET /api/resources
// @desc    Get all resources (filtered by role and department)
// @access  Private
router.get('/', getResources);

// @route   GET /api/resources/:id
// @desc    Get a single resource
// @access  Private
router.get('/:id', getResource);

// @route   PUT /api/resources/:id
// @desc    Update a resource
// @access  Private (Resource owner or IT Admin)
router.put(
  '/:id',
  upload.single('file'),
  [
    check('title', 'Title is required').not().isEmpty(),
    check('department', 'Department is required').not().isEmpty()
  ],
  updateResource
);

// @route   DELETE /api/resources/:id
// @desc    Delete a resource
// @access  Private (Resource owner or IT Admin)
router.delete('/:id', deleteResource);

module.exports = router; 