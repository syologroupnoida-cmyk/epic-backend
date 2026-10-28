import { z } from 'zod';

const id = (field) => z.string({ required_error: `${field} is required` }).trim()
  .min(1, `${field} is required`).max(100, `${field} is invalid`);

const customerName = z.string({ required_error: 'customerName is required' }).trim()
  .min(2, 'customerName must be at least 2 characters long')
  .max(120, 'customerName must not exceed 120 characters');

const customerPhone = z.string({ required_error: 'customerPhone is required' }).trim()
  .regex(/^[6-9]\d{9}$/, 'customerPhone must be a valid 10-digit Indian mobile number');

const eventDate = z.coerce.date().refine((value) => !Number.isNaN(value.getTime()), 'eventDate is invalid').optional();

const optionalMessage = z.string().trim().min(3, 'message must be at least 3 characters long')
  .max(2000, 'message must not exceed 2000 characters').optional();

const optionalGuestCount = z.coerce.number().int().min(1, 'guestCount must be at least 1')
  .max(100000, 'guestCount is too large').optional();

const optionalBudget = (field) => z.coerce.number().int().min(0, `${field} must be zero or greater`)
  .max(100000000, `${field} is too large`).optional();

const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const directEnquirySchema = z.object({
  customerName,
  customerPhone,
  customerEmail: z.string().trim().email('customerEmail must be valid').max(254).optional(),
  eventDate,
  guestCount: optionalGuestCount,
  message: optionalMessage,
}).strict();

export const sharedLeadSchema = z.object({
  customerName,
  customerPhone,
  customerEmail: z.string().trim().email('customerEmail must be valid').max(254).optional(),
  cityId: id('cityId'),
  serviceSubcategoryId: id('serviceSubcategoryId'),
  eventDate,
  guestCount: optionalGuestCount,
  budgetMin: optionalBudget('budgetMin'),
  budgetMax: optionalBudget('budgetMax'),
  message: optionalMessage,
}).strict().superRefine((payload, ctx) => {
  if (payload.budgetMin !== undefined && payload.budgetMax !== undefined && payload.budgetMin > payload.budgetMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['budgetMax'],
      message: 'budgetMax must be greater than or equal to budgetMin',
    });
  }
});

export const leadIdParamsSchema = z.object({
  leadId: id('leadId'),
}).strict();

export const vendorLeadListQuerySchema = z.object(pageQuery).strict();

export const emptyLeadPurchaseSchema = z.object({}).strict();

export const adminLeadListQuerySchema = z.object({
  ...pageQuery,
  status: z.enum(['PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'SOLD_OUT', 'EXPIRED', 'CLOSED']).optional(),
  leadType: z.enum(['DIRECT', 'SHARED']).optional(),
  sourceType: z.enum(['VENDOR_PROFILE', 'SERVICE_LISTING', 'VENUE_PROPERTY', 'GET_QUOTES']).optional(),
  targetVendorUserId: id('targetVendorUserId').optional(),
  cityId: id('cityId').optional(),
  serviceSubcategoryId: id('serviceSubcategoryId').optional(),
}).strict();

const leadMoney = (field) => z.coerce.number().int().min(0, `${field} must be zero or greater`)
  .max(100000000, `${field} is too large`);

export const activateSharedLeadSchema = z.object({
  basePrice: leadMoney('basePrice'),
  maxBuyerCount: z.coerce.number().int().min(1, 'maxBuyerCount must be at least 1')
    .max(50, 'maxBuyerCount must not exceed 50'),
}).strict();

export const rejectLeadSchema = z.object({
  reason: z.string().trim().min(5, 'reason must be at least 5 characters long')
    .max(500, 'reason must not exceed 500 characters'),
}).strict();

export const closeLeadSchema = z.object({
  reason: z.string().trim().min(5, 'reason must be at least 5 characters long')
    .max(500, 'reason must not exceed 500 characters'),
}).strict();
