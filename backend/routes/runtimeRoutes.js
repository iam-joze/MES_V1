const express = require('express');
const runtimeController = require('../controllers/runtimeController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticateToken, requireRole('OPERATOR'));

router.get('/assignments', runtimeController.getAssignments);
router.get('/stages/:id', runtimeController.getStageDetail);
router.post('/stages/:id/start', runtimeController.startStage);
router.post('/stages/:id/pause', runtimeController.pauseStage);
router.post('/stages/:id/resume', runtimeController.resumeStage);
router.post('/stages/:id/complete', runtimeController.completeStage);
router.get('/stages/:id/quantity', runtimeController.getQuantityLogs);
router.post('/stages/:id/quantity', runtimeController.logQuantity);
router.post('/stages/:id/qc', runtimeController.submitQc);
router.post('/stages/:id/faults', runtimeController.reportFault);

module.exports = router;
