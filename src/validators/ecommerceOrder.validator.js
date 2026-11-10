import { z } from 'zod';

const id = z.string().trim().min(1).max(100);
const reason = z.string().trim().min(3).max(500);

export const orderIdParamsSchema = z.object({ orderId: id }).strict();
export const checkoutSchema = z.object({ addressId: id }).strict();
export const orderListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: z.enum(['PAYMENT_PENDING', 'PAID', 'PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'RETURN_REQUESTED', 'RETURNED', 'REFUNDED', 'PAYMENT_EXPIRED']).optional(),
  userId: id.optional(),
}).strict();
export const cancelOrderSchema = z.object({ reason: reason.optional() }).strict();
export const returnRequestSchema = z.object({ reason }).strict();
export const fulfilmentSchema = z.object({
  status: z.enum(['PROCESSING', 'PACKED', 'SHIPPED', 'DELIVERED', 'RETURNED', 'REFUNDED']),
  courierName: z.string().trim().min(1).max(120).optional(),
  trackingNumber: z.string().trim().min(1).max(150).optional(),
  trackingUrl: z.string().trim().url().max(1000).optional(),
}).strict().superRefine((value, context) => {
  if (value.status === 'SHIPPED' && (!value.courierName || !value.trackingNumber)) {
    context.addIssue({ code: z.ZodIssueCode.custom, message: 'courierName and trackingNumber are required when shipping an order.', path: ['trackingNumber'] });
  }
});
