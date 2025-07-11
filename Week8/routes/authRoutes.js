const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validate = require('../middleware/validationMiddleware');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.post('/register', validate('userCreate'), authController.register);
router.post('/login', authController.login);

// Protected routes
router.get('/me', protect, authController.getMe);

module.exports = router;