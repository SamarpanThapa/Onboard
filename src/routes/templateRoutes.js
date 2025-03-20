const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multer = require('multer');
const path = require('path');

const {
  createTemplate,
  getTemplates,
  getTemplate,
  updateTemplate,
  deleteTemplate
} = require('../controllers/templateController');

// Import the correct authentication middleware
const { protect, authorize } = require('../middleware/authMiddleware');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/templates');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Accept common document formats
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF and Word documents are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Validation middleware
const validateTemplate = [
  check('title')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Title is required')
    .isLength({ max: 100 })
    .withMessage('Title cannot be more than 100 characters'),
  check('description')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Description is required')
    .isLength({ max: 500 })
    .withMessage('Description cannot be more than 500 characters'),
  check('documentType')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Document type is required'),
  check('category')
    .trim()
    .not()
    .isEmpty()
    .withMessage('Category is required')
];

// Routes
router.route('/')
  .post(
    protect,
    authorize(['hr', 'admin', 'hr_admin']),
    upload.single('file'),
    validateTemplate,
    createTemplate
  )
  .get(protect, getTemplates);

router.route('/:id')
  .get(protect, getTemplate)
  .put(
    protect,
    authorize(['hr', 'admin', 'hr_admin']),
    upload.single('file'),
    validateTemplate,
    updateTemplate
  )
  .delete(protect, authorize(['hr', 'admin', 'hr_admin']), deleteTemplate);

module.exports = router; 