const express = require('express');

const authController = require('../controllers/authController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', authController.login);
router.post('/register-manager', authenticateToken, requireRole('EXECUTIVE'), authController.registerManager);

module.exports = router;