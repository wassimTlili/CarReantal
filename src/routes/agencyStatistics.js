// routes/agencyStatistics.js
const express = require('express');
const router = express.Router();
const agencyStatisticsController = require('../controllers/agencyStatisticsController');
const { authenticate, authorize } = require('../middleware/auth');

// Generate statistics report for an agency
router.get('/agency/:agencyId/stats/generate', 
  authenticate, 
  authorize(['admin', 'agency']), 
  agencyStatisticsController.generateReport
);

// Calculate performance metrics
router.get('/agency/:agencyId/stats/performance', 
  authenticate, 
  authorize(['admin', 'agency']), 
  agencyStatisticsController.calculatePerformanceMetrics
);

module.exports = router;