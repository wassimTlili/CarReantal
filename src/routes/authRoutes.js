// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middlewares/authMiddleware');

// Public routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/password-reset-request', authController.requestPasswordReset);

// Protected routes
router.get('/profile', protect, authController.getProfile);
router.put('/update-password', protect, authController.updatePassword);

module.exports = router;    