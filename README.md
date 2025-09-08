# student-project-management
# 🎓 Student Project Management System

> A comprehensive web-based platform for managing student academic projects in colleges and universities.

[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/HTML)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MySQL](https://img.shields.io/badge/MySQL-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

## 📋 Table of Contents
- [Overview](#-overview)
- [Features](#-features)
- [Demo](#-demo)
- [Quick Start](#-quick-start)
- [Technology Stack](#-technology-stack)
- [User Roles](#-user-roles)
- [Screenshots](#-screenshots)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Contributing](#-contributing)
- [License](#-license)

## 🌟 Overview

The Student Project Management System is a modern, responsive web application designed to streamline the management of academic projects in educational institutions. It provides a centralized platform where final-year students can submit their projects, third-year students can explore approved projects for learning, and faculty members can efficiently review and manage submissions.

### 🎯 Problem Statement
- **Current Issues**: Projects stored in scattered formats (emails, pen drives, unorganized folders)
- **Impact**: Knowledge loss after graduation, duplication of ideas, inefficient faculty workflow
- **Solution**: Centralized platform with role-based access and comprehensive project management

## ✨ Features

### 🔐 Authentication & Security
- **Multi-role authentication** (Third-year students, Fourth-year students, Faculty)
- **JWT-based secure authentication**
- **Password encryption** with bcrypt
- **Role-based access control**

### 👥 User Management
- **Third-Year Students**: Browse and explore approved projects
- **Fourth-Year Students**: Submit and manage their projects
- **Faculty**: Review, approve/reject, and analyze all submissions

### 📁 Project Management
- **Project submission** with metadata (title, abstract, domain, technologies)
- **File upload support** (PDF, DOC, PPT, ZIP files up to 10MB)
- **Advanced search and filtering** by domain, year, technology, and status
- **Project approval workflow** for faculty review

### 📊 Analytics & Reporting
- **Comprehensive analytics dashboard** for faculty
- **Project statistics** by domain, year, and status
- **Technology usage trends**
- **Data export capabilities**

### 🎨 Modern UI/UX
- **Glassmorphism design** with futuristic aesthetics
- **Fully responsive** mobile-first design
- **Dark theme** with gradient backgrounds
- **Smooth animations** and hover effects
- **Accessible interface** with proper contrast and semantic markup

## 🚀 Demo

### 🔗 Live Demo
- **Frontend Only**: Open `index.html` in any browser
- **Full System**: [Deploy Backend] + Frontend

### 👤 Test Credentials
| Role | Email | Password |
|------|-------|----------|
| **Faculty** | admin@college.edu | password123 |
| **4th Year Student** | john.smith@student.edu | password123 |
| **3rd Year Student** | jane.doe@student.edu | password123 |

## 🚀 Quick Start

### 📦 Option 1: Instant Preview (No Setup Required)
```bash
# Clone the repository
git clone https://github.com/yourusername/student-project-management.git
cd student-project-management

# Open in browser
open index.html
# OR double-click index.html
```

### 🔧 Option 2: Full System with Backend

#### Prerequisites
- Node.js (v14+)
- MySQL (v8.0+)
- Git

#### Installation
```bash
# Clone repository
git clone https://github.com/yourusername/student-project-management.git
cd student-project-management

# Install backend dependencies
npm install

# Setup database
mysql -u root -p < sql/setup.sql

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start backend server
npm start

# Open frontend
open index.html
```

#### Environment Variables
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_project_system

# Server Configuration
PORT=5000
JWT_SECRET=your_super_secret_key

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=uploads/
```

## 💻 Technology Stack

### Frontend
- **HTML5** - Semantic markup and structure
- **CSS3** - Advanced styling with glassmorphism effects
- **JavaScript (ES6+)** - Interactive functionality and API communication
- **Responsive Design** - Mobile-first approach

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **MySQL** - Relational database management
- **JWT** - Authentication and authorization
- **Multer** - File upload handling
- **bcrypt** - Password hashing

### DevOps & Tools
- **Git** - Version control
- **npm** - Package management
- **Postman** - API testing
- **MySQL Workbench** - Database management

## 👥 User Roles

### 🎓 Third-Year Students
- **View approved projects** for learning and inspiration
- **Search and filter** projects by various criteria
- **Download project documents** and resources
- **Access project details** including technologies used

### 🎯 Fourth-Year Students
- **Submit new projects** with detailed information
- **Upload project documents** (reports, presentations, source code)
- **Track submission status** (pending/approved/rejected)
- **Update project information** during development

### 👨‍🏫 Faculty Members
- **Review all project submissions**
- **Approve or reject** projects with feedback
- **Access comprehensive analytics** dashboard
- **Generate reports** and export data
- **Manage system users** and maintain data integrity

## 📸 Screenshots

### 🔐 Authentication Screen
```
🎨 Glassmorphism login interface with demo credentials
📱 Responsive design with gradient backgrounds
🔑 Role-based login selection
```

### 📊 Faculty Dashboard
```
📈 Analytics cards with project statistics
📋 Project management interface
🔍 Advanced search and filtering options
```

### 📁 Project Submission
```
📝 Comprehensive project submission form
📎 Multi-file upload with drag-and-drop
🏷️ Technology tagging and categorization
```

### 📱 Mobile Interface
```
📲 Fully responsive design
👆 Touch-friendly navigation
🎨 Consistent UI across all devices
```

## 📚 API Documentation

### Authentication Endpoints
```http
POST /api/auth/login      # User login
POST /api/auth/register   # User registration
GET  /api/auth/verify     # Token verification
```

### Project Management Endpoints
```http
GET    /api/projects           # Get all projects (filtered by role)
GET    /api/projects/:id       # Get project details
POST   /api/projects           # Submit new project
PUT    /api/projects/:id/status # Update project status
DELETE /api/projects/:id       # Delete project
```

### Analytics Endpoints
```http
GET /api/analytics              # Get analytics data
GET /api/analytics/domain/:domain # Domain-specific analytics
GET /api/analytics/export       # Export data
```

### File Management
```http
GET /api/projects/:id/documents/:docId # Download document
```

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role ENUM('student_third', 'student_fourth', 'faculty'),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Projects Table
```sql
CREATE TABLE projects (
    id INT PRIMARY KEY AUTO_INCREMENT,
    title VARCHAR(500) NOT NULL,
    abstract TEXT NOT NULL,
    domain VARCHAR(255) NOT NULL,
    year VARCHAR(10) NOT NULL,
    author_id INT NOT NULL,
    status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
    technologies TEXT,
    submitted_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id)
);
```

### Documents Table
```sql
CREATE TABLE project_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    project_id INT NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INT NOT NULL,
    uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id)
);
```

## 🏗️ Project Structure

```
student-project-management/
├── 📁 backend/
│   └── src/
│       ├── middleware/     # Authentication & error handling
│       ├── routes/         # API endpoints
│       ├── utils/          # Database connection
│       ├── validators/     # Input validation
│       └── server.js       # Main server file
├── 📁 sql/
│   └── setup.sql          # Database schema
├── 📁 uploads/            # File storage directory
├── 📄 index.html          # Frontend application
├── 📄 package.json        # Dependencies & scripts
├── 📄 .env.example        # Environment configuration template
└── 📖 README.md           # Project documentation
```

## 🚀 Deployment

### 🌐 Frontend Deployment (Static Hosting)
```bash
# Deploy to Netlify, Vercel, or GitHub Pages
# Simply upload index.html or connect your repository
```

### 🔧 Backend Deployment (Node.js Hosting)
```bash
# Deploy to Railway, Heroku, or DigitalOcean
git push railway main
# OR
git push heroku main
```

### 🗄️ Database Deployment
- **Railway MySQL** (Free tier available)
- **PlanetScale** (Serverless MySQL)
- **AWS RDS** (Production ready)

## 🤝 Contributing

We welcome contributions from the community! Here's how you can help:

### 🐛 Bug Reports
- Use GitHub Issues to report bugs
- Include steps to reproduce
- Provide browser/environment information

### ✨ Feature Requests
- Check existing issues before creating new ones
- Clearly describe the proposed feature
- Explain the use case and benefits

### 💻 Development Setup
```bash
# Fork the repository
git clone https://github.com/yourusername/student-project-management.git
cd student-project-management

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and commit
git commit -m "Add your feature"

# Push and create pull request
git push origin feature/your-feature-name
```

### 📝 Coding Standards
- Follow ESLint configuration
- Write descriptive commit messages
- Add comments for complex logic
- Update documentation for new features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Student Project Management System

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## 🙏 Acknowledgments

- **Educational Institutions** - For inspiring the need for better project management
- **Open Source Community** - For the amazing tools and libraries
- **Students & Faculty** - For feedback and feature suggestions

## 📞 Contact

- **GitHub**: [@omkarso464](https://github.com/yourusername)
- **Email**: omkarso250@gmail.com
- **LinkedIn**: [0mkar-5onawane](https://linkedin.com/in/yourname)

---

<div align="center">

### 🌟 Star this repository if you found it helpful!

Made with ❤️ for the education community

[⬆ Back to Top](#-student-project-management-system)

</div>
