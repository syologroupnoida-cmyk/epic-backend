import { z } from 'zod';

const name = z.string().trim().min(1, 'name is required').max(120);
const description = z.string().trim().max(2000).nullable().optional();
const imageUrl = z.string().trim().url('imageUrl must be a valid URL').nullable().optional();
const imagePublicId = z.string().trim().min(1).max(255).nullable().optional();

export const createCategorySchema = z.object({ name, description, imageUrl, imagePublicId }).strict();
const updateFields = z.object({
  name: name.optional(), description, imageUrl, imagePublicId,
}).strict();
export const updateCategorySchema = updateFields;
export const createSubcategorySchema = createCategorySchema.extend({
  serviceCategoryId: z.string().trim().min(1, 'serviceCategoryId is required'),
});
export const updateSubcategorySchema = updateFields.extend({
  serviceCategoryId: z.string().trim().min(1).optional(),
});
export const listCatalogSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional(),
}).strict();
export const listSubcategoriesSchema = listCatalogSchema.extend({
  serviceCategoryId: z.string().trim().min(1).optional(),
  serviceCategory: z.string().trim().min(1).optional(),
});
