// routes/platformStatistics.js
const express = require('express');
const router = express.Router();
const platformStatisticsController = require('../controllers/platformStatisticsController');
const { authenticate, authorize } = require('../middleware/auth');

// Generate platform statistics report
router.get('/platform/stats/generate', 
  authenticate, 
  authorize(['admin']), 
  platformStatisticsController.generateReport
);

// Update platform statistics
router.put('/platform/stats/:id', 
  authenticate, 
  authorize(['admin']), 
  platformStatisticsController.updateStats
);

// Calculate growth metrics
router.get('/platform/stats/growth', 
  authenticate, 
  authorize(['admin']), 
  platformStatisticsController.calculateGrowth
);

module.exports = router;