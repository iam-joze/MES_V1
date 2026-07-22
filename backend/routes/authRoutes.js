const express = require('express');

const authController = require('../controllers/authController');

const router = express.Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in as Executive, Manager, Operator, or ERP
 *     tags: [Auth]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema: { $ref: '#/components/schemas/LoginRequest' }
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/LoginResponse' }
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema: { $ref: '#/components/schemas/ErrorResponse' }
 */
router.post('/login', authController.login);

module.exports = router;