import { z } from 'zod';

const id = z.string().trim().min(1).max(100);

export const paymentIdParamsSchema = z.object({ paymentId: id }).strict();
export const razorpayVerifySchema = z.object({
  razorpay_order_id: z.string().trim().min(1).max(100),
  razorpay_payment_id: z.string().trim().min(1).max(100),
  razorpay_signature: z.string().trim().regex(/^[a-f0-9]{64}$/i, 'Invalid Razorpay signature format.'),
}).strict();
