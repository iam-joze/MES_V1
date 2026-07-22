const express = require('express');

const operatorController = require('../controllers/operatorController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

/**
 * @swagger
 * /operators:
 *   get:
 *     summary: List all operator accounts (Manager view — account admin, not runtime)
 *     tags: [Manager - Operator Accounts]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Operator accounts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/', authenticateToken, requireRole('MANAGER'), operatorController.getAll);

/**
 * @swagger
 * /operators:
 *   post:
 *     summary: Register a new operator account (phone + 4-digit PIN + skills)
 *     tags: [Manager - Operator Accounts]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, phone, pin]
 *             properties:
 *               name: { type: string }
 *               phone: { type: string, example: "+256700000000" }
 *               pin: { type: string, example: "1234", description: "4-digit login PIN" }
 *               skills:
 *                 type: array
 *                 items: { type: string }
 *                 example: ["Pasteurization", "QC Certified"]
 *     responses:
 *       201:
 *         description: Operator created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.post('/', authenticateToken, requireRole('MANAGER'), operatorController.create);

/**
 * @swagger
 * /operators/{id}/status:
 *   patch:
 *     summary: Activate or suspend an operator account
 *     tags: [Manager - Operator Accounts]
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
 *             required: [isActive]
 *             properties:
 *               isActive: { type: boolean }
 *     responses:
 *       200:
 *         description: Status updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.patch('/:id/status', authenticateToken, requireRole('MANAGER'), operatorController.setActiveStatus);

/**
 * @swagger
 * /operators/{id}:
 *   patch:
 *     summary: Update an operator's name, phone, or skills
 *     tags: [Manager - Operator Accounts]
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
 *               name: { type: string }
 *               phone: { type: string }
 *               skills: { type: array, items: { type: string } }
 *     responses:
 *       200:
 *         description: Operator updated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.patch('/:id', authenticateToken, requireRole('MANAGER'), operatorController.update);

/**
 * @swagger
 * /operators/{id}/pin:
 *   patch:
 *     summary: Reset an operator's login PIN
 *     tags: [Manager - Operator Accounts]
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
 *             required: [pin]
 *             properties:
 *               pin: { type: string, example: "5678" }
 *     responses:
 *       200:
 *         description: PIN reset
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.patch('/:id/pin', authenticateToken, requireRole('MANAGER'), operatorController.resetPin);

/**
 * @swagger
 * /operators/{id}:
 *   delete:
 *     summary: Permanently remove an operator account
 *     tags: [Manager - Operator Accounts]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Operator removed
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.delete('/:id', authenticateToken, requireRole('MANAGER'), operatorController.remove);

module.exports = router;