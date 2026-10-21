import { z } from 'zod';

const id = (field) => z.string({ required_error: `${field} is required` }).trim()
  .min(1, `${field} is required`).max(100, `${field} is invalid`);

const money = (field) => z.coerce.number().int()
  .min(0, `${field} must be zero or greater`).max(100000000, `${field} is too large`);

const metadata = z.record(z.unknown()).optional();

const componentSchema = z.object({
  serviceSubcategoryId: id('serviceSubcategoryId'),
  price: money('price').optional(),
  metadata,
}).strict();

const mediaSchema = z.object({
  url: z.string().trim().url('Media URL must be valid'),
  publicId: z.string().trim().min(1, 'Media publicId is required').max(500),
  mediaType: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
}).strict();

const components = z.array(componentSchema).min(1, 'Select at least one service')
  .max(20, 'You can select at most 20 services')
  .refine(
    (items) => new Set(items.map(({ serviceSubcategoryId }) => serviceSubcategoryId)).size === items.length,
    'A service can be selected only once per listing',
  );

const media = z.array(mediaSchema).max(30, 'You can upload at most 30 media files');

export const createServiceListingSchema = z.object({
  title: z.string().trim().min(3, 'title must be at least 3 characters long')
    .max(180, 'title must not exceed 180 characters'),
  description: z.string().trim().min(10, 'description must be at least 10 characters long')
    .max(5000, 'description must not exceed 5000 characters'),
  startingPrice: money('startingPrice'),
  priceType: z.enum(['FIXED', 'STARTING_FROM', 'PER_PERSON', 'PER_PLATE', 'PER_DAY', 'CUSTOM'])
    .default('STARTING_FROM'),
  cityId: id('cityId'),
  metadata,
  services: components,
  media: media.default([]),
  submitForReview: z.boolean().optional().default(false),
}).strict();

export const updateServiceListingSchema = z.object({
  title: z.string().trim().min(3, 'title must be at least 3 characters long')
    .max(180, 'title must not exceed 180 characters').optional(),
  description: z.string().trim().min(10, 'description must be at least 10 characters long')
    .max(5000, 'description must not exceed 5000 characters').optional(),
  startingPrice: money('startingPrice').optional(),
  priceType: z.enum(['FIXED', 'STARTING_FROM', 'PER_PERSON', 'PER_PLATE', 'PER_DAY', 'CUSTOM']).optional(),
  cityId: id('cityId').optional(),
  metadata: metadata.nullable(),
  services: components.optional(),
  media: media.optional(),
}).strict().superRefine((payload, ctx) => {
  if (Object.keys(payload).length === 0) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one listing field is required' });
  }
});

export const listingIdParamsSchema = z.object({
  listingId: id('listingId'),
}).strict();

export const listingSlugParamsSchema = z.object({
  slug: z.string().trim().min(1, 'Listing slug is required').max(220)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Listing slug is invalid'),
}).strict();

const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

export const vendorListingListQuerySchema = z.object({
  ...pageQuery,
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'PAUSED', 'ARCHIVED']).optional(),
}).strict();

export const adminListingListQuerySchema = z.object({
  ...pageQuery,
  status: z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'PAUSED', 'ARCHIVED']).optional(),
  vendorUserId: id('vendorUserId').optional(),
  listingType: z.enum(['SERVICE', 'VENUE_PROPERTY']).optional(),
  cityId: id('cityId').optional(),
  serviceSubcategoryId: id('serviceSubcategoryId').optional(),
}).strict();

export const publicListingListQuerySchema = z.object({
  ...pageQuery,
  search: z.string().trim().min(1, 'search cannot be empty').max(120).optional(),
  cityId: id('cityId').optional(),
  serviceSubcategoryId: id('serviceSubcategoryId').optional(),
}).strict();

export const rejectListingSchema = z.object({
  reason: z.string().trim().min(5, 'reason must be at least 5 characters long')
    .max(500, 'reason must not exceed 500 characters'),
}).strict();

export const pauseListingSchema = z.object({
  reason: z.string().trim().min(5, 'reason must be at least 5 characters long')
    .max(500, 'reason must not exceed 500 characters'),
}).strict();
