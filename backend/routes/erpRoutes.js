const express = require('express');

const erpController = require('../controllers/erpController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken, requireRole('ERP'));

/**
 * @swagger
 * /erp/work-orders:
 *   post:
 *     summary: Receive a work order from an external ERP system, creating a Job
 *     tags: [ERP Integration]
 *     security: [{ bearerAuth: [] }]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [externalWorkOrderId, name, targetQuantity, unit]
 *             properties:
 *               externalWorkOrderId: { type: string, description: "ERP's own work order ID, stored for de-duplication" }
 *               name: { type: string }
 *               productName: { type: string }
 *               targetQuantity: { type: integer }
 *               unit: { type: string }
 *               lineId: { type: string, format: uuid }
 *     responses:
 *       201:
 *         description: Job created from the work order
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/Job' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.post('/work-orders', erpController.receiveWorkOrder);

/**
 * @swagger
 * /erp/jobs/{id}/production-data:
 *   get:
 *     summary: Export completed production data for a job back to the ERP system
 *     tags: [ERP Integration]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Production data for the job (actual quantities, scrap, downtime)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 job: { $ref: '#/components/schemas/Job' }
 *                 scrapLogs:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/ScrapLog' }
 *                 downtimeLogs:
 *                   type: array
 *                   items: { $ref: '#/components/schemas/JobDowntimeLog' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.get('/jobs/:id/production-data', erpController.exportProductionData);

module.exports = router;