import { z } from 'zod';

const id = z.string().trim().min(1, 'messageId is required').max(100, 'messageId is invalid');

const phone = z.string().trim().regex(/^[6-9]\d{9}$/, 'phone must be a valid 10-digit Indian mobile number');

const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const createContactMessageSchema = z.object({
  name: z.string().trim().min(2, 'name must be at least 2 characters long').max(120),
  email: z.string().trim().email('email must be valid').max(254).optional(),
  phone: phone.optional(),
  userType: z.enum(['CLIENT', 'VENDOR', 'GENERAL']).default('GENERAL'),
  subject: z.string().trim().min(3, 'subject must be at least 3 characters long').max(160),
  message: z.string().trim().min(10, 'message must be at least 10 characters long').max(4000),
  // Honeypot: website must stay empty. Real users never see this input.
  website: z.string().max(0, 'Invalid submission.').optional(),
}).strict().superRefine((payload, ctx) => {
  if (!payload.email && !payload.phone) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['email'], message: 'Provide at least one of email or phone.' });
  }
});

export const contactMessageIdParamsSchema = z.object({ messageId: id }).strict();

export const adminContactMessageListQuerySchema = z.object({
  ...pageQuery,
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  userType: z.enum(['CLIENT', 'VENDOR', 'GENERAL']).optional(),
  search: z.string().trim().min(1).max(120).optional(),
}).strict();

export const updateContactMessageSchema = z.object({
  status: z.enum(['NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']).optional(),
  adminNote: z.string().trim().min(1).max(2000).nullable().optional(),
}).strict().refine((payload) => Object.keys(payload).length > 0, 'Provide status or adminNote.');
