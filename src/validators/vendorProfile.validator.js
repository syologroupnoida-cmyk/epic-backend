import { z } from 'zod';

const nullableTrimmedText = (min, max, label) =>
  z.string().trim()
    .min(min, `${label} must be at least ${min} characters long`)
    .max(max, `${label} must not exceed ${max} characters`)
    .nullable()
    .optional();

export const updateVendorProfileSchema = z.object({
  businessName: z.string().trim()
    .min(2, 'Business name must be at least 2 characters long')
    .max(120, 'Business name must not exceed 120 characters')
    .optional(),
  about: nullableTrimmedText(2, 5000, 'About'),
  logoUrl: z.string().trim().url('logoUrl must be a valid URL').nullable().optional(),
  logoPublicId: nullableTrimmedText(1, 500, 'logoPublicId'),
  primaryCityId: nullableTrimmedText(1, 100, 'primaryCityId'),
  profileStatus: z.enum(['DRAFT', 'ACTIVE']).optional(),
}).strict().superRefine((payload, ctx) => {
  if (Object.keys(payload).length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one profile field is required' });
  }
  const hasLogoUrl = Object.prototype.hasOwnProperty.call(payload, 'logoUrl');
  const hasLogoPublicId = Object.prototype.hasOwnProperty.call(payload, 'logoPublicId');
  if (hasLogoUrl !== hasLogoPublicId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: hasLogoUrl ? ['logoPublicId'] : ['logoUrl'],
      message: 'logoUrl and logoPublicId must be sent together',
    });
  }
  if (hasLogoUrl && hasLogoPublicId && (payload.logoUrl === null) !== (payload.logoPublicId === null)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['logoUrl'],
      message: 'Set both logoUrl and logoPublicId, or set both to null',
    });
  }
});

export const publicVendorSlugSchema = z.object({
  slug: z.string().trim()
    .min(1, 'Vendor slug is required')
    .max(180, 'Vendor slug must not exceed 180 characters')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Vendor slug is invalid'),
}).strict();

const publicVendorFilterId = (fieldName) => z.string().trim()
  .min(1, `${fieldName} is required when provided`)
  .max(100, `${fieldName} must not exceed 100 characters`)
  .optional();

const selectedCatalogIds = (label) => z.array(
  z.string().trim().min(1, `${label} must contain valid IDs`),
  { required_error: `${label} is required` },
).min(1, `Select at least one ${label}`).max(100, `You can select at most 100 ${label}`)
  .refine((ids) => new Set(ids).size === ids.length, `${label} must not contain duplicate IDs`);

export const updateVendorCapabilitiesSchema = z.object({
  serviceCategoryIds: selectedCatalogIds('service category'),
  serviceSubcategoryIds: selectedCatalogIds('service subcategory'),
}).strict();

export const vendorCapabilitiesQuerySchema = z.object({
  offeringKind: z.enum(['SERVICE', 'VENUE_PROPERTY']).optional(),
}).strict();

export const publicVendorListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim()
    .min(1, 'search cannot be empty')
    .max(120, 'search must not exceed 120 characters')
    .optional(),
  cityId: publicVendorFilterId('cityId'),
  serviceCategoryId: publicVendorFilterId('serviceCategoryId'),
  serviceSubcategoryId: publicVendorFilterId('serviceSubcategoryId'),
  offeringKind: z.enum(['SERVICE', 'VENUE_PROPERTY']).optional(),
}).strict();
