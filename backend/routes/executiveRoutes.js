const express = require('express');

const executiveController = require('../controllers/executiveController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/overview', authenticateToken, requireRole('EXECUTIVE'), executiveController.getOverview);

module.exports = router;
