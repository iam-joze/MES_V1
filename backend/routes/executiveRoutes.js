const express = require('express');

const executiveController = require('../controllers/executiveController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /executive/overview:
 *   get:
 *     summary: Strategic overview — active lines, managers, monthly volume target, critical alerts
 *     tags: [Executive]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Overview metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 activeLineCount: { type: integer }
 *                 activeManagerCount: { type: integer }
 *                 monthlyVolumeTargetPct: { type: integer }
 *                 unassignedLines:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ProductionLine' }
 *                 criticalAlerts:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/FaultLog' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/overview', authenticateToken, requireRole('EXECUTIVE'), executiveController.getOverview);

/**
 * @swagger
 * /executive/jobs:
 *   get:
 *     summary: List all jobs across the facility, for Executive review
 *     tags: [Executive]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: All jobs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/Job' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/jobs', authenticateToken, requireRole('EXECUTIVE'), executiveController.getJobs);

/**
 * @swagger
 * /executive/analytics:
 *   get:
 *     summary: Historical production analytics (job timelines, downtime/faults, scrap, operator output)
 *     tags: [Executive]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: from
 *         schema: { type: string, format: date }
 *       - in: query
 *         name: to
 *         schema: { type: string, format: date }
 *     responses:
 *       200:
 *         description: Analytics payload
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/analytics', authenticateToken, requireRole('EXECUTIVE'), executiveController.getAnalytics);

module.exports = router;