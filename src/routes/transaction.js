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
 *     summary: Create a Razorpay order
 *     tags: [Payment & Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Amount in INR (will be converted to paise internally)
 *                 example: 499
 *     responses:
 *       200:
 *         description: Order created successfully
 *       400:
 *         description: Invalid amount
 *       500:
 *         description: Failed to create order
 */
router.post("/create-order", createRazorpayOrder);

/**
 * @swagger
 * /transaction/verify-payment:
 *   post:
 *     summary: Verify a Razorpay payment and credit vendor wallet
 *     tags: [Payment & Transactions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - razorpay_order_id
 *               - razorpay_payment_id
 *               - razorpay_signature
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *                 description: Order ID returned by Razorpay during order creation
 *               razorpay_payment_id:
 *                 type: string
 *                 description: Payment ID returned by Razorpay after payment
 *               razorpay_signature:
 *                 type: string
 *                 description: HMAC-SHA256 signature for payment verification
 *     responses:
 *       200:
 *         description: Payment verified and wallet credited successfully
 *       400:
 *         description: Missing required fields or invalid signature
 *       404:
 *         description: Vendor not found
 */
router.post("/verify-payment", verifyRazorpayPayment);

export default router;
