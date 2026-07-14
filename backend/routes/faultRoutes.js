const express = require('express');

const faultController = require('../controllers/faultController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/', authenticateToken, requireRole('MANAGER'), faultController.getAll);
router.patch('/:id/resolve', authenticateToken, requireRole('MANAGER'), faultController.resolve);

module.exports = router;