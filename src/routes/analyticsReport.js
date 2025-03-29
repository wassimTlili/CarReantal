// routes/analyticsReport.js
const express = require('express');
const router = express.Router();
const analyticsReportController = require('../controllers/analyticsReportController');
const { authenticate, authorize } = require('../middleware/auth');

// Generate a new analytics report
router.post('/analytics/reports', 
  authenticate, 
  authorize(['admin', 'agency']), 
  analyticsReportController.generateReport
);

// Export a report in different formats
router.get('/analytics/reports/:id/export', 
  authenticate, 
  authorize(['admin', 'agency']), 
  analyticsReportController.exportReport
);

// Compare agency performance with platform average
router.get('/analytics/agency/:agencyId/compare', 
  authenticate, 
  authorize(['admin', 'agency']), 
  analyticsReportController.comparePerformance
);

// Calculate discount based on report data
router.post('/analytics/reports/:reportId/discount', 
  authenticate, 
  authorize(['admin', 'agency']), 
  analyticsReportController.calculateDiscount
);

module.exports = router;