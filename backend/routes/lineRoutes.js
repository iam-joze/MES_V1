const express = require('express');

const lineController = require('../controllers/lineController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, requireRole('EXECUTIVE'));

/**
 * @swagger
 * /executive/lines:
 *   get:
 *     summary: List all production lines
 *     tags: [Executive - Lines]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of production lines
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/ProductionLine' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/', lineController.listLines);

/**
 * @swagger
 * /executive/lines:
 *   post:
 *     summary: Create a new production line
 *     tags: [Executive - Lines]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductionLine' }
 *     responses:
 *       201:
 *         description: Line created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProductionLine' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.post('/', lineController.createLine);

/**
 * @swagger
 * /executive/lines/{id}:
 *   patch:
 *     summary: Update a production line's details
 *     tags: [Executive - Lines]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/ProductionLine' }
 *     responses:
 *       200:
 *         description: Line updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProductionLine' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.patch('/:id', lineController.updateLine);

/**
 * @swagger
 * /executive/lines/{id}/manager:
 *   patch:
 *     summary: Assign or reassign the manager for a production line
 *     tags: [Executive - Lines]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [managerId]
 *             properties:
 *               managerId: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Manager assigned
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ProductionLine' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.patch('/:id/manager', lineController.assignManager);

module.exports = router;