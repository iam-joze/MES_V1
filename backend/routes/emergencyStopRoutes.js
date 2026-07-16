const express = require('express');

const emergencyStopController = require('../controllers/emergencyStopController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/active-jobs', authenticateToken, requireRole('MANAGER'), emergencyStopController.getActiveJobs);
router.get('/paused-jobs', authenticateToken, requireRole('MANAGER'), emergencyStopController.getPausedJobs);
router.post('/', authenticateToken, requireRole('MANAGER'), emergencyStopController.triggerStop);
router.post('/resume', authenticateToken, requireRole('MANAGER'), emergencyStopController.resumeStop);

module.exports = router;