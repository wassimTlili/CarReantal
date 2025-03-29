'use strict';

const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/SubscriptionController');
const subscriptionPlanController = require('../controllers/SubscriptionPlanController ');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Subscription Plan Routes
router.get('/plans', subscriptionPlanController.getAllPlans);
router.get('/plans/:id', subscriptionPlanController.getPlanById);
router.post('/plans', protect, restrictTo('admin'), subscriptionPlanController.createPlan);
router.put('/plans/:id', protect, restrictTo('admin'), subscriptionPlanController.updatePlan);
router.delete('/plans/:id', protect, restrictTo('admin'), subscriptionPlanController.deletePlan);

// Subscription Routes
router.get('/', protect, subscriptionController.getAllSubscriptions);
router.get('/:id', protect, subscriptionController.getSubscriptionById);
router.post('/', protect, subscriptionController.createSubscription);
router.put('/:id', protect, subscriptionController.updateSubscription);
router.put('/:id/cancel', protect, subscriptionController.cancelSubscription);
router.put('/:id/renew', protect, subscriptionController.renewSubscription);

module.exports = router;
