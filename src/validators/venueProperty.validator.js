import { z } from 'zod';

const id = (field) => z.string({ required_error: `${field} is required` }).trim()
  .min(1, `${field} is required`).max(100, `${field} is invalid`);
const money = z.coerce.number().int().min(0, 'startingPrice must be zero or greater').max(100000000);
const count = (field) => z.coerce.number().int().min(0, `${field} must be zero or greater`).max(1000000);
const status = z.enum(['DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'PAUSED', 'ARCHIVED']);
const priceType = z.enum(['FIXED', 'STARTING_FROM', 'PER_PERSON', 'PER_PLATE', 'PER_DAY', 'CUSTOM']);
const metadata = z.record(z.unknown()).optional();

const address = z.object({
  street: z.string().trim().min(2).max(300),
  locality: z.string().trim().min(2).max(150),
  state: z.string().trim().min(2).max(100),
  pincode: z.string().trim().min(3).max(20),
  country: z.string().trim().min(2).max(100).default('India'),
}).strict();

const venueTypes = z.array(id('serviceSubcategoryId')).min(1, 'Select at least one venue type').max(10)
  .refine((items) => new Set(items).size === items.length, 'A venue type can be selected only once');

const media = z.array(z.object({
  url: z.string().trim().url('Media URL must be valid'),
  publicId: z.string().trim().min(1).max(500),
  mediaType: z.enum(['IMAGE', 'VIDEO']).default('IMAGE'),
}).strict()).max(50, 'You can upload at most 50 media files');

const common = {
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(10).max(5000),
  startingPrice: money,
  priceType: priceType.default('STARTING_FROM'),
  cityId: id('cityId'),
  address,
  capacityMin: count('capacityMin').optional(),
  capacityMax: count('capacityMax').optional(),
  rooms: count('rooms').optional(),
  parkingCapacity: count('parkingCapacity').optional(),
  amenities: z.array(z.string().trim().min(1).max(80)).max(50).default([]),
  metadata,
  venueTypes,
  media: media.default([]),
};

const capacityIsValid = (payload, ctx) => {
  if (payload.capacityMin !== undefined && payload.capacityMax !== undefined && payload.capacityMin > payload.capacityMax) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['capacityMax'], message: 'capacityMax must be greater than or equal to capacityMin' });
  }
};

export const createVenuePropertySchema = z.object({
  ...common,
  submitForReview: z.boolean().optional().default(false),
}).strict().superRefine(capacityIsValid);

export const updateVenuePropertySchema = z.object({
  title: common.title.optional(),
  description: common.description.optional(),
  startingPrice: money.optional(),
  priceType: priceType.optional(),
  cityId: common.cityId.optional(),
  address: address.optional(),
  capacityMin: count('capacityMin').nullable().optional(),
  capacityMax: count('capacityMax').nullable().optional(),
  rooms: count('rooms').nullable().optional(),
  parkingCapacity: count('parkingCapacity').nullable().optional(),
  amenities: common.amenities.optional(),
  metadata: metadata.nullable(),
  venueTypes: venueTypes.optional(),
  media: media.optional(),
}).strict().superRefine((payload, ctx) => {
  if (Object.keys(payload).length === 0) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'At least one venue property field is required' });
  capacityIsValid(payload, ctx);
});

export const venuePropertyIdParamsSchema = z.object({ venuePropertyId: id('venuePropertyId') }).strict();
export const venuePropertySlugParamsSchema = z.object({
  slug: z.string().trim().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Venue property slug is invalid'),
}).strict();

const page = { page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) };
export const venuePropertyListQuerySchema = z.object({ ...page, status: status.optional() }).strict();
export const adminVenuePropertyListQuerySchema = z.object({
  ...page,
  status: status.optional(),
  vendorUserId: id('vendorUserId').optional(),
  cityId: id('cityId').optional(),
  serviceSubcategoryId: id('serviceSubcategoryId').optional(),
}).strict();
export const publicVenuePropertyListQuerySchema = z.object({
  ...page,
  search: z.string().trim().min(1).max(120).optional(),
  cityId: id('cityId').optional(),
  serviceSubcategoryId: id('serviceSubcategoryId').optional(),
}).strict();
export const rejectVenuePropertySchema = z.object({ reason: z.string().trim().min(5).max(500) }).strict();
export const pauseVenuePropertySchema = z.object({ reason: z.string().trim().min(5).max(500) }).strict();
