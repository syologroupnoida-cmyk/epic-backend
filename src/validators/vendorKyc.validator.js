import { z } from 'zod';

const requiredText = (min, max, label) =>
  z.string({ required_error: `${label} is required` }).trim()
    .min(min, `${label} must be at least ${min} characters long`)
    .max(max, `${label} must not exceed ${max} characters`);

const uniqueIdArray = (label) => z.array(
  z.string().trim().min(1, `${label} must contain valid IDs`),
  { required_error: `${label} is required` },
).min(1, `Select at least one ${label}`).max(100, `You can select at most 100 ${label}`)
  .refine((ids) => new Set(ids).size === ids.length, `${label} must not contain duplicate IDs`);

export const documentNumberSchemas = {
  PAN: z.object({ number: z.string().trim().toUpperCase().regex(/^[A-Z]{5}[0-9]{4}[A-Z]$/, 'Invalid PAN format') }).strict(),
  AADHAR: z.object({ number: z.string().trim().regex(/^[0-9]{12}$/, 'Aadhaar must be 12 digits') }).strict(),
  GSTIN: z.object({ number: z.string().trim().toUpperCase().regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/, 'Invalid GSTIN format') }).strict(),
  CIN: z.object({ number: z.string().trim().toUpperCase().regex(/^[A-Z][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/, 'Invalid CIN format') }).strict(),
};

const optionalLink = z.string().trim().max(500).optional();

// Accept the public-form field names while normalizing them to the canonical
// serviceCategoryIds/serviceSubcategoryIds names used by the service layer.
export const submitKycSchema = z.object({
  servicecategoriesIds: uniqueIdArray('service categories').optional(),
  servicesSubCategoryIds: uniqueIdArray('service subcategories').optional(),
  serviceCategoryIds: uniqueIdArray('service categories').optional(),
  serviceSubcategoryIds: uniqueIdArray('service subcategories').optional(),
  companyName: requiredText(2, 100, 'Company name'),
  contactPerson: requiredText(2, 100, 'Contact person'),
  logoName: z.string().trim().min(1).max(255).nullable().optional(),
  description: requiredText(2, 2000, 'Description'),
  whatsappNumber: z.string().trim().regex(/^\d{10,15}$/, 'WhatsApp number must be 10 to 15 digits').optional(),
  primaryOperatingCity: requiredText(2, 100, 'Primary operating city').optional(),
  businessAddress: z.object({
    street: requiredText(2, 200, 'Street'),
    locality: requiredText(2, 100, 'Locality'),
    state: requiredText(2, 100, 'State'),
    pincode: z.string({ required_error: 'Pincode is required' }).trim()
      .regex(/^\d{6}$/, 'Pincode must be exactly 6 digits'),
  }).strict(),
  socialLinks: z.object({
    facebook: optionalLink,
    instagram: optionalLink,
  }).strict(),
  verified: z.object({
    aadhaar: z.boolean(),
    pan: z.boolean(),
    cin: z.boolean(),
    gst: z.boolean(),
  }).strict(),
  source: z.array(z.string().trim().min(1).max(100)).min(1).max(20),
  sourceNote: z.string().trim().max(500).optional().default(''),
}).strict().superRefine((data, ctx) => {
  if (data.servicecategoriesIds && data.serviceCategoryIds) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['servicecategoriesIds'], message: 'Send only one category ID field name' });
  }
  if (data.servicesSubCategoryIds && data.serviceSubcategoryIds) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['servicesSubCategoryIds'], message: 'Send only one subcategory ID field name' });
  }
  if (!data.servicecategoriesIds && !data.serviceCategoryIds) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['servicecategoriesIds'], message: 'servicecategoriesIds is required' });
  }
  if (!data.servicesSubCategoryIds && !data.serviceSubcategoryIds) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['servicesSubCategoryIds'], message: 'servicesSubCategoryIds is required' });
  }
}).transform(({ servicecategoriesIds, servicesSubCategoryIds, ...data }) => ({
  ...data,
  serviceCategoryIds: servicecategoriesIds ?? data.serviceCategoryIds,
  serviceSubcategoryIds: servicesSubCategoryIds ?? data.serviceSubcategoryIds,
}));

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
