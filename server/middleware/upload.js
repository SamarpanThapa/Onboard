const path = require('path');
const multer = require('multer');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Set storage engine
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Create subdirectories based on file type
    let uploadPath = uploadsDir;
    
    if (file.mimetype.startsWith('image/')) {
      uploadPath = path.join(uploadsDir, 'images');
    } else if (file.mimetype === 'application/pdf') {
      uploadPath = path.join(uploadsDir, 'documents/pdf');
    } else if (file.mimetype.includes('spreadsheet') || file.mimetype.includes('excel')) {
      uploadPath = path.join(uploadsDir, 'documents/spreadsheets');
    } else if (file.mimetype.includes('word')) {
      uploadPath = path.join(uploadsDir, 'documents/word');
    } else {
      uploadPath = path.join(uploadsDir, 'other');
    }
    
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Create unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Check file type
const fileFilter = (req, file, cb) => {
  // Allowed extensions
  const filetypes = /jpeg|jpg|png|gif|pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv/;
  // Check extension
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime type
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Error: File type not supported!'));
  }
};

// Initialize upload
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: fileFilter
});

module.exports = upload; 