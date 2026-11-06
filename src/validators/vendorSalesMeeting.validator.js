import { z } from 'zod';

const id = z.string().trim().min(1, 'meetingId is required').max(100, 'meetingId is invalid');
const meetingStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW'];
const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};
const meetingDate = (field) => z.coerce.date({ required_error: `${field} is required` })
  .refine((value) => !Number.isNaN(value.getTime()), `${field} is invalid`);
const note = z.string().trim().min(3).max(2000);

export const vendorSalesMeetingIdParamsSchema = z.object({ meetingId: id }).strict();

export const createVendorSalesMeetingSchema = z.object({
  requestedStartAt: meetingDate('requestedStartAt'),
  requestedEndAt: meetingDate('requestedEndAt'),
  vendorNote: note.optional(),
}).strict().superRefine((payload, ctx) => {
  if (payload.requestedEndAt <= payload.requestedStartAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['requestedEndAt'], message: 'requestedEndAt must be after requestedStartAt.' });
  }
  if (payload.requestedStartAt <= new Date()) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['requestedStartAt'], message: 'Choose a future meeting time.' });
  }
});

export const vendorSalesMeetingListQuerySchema = z.object({
  ...pageQuery,
  status: z.enum(meetingStatuses).optional(),
}).strict();

export const adminSalesMeetingListQuerySchema = z.object({
  ...pageQuery,
  status: z.enum(meetingStatuses).optional(),
  vendorUserId: z.string().trim().min(1).max(100).optional(),
}).strict();

export const reviewVendorSalesMeetingSchema = z.object({
  status: z.enum(['CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW']),
  scheduledStartAt: meetingDate('scheduledStartAt').optional(),
  scheduledEndAt: meetingDate('scheduledEndAt').optional(),
  vendorMessage: note.optional(),
  adminNote: note.optional(),
}).strict().superRefine((payload, ctx) => {
  if (payload.status === 'CONFIRMED') {
    if (!payload.scheduledStartAt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledStartAt'], message: 'scheduledStartAt is required when confirming.' });
    if (!payload.scheduledEndAt) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledEndAt'], message: 'scheduledEndAt is required when confirming.' });
  }
  if (payload.scheduledStartAt && payload.scheduledEndAt && payload.scheduledEndAt <= payload.scheduledStartAt) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledEndAt'], message: 'scheduledEndAt must be after scheduledStartAt.' });
  }
  if (payload.status === 'REJECTED' && !payload.vendorMessage) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['vendorMessage'], message: 'vendorMessage is required when rejecting.' });
  }
});
