const express = require('express');

const managerController = require('../controllers/managerController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/lines', authenticateToken, requireRole('MANAGER'), managerController.getLines);
router.get('/metrics', authenticateToken, requireRole('MANAGER'), managerController.getMetrics);
router.get('/jobs', authenticateToken, requireRole('MANAGER'), managerController.getActiveJobs);
router.get('/alerts', authenticateToken, requireRole('MANAGER'), managerController.getAlerts);
router.patch('/faults/:id/resolve', authenticateToken, requireRole('MANAGER'), managerController.resolveFault);
router.get('/operators', authenticateToken, requireRole('MANAGER'), managerController.getOperators);
router.get('/search', authenticateToken, requireRole('MANAGER'), managerController.search);

module.exports = router;