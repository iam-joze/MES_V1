const express = require('express');

const managerController = require('../controllers/managerController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/lines', authenticateToken, requireRole('MANAGER'), managerController.getLines);
router.get('/metrics', authenticateToken, requireRole('MANAGER'), managerController.getMetrics);

module.exports = router;