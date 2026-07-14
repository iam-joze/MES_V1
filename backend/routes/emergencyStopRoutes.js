const express = require('express');

const emergencyStopController = require('../controllers/emergencyStopController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/active-jobs', authenticateToken, requireRole('MANAGER'), emergencyStopController.getActiveJobs);
router.post('/', authenticateToken, requireRole('MANAGER'), emergencyStopController.triggerStop);

module.exports = router;