'use strict';

const express = require('express');
const router = express.Router();
const ReservationController = require('../controllers/ReservationController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');

// Create a new reservation
router.post('/create', protect, restrictTo('customer'), ReservationController.createReservation);

// Get reservation by ID
router.get('/:id', protect, ReservationController.getReservationById);

// Cancel reservation
router.patch('/:id/cancel', protect, ReservationController.cancelReservation);

// Generate contract for a reservation
router.post('/:id/contract', protect, ReservationController.generateContract);

module.exports = router;