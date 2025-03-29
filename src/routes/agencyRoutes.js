// src/routes/agencyRoutes.js
const express = require('express');
const router = express.Router();
const agencyController = require('../controllers/agencyController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Admin only routes
router.get('/', protect, restrictTo('admin'), agencyController.getAllAgencies);
router.patch('/:id/verify', protect, restrictTo('admin'), agencyController.verifyAgency);
router.patch('/:id/toggle-status', protect, restrictTo('admin'), agencyController.toggleAgencyStatus);

// Public or protected routes
router.get('/:id', protect, agencyController.getAgencyById);

// Agency routes
router.put('/:id', protect, agencyController.updateAgencyProfile);
router.post('/verification-docs', protect, restrictTo('agency'), agencyController.submitVerificationDocs);
router.get('/:id/subscription', protect, agencyController.getAgencySubscription);
router.get('/:id/statistics', protect, agencyController.getAgencyStatistics);

module.exports = router;