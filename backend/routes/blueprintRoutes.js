const express = require('express');

const blueprintController = require('../controllers/blueprintController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, requireRole('MANAGER'), blueprintController.getAll);
router.get('/:id', authenticateToken, requireRole('MANAGER'), blueprintController.getOne);
router.post('/', authenticateToken, requireRole('MANAGER'), blueprintController.create);
router.put('/:id', authenticateToken, requireRole('MANAGER'), blueprintController.update);
router.patch('/:id/archive', authenticateToken, requireRole('MANAGER'), blueprintController.archive);

module.exports = router;