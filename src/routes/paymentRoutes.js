// Payment Routes (updated)
'use strict';

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/PaymentController ');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Payment Routes
router.post('/create', protect, paymentController.createPayment);
router.get('/:id', protect, paymentController.getPaymentById);
router.get('/subscription/:subscriptionId', protect, paymentController.getPaymentsBySubscription);
router.post('/:id/refund', protect, paymentController.processRefund);

// Stripe Webhook
router.post('/webhook', paymentController.handleStripeWebhook);

module.exports = router;