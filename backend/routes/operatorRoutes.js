const express = require('express');

const operatorController = require('../controllers/operatorController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, requireRole('MANAGER'), operatorController.getAll);
router.post('/', authenticateToken, requireRole('MANAGER'), operatorController.create);
router.patch('/:id/status', authenticateToken, requireRole('MANAGER'), operatorController.setActiveStatus);
router.patch('/:id', authenticateToken, requireRole('MANAGER'), operatorController.update);
router.patch('/:id/pin', authenticateToken, requireRole('MANAGER'), operatorController.resetPin);
router.delete('/:id', authenticateToken, requireRole('MANAGER'), operatorController.remove);

module.exports = router;