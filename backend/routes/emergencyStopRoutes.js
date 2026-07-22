const express = require('express');

const emergencyStopController = require('../controllers/emergencyStopController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /emergency-stop/active-jobs:
 *   get:
 *     summary: List jobs currently active (eligible for emergency stop)
 *     tags: [Emergency Stop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Active jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Job' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/active-jobs', authenticateToken, requireRole('MANAGER'), emergencyStopController.getActiveJobs);

/**
 * @swagger
 * /emergency-stop/paused-jobs:
 *   get:
 *     summary: List jobs currently paused due to an emergency stop
 *     tags: [Emergency Stop]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Paused jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Job' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/paused-jobs', authenticateToken, requireRole('MANAGER'), emergencyStopController.getPausedJobs);

/**
 * @swagger
 * /emergency-stop:
 *   post:
 *     summary: Trigger an emergency stop (facility-wide or a single active job)
 *     tags: [Emergency Stop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [scope, reason]
 *             properties:
 *               scope: { type: string, enum: [FACILITY_WIDE, SINGLE_JOB], example: FACILITY_WIDE }
 *               jobId: { type: string, format: uuid, description: "Required when scope is SINGLE_JOB" }
 *               reason: { type: string, example: "equipment_malfunction" }
 *               details: { type: string }
 *     responses:
 *       200:
 *         description: Emergency stop activated
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.post('/', authenticateToken, requireRole('MANAGER'), emergencyStopController.triggerStop);

/**
 * @swagger
 * /emergency-stop/resume:
 *   post:
 *     summary: Resume production halted by an emergency stop
 *     tags: [Emergency Stop]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [jobId]
 *             properties:
 *               jobId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Production resumed
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.post('/resume', authenticateToken, requireRole('MANAGER'), emergencyStopController.resumeStop);

module.exports = router;