const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const util = require('util'); // Used for promisifying fs functions
const db = require('../utils/database'); // Assuming this is your database connection module
const {
    authenticateToken,
    requireFourthYear,
    requireFaculty
} = require('../middleware/auth');

// --- Promise-based setup ---
// It's highly recommended to use a MySQL library that supports promises out of the box (like 'mysql2/promise').
// If your 'db.query' is callback-based, you can promisify it like this:
const query = util.promisify(db.query).bind(db);
// For file system operations
const unlinkFile = util.promisify(fs.unlink);

const router = express.Router();

// --- Directory and Storage Configuration ---

// Ensure 'uploads' directory exists
const uploadsDir = path.join(__dirname, '../../../uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, {
        recursive: true
    });
    console.log('✅ Created uploads directory');
}

// Multer disk storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        // Create a unique filename to prevent overwrites
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, `${path.basename(file.originalname, extension)}-${uniqueSuffix}${extension}`);
    }
});

// File filter to allow only specific file types
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.ppt', '.pptx', '.zip', '.rar'];
    const fileExt = path.extname(file.originalname).toLowerCase();

    if (allowedTypes.includes(fileExt)) {
        cb(null, true); // Accept file
    } else {
        // Reject file
        cb(new Error(`Invalid file type: ${fileExt}. Allowed types: ${allowedTypes.join(', ')}`), false);
    }
};

// Multer upload instance with configured storage, filter, and limits
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB per file
        files: 5 // Maximum 5 files per upload
    }
});

// --- Route Definitions ---

/**
 * GET / - Fetch all projects with filtering and role-based access.
 * Third-year students see only 'approved' projects.
 * Fourth-year students see only their own projects.
 * Faculty can see all projects and filter by status.
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const {
            domain,
            year,
            search,
            status
        } = req.query;
        const {
            role: userRole,
            userId
        } = req.user;

        let sqlQuery = `
            SELECT 
                p.*,
                COUNT(pd.id) as document_count
            FROM projects p 
            LEFT JOIN project_documents pd ON p.id = pd.project_id
        `;
        const conditions = [];
        const params = [];

        // Role-based filtering logic
        if (userRole === 'student_third') {
            conditions.push('p.status = ?');
            params.push('approved');
        } else if (userRole === 'student_fourth') {
            conditions.push('p.author_id = ?');
            params.push(userId);
        }

        // Additional query filters
        if (domain && domain !== 'all') {
            conditions.push('p.domain = ?');
            params.push(domain);
        }
        if (year && year !== 'all') {
            conditions.push('p.year = ?');
            params.push(year);
        }
        if (status && userRole === 'faculty' && status !== 'all') {
            conditions.push('p.status = ?');
            params.push(status);
        }
        if (search && search.trim() !== '') {
            conditions.push('(p.title LIKE ? OR p.abstract LIKE ? OR p.technologies LIKE ?)');
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        // Build the final query
        if (conditions.length > 0) {
            sqlQuery += ' WHERE ' + conditions.join(' AND ');
        }
        sqlQuery += ' GROUP BY p.id ORDER BY p.submitted_date DESC';

        const results = await query(sqlQuery, params);

        // Format results for a clean API response
        const projects = results.map(project => ({
            id: project.id,
            title: project.title,
            abstract: project.abstract,
            domain: project.domain,
            year: project.year,
            author: project.author_name,
            authorId: project.author_id,
            status: project.status,
            submittedDate: project.submitted_date,
            updatedDate: project.updated_date,
            technologies: project.technologies ? project.technologies.split(',').map(t => t.trim()) : [],
            documentCount: project.document_count || 0
        }));

        res.json({
            success: true,
            message: 'Projects fetched successfully',
            projects,
            total: projects.length
        });
    } catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while fetching projects.'
        });
    }
});


/**
 * GET /:id - Fetch details for a single project.
 * Permissions are checked to ensure users only see what they're allowed to.
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const {
            id: projectId
        } = req.params;
        const {
            role: userRole,
            userId
        } = req.user;

        // Get project details
        const projectResults = await query('SELECT * FROM projects WHERE id = ?', [projectId]);

        if (projectResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found'
            });
        }
        const project = projectResults[0];

        // Permission checks
        if (userRole === 'student_third' && project.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. This project has not been approved for viewing.'
            });
        }
        if (userRole === 'student_fourth' && project.author_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only view details of your own projects.'
            });
        }

        // Get associated project documents
        const documents = await query('SELECT id, original_name, file_size, uploaded_date FROM project_documents WHERE project_id = ?', [projectId]);

        const projectDetails = {
            id: project.id,
            title: project.title,
            abstract: project.abstract,
            domain: project.domain,
            year: project.year,
            author: project.author_name,
            authorId: project.author_id,
            status: project.status,
            submittedDate: project.submitted_date,
            updatedDate: project.updated_date,
            technologies: project.technologies ? project.technologies.split(',').map(t => t.trim()) : [],
            documents: documents || []
        };

        res.json({
            success: true,
            message: 'Project details fetched successfully',
            project: projectDetails
        });
    } catch (error) {
        console.error('Error fetching project details:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while fetching project details.'
        });
    }
});


/**
 * POST / - Submit a new project.
 * Restricted to fourth-year students. Handles file uploads.
 */
