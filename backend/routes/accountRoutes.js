const express = require('express');

const accountController = require('../controllers/accountController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, requireRole('EXECUTIVE'));

router.get('/', accountController.listManagers);
router.post('/', accountController.createManager);
router.patch('/:id/deactivate', accountController.deactivateManager);

module.exports = router;
