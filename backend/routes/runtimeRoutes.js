const express = require('express');
const runtimeController = require('../controllers/runtimeController');
const { authenticateToken, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(authenticateToken, requireRole('OPERATOR'));

/**
 * @swagger
 * /operator/assignments:
 *   get:
 *     summary: "O1 — List stages assigned to the logged-in operator"
 *     tags: [Operator Runtime]
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Assigned stages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/JobStage' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 */
router.get('/assignments', runtimeController.getAssignments);

/**
 * @swagger
 * /operator/stages/{id}:
 *   get:
 *     summary: "O2 — Full stage detail (guidelines, checklist, quantity, QC)"
 *     tags: [Operator Runtime]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stage detail
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/JobStage' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403:
 *         description: Forbidden — wrong role, or stage not assigned to this operator
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.get('/stages/:id', runtimeController.getStageDetail);

/**
 * @swagger
 * /operator/stages/{id}/start:
 *   post:
 *     summary: "O2 — Start a stage (AVAILABLE → RUNNING), opens a ProcessSession"
 *     tags: [Operator Runtime]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stage started
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/JobStage' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *       409:
 *         description: Stage is not in AVAILABLE status
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/stages/:id/start', runtimeController.startStage);

/**
 * @swagger
 * /operator/stages/{id}/pause:
 *   post:
 *     summary: "O2 — Pause a running stage"
 *     tags: [Operator Runtime]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stage paused
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/JobStage' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *       409:
 *         description: Stage is not RUNNING
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/stages/:id/pause', runtimeController.pauseStage);

/**
 * @swagger
 * /operator/stages/{id}/resume:
 *   post:
 *     summary: "O2 — Resume a paused stage"
 *     tags: [Operator Runtime]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stage resumed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/JobStage' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *       409:
 *         description: Stage is not PAUSED
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/stages/:id/resume', runtimeController.resumeStage);

/**
 * @swagger
 * /operator/stages/{id}/complete:
 *   post:
 *     summary: "O2 — Complete a stage (closes the ProcessSession), enforcing required checklist items"
 *     tags: [Operator Runtime]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Stage completed
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/JobStage' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *       422:
 *         description: Required checklist items are not yet complete
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/stages/:id/complete', runtimeController.completeStage);

/**
 * @swagger
 * /operator/stages/{id}/quantity:
 *   get:
 *     summary: "O2 — List batch entries logged for the stage's active session"
 *     tags: [Operator Runtime]
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Batch entries
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items: { $ref: '#/components/schemas/BatchEntry' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.get('/stages/:id/quantity', runtimeController.getQuantityLogs);

/**
 * @swagger
 * /operator/stages/{id}/quantity:
 *   post:
 *     summary: "O2 — Log a batch entry (Units Filled/Rejected etc.)"
 *     tags: [Operator Runtime]
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
 *             required: [quantityData]
 *             properties:
 *               quantityData:
 *                 type: object
 *                 additionalProperties: { type: number }
 *                 example: { "Units Filled": 25, "Units Rejected": 18 }
 *               notes: { type: string }
 *     responses:
 *       201:
 *         description: Batch logged
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/BatchEntry' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 *       409:
 *         description: No active session for this stage
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/stages/:id/quantity', runtimeController.logQuantity);

/**
 * @swagger
 * /operator/stages/{id}/qc:
 *   post:
 *     summary: "O2 — Submit a Quality Control response for this stage"
 *     tags: [Operator Runtime]
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
 *             required: [questionId]
 *             properties:
 *               questionId: { type: string, format: uuid, description: "BlueprintQcQuestion id" }
 *               responseText: { type: string }
 *               passed: { type: boolean, description: "Used for pass_fail question types" }
 *     responses:
 *       201:
 *         description: QC response recorded
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/QcResponse' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.post('/stages/:id/qc', runtimeController.submitQc);

/**
 * @swagger
 * /operator/stages/{id}/faults:
 *   post:
 *     summary: "O3 — Report a fault/issue against this stage. The process keeps running."
 *     tags: [Operator Runtime]
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
 *             required: [category, severity]
 *             properties:
 *               category: { type: string, example: "Seal Integrity Failure" }
 *               severity: { type: string, enum: [CRITICAL, MINOR] }
 *               description: { type: string }
 *               photoUrl: { type: string, nullable: true }
 *     responses:
 *       201:
 *         description: Fault reported
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/FaultLog' }
 *       401: { $ref: '#/components/responses/UnauthorizedError' }
 *       403: { $ref: '#/components/responses/ForbiddenError' }
 *       404: { $ref: '#/components/responses/NotFoundError' }
 */
router.post('/stages/:id/faults', runtimeController.reportFault);

module.exports = router;