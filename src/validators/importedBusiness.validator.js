import { z } from 'zod';

const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
};

const id = z.string().trim().min(1).max(100);
const statuses = ['NEW', 'CONTACTED', 'INTERESTED', 'REGISTERED', 'NOT_INTERESTED', 'INVALID'];

export const importedBusinessIdParamsSchema = z.object({ businessId: id }).strict();
export const importedBusinessSlugParamsSchema = z.object({ slug: z.string().trim().min(1).max(180) }).strict();

export const publicImportedBusinessListQuerySchema = z.object({
  ...pageQuery,
  search: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(160).optional(),
  city: z.string().trim().min(1).max(120).optional(),
}).strict();

export const adminImportedBusinessListQuerySchema = z.object({
  ...pageQuery,
  search: z.string().trim().min(1).max(120).optional(),
  category: z.string().trim().min(1).max(160).optional(),
  city: z.string().trim().min(1).max(120).optional(),
  status: z.enum(statuses).optional(),
  isPublished: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
}).strict();

export const businessImportBatchListQuerySchema = z.object(pageQuery).strict();

export const updateImportedBusinessSchema = z.object({
  status: z.enum(statuses).optional(),
  isPublished: z.boolean().optional(),
  salesNote: z.string().trim().max(2000).nullable().optional(),
  registeredVendorUserId: z.string().trim().min(1).max(100).nullable().optional(),
}).strict().refine((payload) => Object.keys(payload).length > 0, 'Provide at least one field to update.');
