-- Create database
CREATE DATABASE IF NOT EXISTS student_project_system;
USE student_project_system;

-- Users table
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
);

-- Projects table
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
);

-- Project documents table
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
);

-- Insert sample users (password is 'password123' for all)
INSERT INTO users (name, email, password, role) VALUES 
('Admin Faculty', 'admin@college.edu', '$2b$10$rOZLGWJTh1Jx.8g.KyJ6HOEn9XxA5kOyDx4j4e5g4X5O5g4Z4j4e5g', 'faculty'),
('John Smith', 'john.smith@student.edu', '$2b$10$rOZLGWJTh1Jx.8g.KyJ6HOEn9XxA5kOyDx4j4e5g4X5O5g4Z4j4e5g', 'student_fourth'),
('Jane Doe', 'jane.doe@student.edu', '$2b$10$rOZLGWJTh1Jx.8g.KyJ6HOEn9XxA5kOyDx4j4e5g4X5O5g4Z4j4e5g', 'student_third'),
('Mike Johnson', 'mike.johnson@student.edu', '$2b$10$rOZLGWJTh1Jx.8g.KyJ6HOEn9XxA5kOyDx4j4e5g4X5O5g4Z4j4e5g', 'student_fourth');
-- Insert sample projects
INSERT INTO projects (title, abstract, domain, year, author_id, author_name, status, technologies) VALUES 
('E-Commerce Web Platform', 'A comprehensive e-commerce web application with user authentication, product catalog, shopping cart functionality, payment integration using Stripe, order management system, and admin dashboard. The system includes features like product search, filtering, user reviews, wishlist, and real-time inventory management.', 'Web Development', '2024', 2, 'John Smith', 'approved', 'React.js, Node.js, Express.js, MongoDB, Stripe API, JWT, Bootstrap'),
('AI-Powered Stock Price Predictor', 'Machine learning model that predicts stock prices using historical market data, technical indicators, and sentiment analysis from financial news. The system uses LSTM neural networks and incorporates multiple data sources including Yahoo Finance API and news sentiment scores to provide accurate price predictions.', 'Machine Learning', '2024', 2, 'John Smith', 'pending', 'Python, TensorFlow, Keras, Pandas, NumPy, Scikit-learn, Flask, Yahoo Finance API'),
('Mobile Food Delivery Application', 'Cross-platform mobile application for food ordering and delivery with real-time GPS tracking, restaurant management, payment integration, rating system, and push notifications. Features include user profiles, order history, loyalty points, and admin panel for restaurant owners.', 'Mobile Development', '2023', 4, 'Mike Johnson', 'approved', 'React Native, Firebase, Google Maps API, Stripe, Redux, Expo');
-- Create views for easier data retrieval and analytics

-- Project summary view with author details
CREATE OR REPLACE VIEW project_summary AS
SELECT 
    p.id,
    p.title,
    p.abstract,
    p.domain,
    p.year,
    p.status,
    p.submitted_date,
    p.updated_date,
    p.author_name,
    u.email as author_email,
    p.document_count,
    p.technologies
FROM projects p
JOIN users u ON p.author_id = u.id;

-- Analytics summary view
CREATE OR REPLACE VIEW analytics_summary AS
SELECT 
    COUNT(*) as total_projects,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_projects,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_projects,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_projects,
    AVG(document_count) as avg_documents_per_project
FROM projects;

-- Domain statistics view
CREATE OR REPLACE VIEW domain_stats AS
SELECT 
    domain,
    COUNT(*) as project_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
    COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
    ROUND(COUNT(CASE WHEN status = 'approved' THEN 1 END) * 100.0 / COUNT(*), 2) as approval_rate
FROM projects 
GROUP BY domain
ORDER BY project_count DESC;

-- Yearly statistics view
CREATE OR REPLACE VIEW yearly_stats AS
SELECT 
    year,
    COUNT(*) as project_count,
    COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
    COUNT(DISTINCT author_id) as unique_authors
FROM projects 
GROUP BY year
ORDER BY year DESC;

-- User statistics view
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    role,
    COUNT(*) as user_count,
    MAX(created_at) as latest_registration
FROM users 
GROUP BY role;