import express from "express";
import { sendOtp, verifyOtp } from "../controllers/otp.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Auth OTP
 *   description: Universal OTP sending and verification endpoints
 */

/**
 * @swagger
 * /otp/send:
 *   post:
 *     summary: Send OTP
 *     tags: [Auth OTP]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP Sent successfully
 */
router.post("/send", sendOtp);

/**
 * @swagger
 * /otp/verify:
 *   post:
 *     summary: Verify OTP
 *     tags: [Auth OTP]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP Verified successfully
 */
router.post("/verify", verifyOtp);

export default router;
