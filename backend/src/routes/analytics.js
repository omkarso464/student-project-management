const express = require('express');
const db = require('../utils/database');
const { authenticateToken, requireFaculty } = require('../middleware/auth');

const router = express.Router();

// Get comprehensive analytics data (Faculty only)
router.get('/', authenticateToken, requireFaculty, (req, res) => {
  try {
    // Get overall project statistics
    const statsQuery = `
      SELECT 
        COUNT(*) as total_projects,
        COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_projects,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_projects,
        COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_projects,
        AVG(document_count) as avg_documents_per_project
      FROM projects
    `;

    db.query(statsQuery, (err, statsResults) => {
      if (err) {
        console.error('Error fetching project stats:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching analytics data'
        });
      }

      const stats = statsResults[0];

      // Get domain statistics
      db.query(`
        SELECT 
          domain,
          COUNT(*) as project_count,
          COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
          COUNT(CASE WHEN status = 'rejected' THEN 1 END) as rejected_count,
          ROUND(COUNT(CASE WHEN status = 'approved' THEN 1 END) * 100.0 / COUNT(*), 1) as approval_rate
        FROM projects 
        GROUP BY domain 
        ORDER BY project_count DESC
      `, (err, domainStats) => {
        if (err) {
          console.error('Error fetching domain stats:', err);
          return res.status(500).json({
            success: false,
            message: 'Error fetching domain statistics'
          });
        }

        // Get yearly statistics
        db.query(`
          SELECT 
            year,
            COUNT(*) as project_count,
            COUNT(CASE WHEN status = 'approved' THEN 1 END) as approved_count,
            COUNT(DISTINCT author_id) as unique_students
          FROM projects 
          GROUP BY year 
          ORDER BY year DESC
        `, (err, yearStats) => {
          if (err) {
            console.error('Error fetching year stats:', err);
            return res.status(500).json({
              success: false,
              message: 'Error fetching yearly statistics'
            });
          }

          // Get monthly submission trends (last 12 months)
          db.query(`
            SELECT 
              DATE_FORMAT(submitted_date, '%Y-%m') as month,
              COUNT(*) as submissions
            FROM projects 
            WHERE submitted_date >= DATE_SUB(CURRENT_DATE, INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(submitted_date, '%Y-%m')
            ORDER BY month ASC
          `, (err, monthlyTrends) => {
            if (err) {
              console.error('Error fetching monthly trends:', err);
              return res.status(500).json({
                success: false,
                message: 'Error fetching submission trends'
              });
            }

            // Get top technologies
            db.query(`
              SELECT 
                TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(technologies, ',', n.digit+1), ',', -1)) as technology,
                COUNT(*) as usage_count
              FROM (
                SELECT 1 as digit UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL 
                SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL 
                SELECT 7 UNION ALL SELECT 8 UNION ALL SELECT 9 UNION ALL SELECT 10
              ) as n
              CROSS JOIN projects p
              WHERE CHAR_LENGTH(p.technologies) - CHAR_LENGTH(REPLACE(p.technologies, ',', '')) >= n.digit - 1
                AND p.technologies IS NOT NULL 
                AND p.technologies != ''
                AND TRIM(SUBSTRING_INDEX(SUBSTRING_INDEX(p.technologies, ',', n.digit+1), ',', -1)) != ''
              GROUP BY technology
              HAVING technology != ''
              ORDER BY usage_count DESC
              LIMIT 10
            `, (err, techStats) => {
              if (err) {
                console.error('Error fetching technology stats:', err);
                // Don't fail the entire request for this
                techStats = [];
              }

              // Get recent activity (last 10 project submissions)
              db.query(`
                SELECT 
                  id,
                  title,
                  author_name,
                  domain,
                  status,
                  submitted_date
                FROM projects 
                ORDER BY submitted_date DESC 
                LIMIT 10
              `, (err, recentActivity) => {
                if (err) {
                  console.error('Error fetching recent activity:', err);
                  recentActivity = [];
                }

                // Get user statistics
                db.query(`
                  SELECT 
                    role,
                    COUNT(*) as user_count
                  FROM users 
                  GROUP BY role
                `, (err, userStats) => {
                  if (err) {
                    console.error('Error fetching user stats:', err);
                    userStats = [];
                  }

                  // Compile all analytics data
                  const analyticsData = {
                    overview: {
                      totalProjects: parseInt(stats.total_projects) || 0,
                      approvedProjects: parseInt(stats.approved_projects) || 0,
                      pendingProjects: parseInt(stats.pending_projects) || 0,
                      rejectedProjects: parseInt(stats.rejected_projects) || 0,
                      avgDocumentsPerProject: parseFloat(stats.avg_documents_per_project) || 0,
                      approvalRate: stats.total_projects > 0 
                        ? Math.round((stats.approved_projects / stats.total_projects) * 100 * 10) / 10 
                        : 0
                    },
                    domainStats: domainStats.map(domain => ({
                      domain: domain.domain,
                      projectCount: parseInt(domain.project_count),
                      approvedCount: parseInt(domain.approved_count),
                      pendingCount: parseInt(domain.pending_count),
                      rejectedCount: parseInt(domain.rejected_count),
                      approvalRate: parseFloat(domain.approval_rate) || 0
                    })),
                    yearStats: yearStats.map(year => ({
                      year: year.year,
                      projectCount: parseInt(year.project_count),
                      approvedCount: parseInt(year.approved_count),
                      uniqueStudents: parseInt(year.unique_students)
                    })),
                    monthlyTrends: monthlyTrends.map(trend => ({
                      month: trend.month,
                      submissions: parseInt(trend.submissions)
                    })),
                    topTechnologies: techStats.map(tech => ({
                      technology: tech.technology,
                      usageCount: parseInt(tech.usage_count)
                    })),
                    recentActivity: recentActivity.map(activity => ({
                      id: activity.id,
                      title: activity.title,
                      author: activity.author_name,
                      domain: activity.domain,
                      status: activity.status,
                      submittedDate: activity.submitted_date
                    })),
                    userStats: userStats.map(user => ({
                      role: user.role,
                      count: parseInt(user.user_count)
                    }))
                  };

                  res.json({
                    success: true,
                    message: 'Analytics data retrieved successfully',
                    analytics: analyticsData,
                    generatedAt: new Date().toISOString()
                  });
                });
              });
            });
          });
        });
      });
    });
  } catch (error) {
    console.error('Error in analytics endpoint:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching analytics'
    });
  }
});

