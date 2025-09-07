const { body, param, query, validationResult } = require('express-validator');

// Validation rules for project submission
const validateProjectSubmission = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 500 })
    .withMessage('Title must be between 5 and 500 characters'),
  
  body('abstract')
    .trim()
    .isLength({ min: 50, max: 2000 })
    .withMessage('Abstract must be between 50 and 2000 characters'),
  
  body('domain')
    .trim()
    .isLength({ min: 2, max: 255 })
    .withMessage('Domain is required and must be less than 255 characters'),
  
  body('year')
    .trim()
    .matches(/^\d{4}$/)
    .withMessage('Year must be a valid 4-digit year'),
  
  body('technologies')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Technologies list must be less than 1000 characters')
];

// Validation rules for project status update
const validateStatusUpdate = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer'),
  
  body('status')
    .isIn(['pending', 'approved', 'rejected'])
    .withMessage('Status must be: pending, approved, or rejected'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be less than 1000 characters')
];

// Validation rules for project queries
const validateProjectQuery = [
  query('domain')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Invalid domain parameter'),
  
  query('year')
    .optional()
    .trim()
    .matches(/^\d{4}$|^all$/)
    .withMessage('Year must be a valid 4-digit year or "all"'),
  
  query('status')
    .optional()
    .isIn(['pending', 'approved', 'rejected', 'all'])
    .withMessage('Status must be: pending, approved, rejected, or all'),
  
  query('search')
    .optional()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Search term must be less than 255 characters')
];

// Validation rules for project ID parameter
const validateProjectId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer')
];

// Validation rules for document download
const validateDocumentDownload = [
  param('projectId')
    .isInt({ min: 1 })
    .withMessage('Project ID must be a positive integer'),
  
  param('documentId')
    .isInt({ min: 1 })
    .withMessage('Document ID must be a positive integer')
];

// Middleware to handle validation results
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// Custom validation function for file uploads
const validateFileUpload = (req, res, next) => {
  // Check if files are present (optional validation)
  if (req.files && req.files.length > 5) {
    return res.status(400).json({
      success: false,
      message: 'Maximum 5 files allowed'
    });
  }

  // Check individual file sizes (handled by multer, but good to double-check)
  if (req.files) {
    const oversizedFiles = req.files.filter(file => file.size > 10 * 1024 * 1024); // 10MB
    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'One or more files exceed the 10MB limit'
      });
    }
  }

  next();
};

// Domain validation (you can customize this list based on your college's domains)
const allowedDomains = [
  'Web Development',
  'Mobile Development', 
  'Machine Learning',
  'Data Science',
  'Artificial Intelligence',
  'Computer Networks',
  'Database Management',
  'Software Engineering',
  'Cybersecurity',
  'Cloud Computing',
  'DevOps',
  'Game Development',
  'IoT',
  'Blockchain',
  'Computer Vision',
  'Natural Language Processing',
  'Embedded Systems',
  'Operating Systems'
];

const validateDomain = [
  body('domain')
    .custom(value => {
      if (!allowedDomains.includes(value)) {
        throw new Error(`Domain must be one of: ${allowedDomains.join(', ')}`);
      }
      return true;
    })
];

module.exports = {
  validateProjectSubmission,
  validateStatusUpdate,
  validateProjectQuery,
  validateProjectId,
  validateDocumentDownload,
  validateFileUpload,
  validateDomain,
  handleValidationErrors,
  allowedDomains
};