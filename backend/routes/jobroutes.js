const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');
const jobController = require('../controllers/jobcontroller');

router.use(authenticateToken, requireRole('MANAGER'));

router.post('/', jobController.createJob);
router.get('/:id', jobController.getJob);
router.put('/:id', jobController.updateJob);

module.exports = router;