const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      message: 'Access token required',
      error: 'UNAUTHORIZED' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Token verification failed:', err.message);
      return res.status(403).json({ 
        message: 'Invalid or expired token',
        error: 'FORBIDDEN' 
      });
    }
    
    req.user = user;
    next();
  });
};

// Middleware to check if user has required role
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        message: 'Authentication required',
        error: 'UNAUTHORIZED' 
      });
    }

    const userRole = req.user.role;
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        error: 'INSUFFICIENT_PERMISSIONS' 
      });
    }

    next();
  };
};

// Middleware specifically for faculty-only endpoints
const requireFaculty = requireRole('faculty');

// Middleware specifically for fourth-year students
const requireFourthYear = requireRole('student_fourth');

// Middleware for students (both third and fourth year)
const requireStudent = requireRole(['student_third', 'student_fourth']);

module.exports = {
  authenticateToken,
  requireRole,
  requireFaculty,
  requireFourthYear,
  requireStudent
};