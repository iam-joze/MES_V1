const express = require('express');

const faultController = require('../controllers/faultController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /faults:
 *   get:
 *     summary: List fault reports (optionally filter by resolved status)
 *     tags: [Faults]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: query
 *         name: resolved
 *         schema: { type: boolean }
 *         description: Filter to only resolved (true) or unresolved (false) faults
 *     responses:
 *       200:
 *         description: List of faults
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/FaultLog' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/', authenticateToken, requireRole('MANAGER'), faultController.getAll);

/**
 * @swagger
 * /faults/{id}/resolve:
 *   patch:
 *     summary: Mark a fault as resolved
 *     tags: [Faults]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               resolutionNotes: { type: string }
 *     responses:
 *       200:
 *         description: Fault resolved
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FaultLog' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.patch('/:id/resolve', authenticateToken, requireRole('MANAGER'), faultController.resolve);

module.exports = router;