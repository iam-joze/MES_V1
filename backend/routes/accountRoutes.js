const express = require('express');

const accountController = require('../controllers/accountController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, requireRole('EXECUTIVE'));

/**
 * @swagger
 * /executive/managers:
 *   get:
 *     summary: List all manager accounts
 *     tags: [Executive - Managers]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: List of managers
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/', accountController.listManagers);

/**
 * @swagger
 * /executive/managers:
 *   post:
 *     summary: Create a new manager account
 *     tags: [Executive - Managers]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email]
 *             properties:
 *               name: { type: string, example: "Nakato Aisha" }
 *               email: { type: string, example: "name@dojohubug.com" }
 *               phone: { type: string, example: "+256700000000" }
 *               lineId: { type: string, format: uuid, description: "Optional production line to assign" }
 *     responses:
 *       201:
 *         description: Manager created
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.post('/', accountController.createManager);

/**
 * @swagger
 * /executive/managers/{id}/deactivate:
 *   patch:
 *     summary: Deactivate a manager account
 *     tags: [Executive - Managers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Manager deactivated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.patch('/:id/deactivate', accountController.deactivateManager);

/**
 * @swagger
 * /executive/managers/{id}/activate:
 *   patch:
 *     summary: Reactivate a manager account
 *     tags: [Executive - Managers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Manager activated
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/User' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.patch('/:id/activate', accountController.activateManager);

/**
 * @swagger
 * /executive/managers/{id}:
 *   delete:
 *     summary: Permanently remove a manager account
 *     tags: [Executive - Managers]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Manager removed
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.delete('/:id', accountController.removeManager);

module.exports = router;