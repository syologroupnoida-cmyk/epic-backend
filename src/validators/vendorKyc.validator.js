import { z } from 'zod';

const requiredText = (min, max, label) =>
  z.string({ required_error: `${label} is required` }).trim()
    .min(min, `${label} must be at least ${min} characters long`)
    .max(max, `${label} must not exceed ${max} characters`);

export const documentNumberSchemas = {
  PAN: z.object({ number: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format') }).strict(),
  AADHAR: z.object({ number: z.string().trim().regex(/^[0-9]{12}$/, 'Aadhaar must be 12 digits') }).strict(),
  GSTIN: z.object({ number: z.string().trim().toUpperCase().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Invalid GSTIN format') }).strict(),
  CIN: z.object({ number: z.string().trim().toUpperCase().regex(/^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/, 'Invalid CIN format') }).strict(),
};

// Registration already captures contact name, mobile, email, and password.
export const submitKycSchema = z.object({
  businessName: requiredText(2, 100, 'Business or brand name'),
  whatsappNumber: z.string({ required_error: 'WhatsApp number is required' }).trim()
    .regex(/^\d{10,15}$/, 'WhatsApp number must be 10 to 15 digits'),
  primaryOperatingCity: requiredText(2, 100, 'Primary operating city'),
  businessAddress: z.object({
    street: requiredText(2, 200, 'Street'),
    locality: requiredText(2, 100, 'Locality'),
    state: requiredText(2, 100, 'State'),
    pincode: z.string({ required_error: 'Pincode is required' }).trim()
      .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  }).strict(),
}).strict();

export const rejectKycSchema = z.object({
  reason: requiredText(5, 500, 'Rejection reason'),
}).strict();

export const listKycQuerySchema = z.object({
  status: z.enum(['PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED']).optional(),
  take: z.coerce.number().int().min(1).max(100).optional(),
  skip: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(0).optional(),
  size: z.coerce.number().int().min(1).max(100).optional(),
}).strict().transform((q) => {
  const take = q.size ?? q.take ?? 20;
  const skip = q.page !== undefined ? q.page * take : q.skip ?? 0;
  return { status: q.status, take, skip };
});