router.post('/', authenticateToken, requireFourthYear, upload.array('documents', 5), async (req, res) => {
    try {
        const {
            title,
            abstract,
            domain,
            year,
            technologies
        } = req.body;
        const {
            userId: authorId,
            name: authorName
        } = req.user;

        // Basic validation
        if (!title || !abstract || !domain || !year) {
            // If validation fails, clean up any files that were uploaded
            if (req.files) {
                await Promise.all(req.files.map(file => unlinkFile(file.path)));
            }
            return res.status(400).json({
                success: false,
                message: 'Title, abstract, domain, and year are required fields.'
            });
        }

        // Insert project into the database
        const projectData = {
            title: title.trim(),
            abstract: abstract.trim(),
            domain: domain.trim(),
            year: year.trim(),
            author_id: authorId,
            author_name: authorName,
            technologies: technologies ? technologies.trim() : null
        };

        const result = await query(
            'INSERT INTO projects (title, abstract, domain, year, author_id, author_name, technologies) VALUES (?, ?, ?, ?, ?, ?, ?)',
            Object.values(projectData)
        );

        const projectId = result.insertId;

        // If documents were uploaded, insert them into the documents table
        if (req.files && req.files.length > 0) {
            const documentValues = req.files.map(file => [
                projectId,
                file.filename,
                file.originalname,
                file.path,
                file.size,
                file.mimetype
            ]);
            await query(
                'INSERT INTO project_documents (project_id, filename, original_name, file_path, file_size, mime_type) VALUES ?',
                [documentValues]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Project submitted successfully! It will be reviewed by faculty.',
            projectId: projectId,
            documentsUploaded: req.files ? req.files.length : 0
        });

    } catch (error) {
        console.error('Error submitting project:', error);
        // Clean up any uploaded files in case of an error during DB insertion
        if (req.files) {
            await Promise.all(req.files.map(file => unlinkFile(file.path).catch(err => console.error("Failed to delete file on error:", err))));
        }
        res.status(500).json({
            success: false,
            message: 'Server error occurred during project submission.'
        });
    }
});


/**
 * PUT /:id/status - Update a project's status.
 * Restricted to faculty members.
 */
