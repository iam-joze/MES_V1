const express = require('express');

const operatorController = require('../controllers/operatorController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, requireRole('MANAGER'), operatorController.getAll);
router.post('/', authenticateToken, requireRole('MANAGER'), operatorController.create);
router.patch('/:id/status', authenticateToken, requireRole('MANAGER'), operatorController.setActiveStatus);

module.exports = router;