'use strict';

const express = require('express');
const ReviewController = require('../controllers/ReviewController');
const { protect, restrictTo } = require('../middlewares/authMiddleware');
const multer = require('multer');
const upload = multer({ dest: 'uploads/reviews/' }); // Temporary storage

const router = express.Router();

// Public routes
router.get('/car/:carId', ReviewController.getCarReviews);

// Protected routes (User must be authenticated)
router.post('/', protect, upload.array('images', 5), ReviewController.createReview);
router.put('/:id', protect, upload.array('images', 5), ReviewController.updateReview);
router.delete('/:id', protect, ReviewController.deleteReview);

// Admin routes
router.patch('/moderate/:id', protect, restrictTo('admin'), ReviewController.moderateReview);

module.exports = router;