router.put('/:id/status', authenticateToken, requireFaculty, async (req, res) => {
    try {
        const {
            id: projectId
        } = req.params;
        const {
            status
        } = req.body;

        // Validate status value
        const allowedStatuses = ['pending', 'approved', 'rejected'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}`
            });
        }

        // Check if project exists
        const projectResults = await query('SELECT title FROM projects WHERE id = ?', [projectId]);
        if (projectResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found.'
            });
        }
        const project = projectResults[0];

        // Update the project status
        await query('UPDATE projects SET status = ?, updated_date = CURRENT_TIMESTAMP WHERE id = ?', [status, projectId]);

        res.json({
            success: true,
            message: `Project "${project.title}" has been successfully updated to '${status}'.`,
            newStatus: status
        });

    } catch (error) {
        console.error('Error updating project status:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while updating status.'
        });
    }
});


/**
 * DELETE /:id - Delete a project.
 * Fourth-year students can delete their own projects; faculty can delete any.
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const {
            id: projectId
        } = req.params;
        const {
            role: userRole,
            userId
        } = req.user;

        // Get project details to check for permissions and get file paths
        const projectResults = await query('SELECT * FROM projects WHERE id = ?', [projectId]);
        if (projectResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Project not found.'
            });
        }
        const project = projectResults[0];

        // Permission checks
        if (userRole === 'student_third') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You do not have permission to delete projects.'
            });
        }
        if (userRole === 'student_fourth' && project.author_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You can only delete your own projects.'
            });
        }

        // Get associated documents to delete files from the filesystem
        const documents = await query('SELECT file_path FROM project_documents WHERE project_id = ?', [projectId]);

        // Delete the project from the database.
        // Assumes `ON DELETE CASCADE` is set for the `project_id` foreign key in `project_documents` table.
        await query('DELETE FROM projects WHERE id = ?', [projectId]);

        // Delete associated files from the filesystem
        if (documents.length > 0) {
            const deletePromises = documents.map(doc => unlinkFile(doc.file_path).catch(err => console.error(`Failed to delete file ${doc.file_path}:`, err)));
            await Promise.all(deletePromises);
        }

        res.json({
            success: true,
            message: 'Project and all associated documents deleted successfully.'
        });

    } catch (error) {
        console.error('Error deleting project:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while deleting the project.'
        });
    }
});


/**
 * GET /:projectId/documents/:documentId - Download a project document.
 */
router.get('/:projectId/documents/:documentId', authenticateToken, async (req, res) => {
    try {
        const {
            documentId
        } = req.params;
        const {
            role: userRole,
            userId
        } = req.user;

        // Get document details along with project status and author for permission checks
        const docResults = await query(
            `SELECT pd.file_path, pd.original_name, pd.mime_type, p.status, p.author_id 
             FROM project_documents pd 
             JOIN projects p ON pd.project_id = p.id 
             WHERE pd.id = ?`,
            [documentId]
        );

        if (docResults.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Document not found.'
            });
        }
        const document = docResults[0];

        // Permission checks
        if (userRole === 'student_third' && document.status !== 'approved') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Project is not approved.'
            });
        }
        if (userRole === 'student_fourth' && document.author_id !== userId && userRole !== 'faculty') {
             return res.status(403).json({
                success: false,
                message: 'Access denied. You can only download your own project documents.'
            });
        }

        // Check if the file physically exists before attempting to send it
        if (!fs.existsSync(document.file_path)) {
            return res.status(404).json({
                success: false,
                message: 'File not found on server. It may have been moved or deleted.'
            });
        }

        // Use res.download to stream the file to the client
        res.download(document.file_path, document.original_name, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
                if (!res.headersSent) {
                    res.status(500).json({
                        success: false,
                        message: 'Error occurred during file download.'
                    });
                }
            }
        });

    } catch (error) {
        console.error('Error downloading document:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred.'
        });
    }
});


/**
 * GET /meta/filters - Get available domains and years for populating filter dropdowns.
 */
router.get('/meta/filters', authenticateToken, async (req, res) => {
    try {
        // Fetch distinct domains and years in parallel
        const [domainsResult, yearsResult] = await Promise.all([
            query('SELECT DISTINCT domain FROM projects WHERE domain IS NOT NULL ORDER BY domain'),
            query('SELECT DISTINCT year FROM projects WHERE year IS NOT NULL ORDER BY year DESC')
        ]);

        res.json({
            success: true,
            message: 'Filter options fetched successfully',
            filters: {
                domains: domainsResult.map(d => d.domain),
                years: yearsResult.map(y => y.year)
            }
        });
    } catch (error) {
        console.error('Error fetching filter options:', error);
        res.status(500).json({
            success: false,
            message: 'Server error occurred while fetching filter options.'
        });
    }
});


module.exports = router;
