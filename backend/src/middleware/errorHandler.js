// Global error handling middleware
const errorHandler = (err, req, res, next) => {
  console.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    message: 'Something went wrong on the server',
    status: 500
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error.message = 'Invalid input data';
    error.status = 400;
    error.details = err.message;
  } else if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry found';
    error.status = 409;
  } else if (err.code === 'ER_NO_REFERENCED_ROW') {
    error.message = 'Referenced record not found';
    error.status = 404;
  } else if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  } else if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  } else if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      error.message = 'File too large. Maximum size is 10MB';
    } else if (err.code === 'LIMIT_FILE_COUNT') {
      error.message = 'Too many files. Maximum 5 files allowed';
    } else {
      error.message = 'File upload error';
    }
    error.status = 400;
  }

  // Send error response
  res.status(error.status).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { 
      details: err.message,
      stack: err.stack 
    })
  });
};

module.exports = errorHandler;