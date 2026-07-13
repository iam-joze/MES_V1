const express = require('express');

const lineController = require('../controllers/lineController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, requireRole('EXECUTIVE'));

router.get('/', lineController.listLines);
router.post('/', lineController.createLine);
router.patch('/:id', lineController.updateLine);
router.patch('/:id/manager', lineController.assignManager);

module.exports = router;
