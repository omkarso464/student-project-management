const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../utils/database');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Validation middleware
const validateRegister = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['student_third', 'student_fourth', 'faculty']).withMessage('Invalid role')
];

const validateLogin = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// Register new user
router.post('/register', validateRegister, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password, role } = req.body;

    // Check if user already exists
    db.query('SELECT id FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred'
        });
      }

      if (results.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'User with this email already exists'
        });
      }

      try {
        // Hash password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Insert new user
        db.query(
          'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
          [name.trim(), email.toLowerCase(), hashedPassword, role],
          (err, result) => {
            if (err) {
              console.error('Error creating user:', err);
              return res.status(500).json({
                success: false,
                message: 'Failed to create user account'
              });
            }

            // Generate JWT token for immediate login
            const token = jwt.sign(
              {
                userId: result.insertId,
                email: email.toLowerCase(),
                name: name.trim(),
                role: role
              },
              process.env.JWT_SECRET,
              { expiresIn: '24h' }
            );

            res.status(201).json({
              success: true,
              message: 'Account created successfully',
              token,
              user: {
                id: result.insertId,
                name: name.trim(),
                email: email.toLowerCase(),
                role: role
              }
            });
          }
        );
      } catch (hashError) {
        console.error('Password hashing error:', hashError);
        res.status(500).json({
          success: false,
          message: 'Error processing password'
        });
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
});

// Login user
router.post('/login', validateLogin, async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user by email
    db.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Database error occurred'
        });
      }

      if (results.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid email or password'
        });
      }

      const user = results[0];

      try {
        // Compare password
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
          return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
          });
        }

        // Generate JWT token
        const token = jwt.sign(
          {
            userId: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          },
          process.env.JWT_SECRET,
          { expiresIn: '24h' }
        );

        // Update last login timestamp
        db.query(
          'UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );

        res.json({
          success: true,
          message: 'Login successful',
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role
          }
        });
      } catch (compareError) {
        console.error('Password comparison error:', compareError);
        res.status(500).json({
          success: false,
          message: 'Error verifying password'
        });
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
});

// Verify token (for frontend to check if user is still logged in)
router.get('/verify', (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No token provided'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      user: {
        id: user.userId,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  });
});

module.exports = router;