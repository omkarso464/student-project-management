const mysql = require('mysql2');
require('dotenv').config();

// Create MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'student_project_system',
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
});

// Connect to database
db.connect((err) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
  } else {
    console.log('✅ Connected to MySQL database successfully!');
    createTables();
  }
});

// Create tables if they don't exist
const createTables = () => {
  console.log('🔧 Setting up database tables...');

  // Users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role ENUM('student_third', 'student_fourth', 'faculty') NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_email (email),
      INDEX idx_role (role)
    )
  `;

  // Projects table
  const createProjectsTable = `
    CREATE TABLE IF NOT EXISTS projects (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(500) NOT NULL,
      abstract TEXT NOT NULL,
      domain VARCHAR(255) NOT NULL,
      year VARCHAR(10) NOT NULL,
      author_id INT NOT NULL,
      author_name VARCHAR(255) NOT NULL,
      status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
      technologies TEXT,
      document_count INT DEFAULT 0,
      submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_status (status),
      INDEX idx_domain (domain),
      INDEX idx_year (year),
      INDEX idx_author (author_id)
    )
  `;

  // Project documents table
  const createDocumentsTable = `
    CREATE TABLE IF NOT EXISTS project_documents (
      id INT AUTO_INCREMENT PRIMARY KEY,
      project_id INT NOT NULL,
      filename VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      file_path VARCHAR(500) NOT NULL,
      file_size INT NOT NULL,
      mime_type VARCHAR(100),
      uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
      INDEX idx_project (project_id)
    )
  `;

  // Execute table creation queries
  db.query(createUsersTable, (err) => {
    if (err) {
      console.error('❌ Error creating users table:', err);
    } else {
      console.log('✅ Users table ready');
    }
  });

  db.query(createProjectsTable, (err) => {
    if (err) {
      console.error('❌ Error creating projects table:', err);
    } else {
      console.log('✅ Projects table ready');
    }
  });

  db.query(createDocumentsTable, (err) => {
    if (err) {
      console.error('❌ Error creating documents table:', err);
    } else {
      console.log('✅ Documents table ready');
    }
  });

  // Insert sample admin user if it doesn't exist
  createSampleUser();
};

// Create a sample admin user for testing
const createSampleUser = () => {
  const bcrypt = require('bcrypt');
  
  db.query('SELECT COUNT(*) as count FROM users WHERE role = "faculty"', async (err, results) => {
    if (!err && results[0].count === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      db.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Admin User', 'admin@college.edu', hashedPassword, 'faculty'],
        (err) => {
          if (!err) {
            console.log('✅ Sample admin user created: admin@college.edu / admin123');
          }
        }
      );
    }
  });
};

// Handle connection errors
db.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Attempting to reconnect to database...');
    createConnection();
  } else {
    throw err;
  }
});

module.exports = db;