// Get domain-specific analytics
router.get('/domain/:domain', authenticateToken, requireFaculty, (req, res) => {
  try {
    const domain = req.params.domain;

    db.query(`
      SELECT 
        p.*,
        COUNT(pd.id) as document_count
      FROM projects p
      LEFT JOIN project_documents pd ON p.id = pd.project_id
      WHERE p.domain = ?
      GROUP BY p.id
      ORDER BY p.submitted_date DESC
    `, [domain], (err, projects) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error fetching domain analytics'
        });
      }

      const analytics = {
        domain: domain,
        totalProjects: projects.length,
        approved: projects.filter(p => p.status === 'approved').length,
        pending: projects.filter(p => p.status === 'pending').length,
        rejected: projects.filter(p => p.status === 'rejected').length,
        projects: projects.map(p => ({
          id: p.id,
          title: p.title,
          author: p.author_name,
          status: p.status,
          year: p.year,
          submittedDate: p.submitted_date,
          documentCount: parseInt(p.document_count) || 0,
          technologies: p.technologies ? p.technologies.split(',').map(t => t.trim()) : []
        }))
      };

      res.json({
        success: true,
        message: `Analytics for ${domain} domain retrieved successfully`,
        analytics
      });
    });
  } catch (error) {
    console.error('Error in domain analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred'
    });
  }
});

// Export analytics data as JSON (for backup or external analysis)
router.get('/export', authenticateToken, requireFaculty, (req, res) => {
  try {
    const exportQuery = `
      SELECT 
        p.id,
        p.title,
        p.abstract,
        p.domain,
        p.year,
        p.author_name,
        p.status,
        p.technologies,
        p.document_count,
        p.submitted_date,
        p.updated_date,
        GROUP_CONCAT(pd.original_name) as document_names
      FROM projects p
      LEFT JOIN project_documents pd ON p.id = pd.project_id
      GROUP BY p.id
      ORDER BY p.submitted_date DESC
    `;

    db.query(exportQuery, (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({
          success: false,
          message: 'Error exporting data'
        });
      }

      const exportData = {
        exportDate: new Date().toISOString(),
        totalRecords: results.length,
        data: results.map(project => ({
          ...project,
          technologies: project.technologies ? project.technologies.split(',').map(t => t.trim()) : [],
          documents: project.document_names ? project.document_names.split(',') : []
        }))
      };

      // Set headers for file download
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="project_data_export_${new Date().toISOString().split('T')[0]}.json"`);

      res.json(exportData);
    });
  } catch (error) {
    console.error('Error in data export:', error);
    res.status(500).json({
      success: false,
      message: 'Server error occurred during export'
    });
  }
});

module.exports = router;