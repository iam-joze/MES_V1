const express = require('express');

const erpController = require('../controllers/erpController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, requireRole('ERP'));

router.post('/work-orders', erpController.receiveWorkOrder);
router.get('/jobs/:id/production-data', erpController.exportProductionData);

module.exports = router;
