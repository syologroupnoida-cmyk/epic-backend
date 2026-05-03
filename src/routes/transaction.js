import { Router } from "express";
import {
  createRazorpayOrder,
  getRazorpayKey,
  verifyRazorpayPayment,
} from "../controllers/transaction.js";
import { getVendorHeaders } from "../middlewares/authMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Payment & Transactions
 *   description: Razorpay order generation and verification
 */

router.use(getVendorHeaders);

/**
 * @swagger
 * /transaction/get-razorpay-key:
 *   get:
 *     summary: Get Razorpay publishable key
 *     tags: [Payment & Transactions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Razorpay key retrieved
 */
router.get("/get-razorpay-key", getRazorpayKey);

/**
 * @swagger
 * /transaction/create-order:
 *   post:
 *     summary: Create a Razorpay Order
 *     tags: [Payment & Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Order created successfully
 */
router.post("/create-order", createRazorpayOrder);

/**
 * @swagger
 * /transaction/verify-payment:
 *   post:
 *     summary: Verify a Razorpay Payment
 *     tags: [Payment & Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified successfully
 */
router.post("/verify-payment", verifyRazorpayPayment);

export default router;
