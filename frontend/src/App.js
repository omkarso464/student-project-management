import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Upload, Eye, Check, X, BarChart3, Filter, User, LogOut, Plus, FileText, Calendar, Code, Download, Trash2 } from 'lucide-react';

// API Base URL - Change this when deploying
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.railway.app/api' 
  : 'http://localhost:5000/api';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    domain: '',
    year: '',
    status: ''
  });
  const [analytics, setAnalytics] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Set up axios defaults
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    }
  }, []);

  // Verify token on app load
  const verifyToken = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/auth/verify`);
      if (response.data.success) {
        setCurrentUser(response.data.user);
        setCurrentView('dashboard');
      }
    } catch (error) {
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    }
  };

  // Show message to user
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Login function
  const login = async (email, password, role) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user);
        setCurrentView('dashboard');
        showMessage('success', 'Login successful!');
        fetchProjects();
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name, email, password, role) => {
    setLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, {
        name,
        email,
        password,
        role
      });

      if (response.data.success) {
        const { token, user } = response.data;
        localStorage.setItem('token', token);
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        setCurrentUser(user);
        setCurrentView('dashboard');
        showMessage('success', 'Account created successfully!');
        fetchProjects();
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
    setCurrentUser(null);
    setCurrentView('login');
    setProjects([]);
    setFilteredProjects([]);
    showMessage('success', 'Logged out successfully');
  };

  // Fetch projects
  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedFilters.domain) params.append('domain', selectedFilters.domain);
      if (selectedFilters.year) params.append('year', selectedFilters.year);
      if (selectedFilters.status) params.append('status', selectedFilters.status);
      if (searchTerm) params.append('search', searchTerm);

      const response = await axios.get(`${API_BASE_URL}/projects?${params}`);
      
      if (response.data.success) {
        setProjects(response.data.projects);
        setFilteredProjects(response.data.projects);
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  // Fetch analytics (faculty only)
  const fetchAnalytics = async () => {
    if (currentUser?.role !== 'faculty') return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics`);
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch analytics');
    } finally {
      setLoading(false);
    }
  };

  // Update project status (faculty only)
  const updateProjectStatus = async (projectId, newStatus) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/projects/${projectId}/status`, {
        status: newStatus
      });

      if (response.data.success) {
        showMessage('success', response.data.message);
        fetchProjects();
      }
    } catch (error) {
      showMessage('error', error.response?.data?.message || 'Failed to update status');
    }
  };

  // Download document
  const downloadDocument = async (projectId, documentId, filename) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/projects/${projectId}/documents/${documentId}`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showMessage('error', 'Failed to download document');
    }
  };

  // Filter projects when search or filters change
  useEffect(() => {
    if (currentUser) {
      fetchProjects();
    }
  }, [searchTerm, selectedFilters, currentUser]);

  // Fetch analytics when switching to analytics view
  useEffect(() => {
    if (currentView === 'analytics' && currentUser?.role === 'faculty') {
      fetchAnalytics();
    }
  }, [currentView, currentUser]);

  // Message Component
  const MessageAlert = () => {
    if (!message.text) return null;
    
    return (
      <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg ${
        message.type === 'success' ? 'bg-green-500 text-white' :
        message.type === 'error' ? 'bg-red-500 text-white' :
        'bg-blue-500 text-white'
      }`}>
        {message.text}
      </div>
    );
  };

  // Login/Register Form Component
  const AuthForm = () => {
    const [isLogin, setIsLogin] = useState(true);
    const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      role: 'student_third'
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (isLogin) {
        login(formData.email, formData.password, formData.role);
      } else {
        register(formData.name, formData.email, formData.password, formData.role);
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="text-white text-2xl" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Project Management System</h1>
            <p className="text-gray-600">
              {isLogin ? 'Sign in to your account' : 'Create a new account'}
            </p>
          </div>
          
          <div className="space-y-6">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="student_third">Third Year Student</option>
                <option value="student_fourth">Fourth Year Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>
            
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </button>
            
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="w-full text-blue-600 hover:text-blue-700 py-2"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
          
          {isLogin && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
              <p className="font-medium mb-2">Demo Credentials:</p>
              <p>Faculty: admin@college.edu / password123</p>
              <p>4th Year: john.smith@student.edu / password123</p>
              <p>3rd Year: jane.doe@student.edu / password123</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Header Component
  const Header = () => (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <FileText className="text-blue-600 text-2xl" />
          <h1 className="text-xl font-bold text-gray-800">Project Management System</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User size={16} />
            <span>{currentUser?.name}</span>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
              {currentUser?.role === 'student_third' ? 'THIRD YEAR' :
               currentUser?.role === 'student_fourth' ? 'FOURTH YEAR' : 'FACULTY'}
            </span>
          </div>
          <button
            onClick={logout}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 px-3 py-2 rounded-md hover:bg-gray-100"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </div>
    </header>
  );

  // Navigation Component
  const Navigation = () => (
    <nav className="bg-gray-50 border-b border-gray-200 px-6 py-3">
      <div className="flex space-x-6">
        <button
          onClick={() => setCurrentView('dashboard')}
          className={`px-3 py-2 rounded-md text-sm font-medium ${
            currentView === 'dashboard' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          Dashboard
        </button>
        
        {currentUser?.role === 'student_fourth' && (
          <button
            onClick={() => setCurrentView('upload')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentView === 'upload' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Upload Project
          </button>
        )}
        
        {currentUser?.role === 'faculty' && (
          <button
            onClick={() => setCurrentView('analytics')}
            className={`px-3 py-2 rounded-md text-sm font-medium ${
              currentView === 'analytics' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Analytics
          </button>
        )}
      </div>
    </nav>
  );

  // Search and Filter Component
  const SearchAndFilter = () => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search projects by title, description, or technology..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <select
            value={selectedFilters.domain}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, domain: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Domains</option>
            <option value="Web Development">Web Development</option>
            <option value="Mobile Development">Mobile Development</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Data Science">Data Science</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Cybersecurity">Cybersecurity</option>
          </select>
          
          <select
            value={selectedFilters.year}
            onChange={(e) => setSelectedFilters(prev => ({ ...prev, year: e.target.value }))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Years</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
            <option value="2022">2022</option>
          </select>
          
          {currentUser?.role === 'faculty' && (
            <select
              value={selectedFilters.status}
              onChange={(e) => setSelectedFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          )}
        </div>
      </div>
    </div>
  );

  // Project Card Component
  const ProjectCard = ({ project }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">{project.title}</h3>
          <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.abstract}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            project.status === 'approved' ? 'bg-green-100 text-green-800' :
            project.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            {project.status.toUpperCase()}
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Domain:</span>
          <span className="ml-2 font-medium">{project.domain}</span>
        </div>
        <div>
          <span className="text-gray-500">Year:</span>
          <span className="ml-2 font-medium">{project.year}</span>
        </div>
        <div>
          <span className="text-gray-500">Author:</span>
          <span className="ml-2 font-medium">{project.author}</span>
        </div>
        <div>
          <span className="text-gray-500">Documents:</span>
          <span className="ml-2 font-medium">{project.documentCount || 0}</span>
        </div>
      </div>
      
      {project.technologies && project.technologies.length > 0 && (
        <div className="mb-4">
          <span className="text-gray-500 text-sm">Technologies:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {project.technologies.map((tech, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                {tech}
              </span>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-500">
          Submitted: {new Date(project.submittedDate).toLocaleDateString()}
        </div>
        
        <div className="flex space-x-2">
          {currentUser?.role === 'faculty' && project.status === 'pending' && (
            <>
              <button
                onClick={() => updateProjectStatus(project.id, 'approved')}
                className="flex items-center space-x-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 text-sm"
              >
                <Check size={16} />
                <span>Approve</span>
              </button>
              <button
                onClick={() => updateProjectStatus(project.id, 'rejected')}
                className="flex items-center space-x-1 bg-red-600 text-white px-3 py-2 rounded-md hover:bg-red-700 text-sm"
              >
                <X size={16} />
                <span>Reject</span>
              </button>
            </>
          )}
          <button 
            onClick={() => setCurrentView(`project-${project.id}`)}
            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 text-sm"
          >
            <Eye size={16} />
            <span>View Details</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Project Upload Component
  const UploadProject = () => {
    const [formData, setFormData] = useState({
      title: '',
      abstract: '',
      domain: 'Web Development',
      year: '2024',
      technologies: ''
    });
    const [files, setFiles] = useState([]);

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);

      try {
        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('abstract', formData.abstract);
        submitData.append('domain', formData.domain);
        submitData.append('year', formData.year);
        submitData.append('technologies', formData.technologies);
        
        files.forEach(file => {
          submitData.append('documents', file);
        });

        const response = await axios.post(`${API_BASE_URL}/projects`, submitData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        if (response.data.success) {
          showMessage('success', response.data.message);
          setCurrentView('dashboard');
          fetchProjects();
          setFormData({
            title: '',
            abstract: '',
            domain: 'Web Development',
            year: '2024',
            technologies: ''
          });
          setFiles([]);
        }
      } catch (error) {
        showMessage('error', error.response?.data?.message || 'Failed to submit project');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Upload New Project</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Abstract</label>
              <textarea
                value={formData.abstract}
                onChange={(e) => setFormData(prev => ({ ...prev, abstract: e.target.value }))}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Provide a detailed description of your project..."
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
                <select
                  value={formData.domain}
                  onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="Web Development">Web Development</option>
                  <option value="Mobile Development">Mobile Development</option>
                  <option value="Machine Learning">Machine Learning</option>
                  <option value="Data Science">Data Science</option>
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Computer Networks">Computer Networks</option>
                  <option value="Database Management">Database Management</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Year</label>
                <select
                  value={formData.year}
                  onChange={(e) => setFormData(prev => ({ ...prev, year: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="2024">2024</option>
                  <option value="2023">2023</option>
                  <option value="2022">2022</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Technologies Used (comma-separated)
              </label>
              <input
                type="text"
                value={formData.technologies}
                onChange={(e) => setFormData(prev => ({ ...prev, technologies: e.target.value }))}
                placeholder="e.g., React, Node.js, MongoDB, Python"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Project Documents</label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-gray-600">Select your project files</p>
                <p className="text-sm text-gray-500 mt-1">PDF, DOC, PPT, ZIP files (Max 5 files, 10MB each)</p>
                <input
                  type="file"
                  multiple
                  onChange={(e) => setFiles(Array.from(e.target.files))}
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
                    Choose Files
                  </span>
                </label>
              </div>
              
              {files.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Selected Files:</h4>
                  <ul className="space-y-1">
                    {files.map((file, index) => (
                      <li key={index} className="flex items-center justify-between text-sm">
                        <span>{file.name}</span>
                        <span className="text-gray-500">
                          {(file.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex space-x-4">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Project'}
              </button>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Analytics Dashboard Component
  const Analytics = () => {
    if (!analytics) {
      return (
        <div className="text-center py-12">
          <BarChart3 className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading Analytics...</h3>
          <p className="text-gray-500">Please wait while we fetch the data</p>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Projects</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.overview?.totalProjects || 0}</p>
              </div>
              <FileText className="text-blue-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{analytics.overview?.approvedProjects || 0}</p>
              </div>
              <Check className="text-green-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-yellow-600">{analytics.overview?.pendingProjects || 0}</p>
              </div>
              <Calendar className="text-yellow-600" size={32} />
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Approval Rate</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.overview?.approvalRate || 0}%</p>
              </div>
              <BarChart3 className="text-blue-600" size={32} />
            </div>
          </div>
        </div>
        
        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Domain Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Projects by Domain</h3>
            <div className="space-y-3">
              {analytics.domainStats?.map((domain, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{domain.domain}</span>
                  <div className="flex items-center space-x-2">
                    <div className="bg-blue-200 rounded-full h-2 w-20 overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full" 
                        style={{ width: `${(domain.projectCount / analytics.overview.totalProjects) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{domain.projectCount}</span>
                  </div>
                </div>
              )) || <p className="text-gray-500">No data available</p>}
            </div>
          </div>
          
          {/* Year Statistics */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Projects by Year</h3>
            <div className="space-y-3">
              {analytics.yearStats?.map((year, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">{year.year}</span>
                  <div className="flex items-center space-x-2">
                    <div className="bg-green-200 rounded-full h-2 w-20 overflow-hidden">
                      <div 
                        className="bg-green-600 h-full" 
                        style={{ width: `${(year.projectCount / analytics.overview.totalProjects) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-8">{year.projectCount}</span>
                  </div>
                </div>
              )) || <p className="text-gray-500">No data available</p>}
            </div>
          </div>
        </div>

        {/* Top Technologies */}
        {analytics.topTechnologies && analytics.topTechnologies.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Popular Technologies</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {analytics.topTechnologies.slice(0, 10).map((tech, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded-lg text-center">
                  <p className="text-sm font-medium text-gray-800">{tech.technology}</p>
                  <p className="text-xs text-gray-600">{tech.usageCount} projects</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {analytics.recentActivity && analytics.recentActivity.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Project Submissions</h3>
            <div className="space-y-3">
              {analytics.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{activity.title}</p>
                    <p className="text-xs text-gray-600">by {activity.author} • {activity.domain}</p>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                      activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {activity.status}
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(activity.submittedDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Main Dashboard Component
  const Dashboard = () => {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            {currentUser?.role === 'student_third' ? 'Explore Projects' :
             currentUser?.role === 'student_fourth' ? 'My Projects' :
             'All Projects'}
          </h2>
          <p className="text-gray-600">
            {currentUser?.role === 'student_third' 
              ? 'Browse approved projects for learning and inspiration'
              : currentUser?.role === 'student_fourth'
              ? 'View and manage your submitted projects'
              : 'Review and manage all student projects'}
          </p>
        </div>
        
        <SearchAndFilter />
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading projects...</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredProjects.map(project => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
            
            {filteredProjects.length === 0 && (
              <div className="text-center py-12">
                <FileText className="mx-auto text-gray-400 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedFilters.domain || selectedFilters.year || selectedFilters.status
                    ? 'Try adjusting your search or filter criteria'
                    : 'No projects have been submitted yet'}
                </p>
                {currentUser?.role === 'student_fourth' && (
                  <button
                    onClick={() => setCurrentView('upload')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                  >
                    Submit Your First Project
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  // Loading Component
  if (loading && !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Main App Render
  if (!currentUser) {
    return (
      <>
        <MessageAlert />
        <AuthForm />
      </>
    );
  }

  return (
    <>
      <MessageAlert />
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Navigation />
        
        <main className="container mx-auto px-6 py-8">
          {currentView === 'dashboard' && <Dashboard />}
          {currentView === 'upload' && currentUser?.role === 'student_fourth' && <UploadProject />}
          {currentView === 'analytics' && currentUser?.role === 'faculty' && <Analytics />}
        </main>
      </div>
    </>
  );
};

export default App;