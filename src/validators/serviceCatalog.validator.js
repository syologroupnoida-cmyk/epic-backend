import { z } from 'zod';

const name = z.string().trim().min(1, 'name is required').max(120);
const description = z.string().trim().max(2000).nullable().optional();
const imageUrl = z.string().trim().url('imageUrl must be a valid URL').nullable().optional();
const imagePublicId = z.string().trim().min(1).max(255).nullable().optional();

export const createCategorySchema = z.object({ name, description, imageUrl, imagePublicId }).strict();
const createCategoryWithSubcategoriesSchema = createCategorySchema.extend({
  subcategories: z.array(createCategorySchema).max(100).optional().default([]),
});
export const createCategoryPayloadSchema = z.union([
  createCategoryWithSubcategoriesSchema,
  z.array(createCategoryWithSubcategoriesSchema).min(1, 'At least one category is required').max(100),
]).superRefine((payload, ctx) => {
  const categories = Array.isArray(payload) ? payload : [payload];
  const categoryNames = categories.map((item) => item.name.toLowerCase());
  if (new Set(categoryNames).size !== categoryNames.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Category names must be unique within the request' });
  }
  const subcategoryNames = categories.flatMap((category) =>
    category.subcategories.map((item) => item.name.toLowerCase()));
  if (new Set(subcategoryNames).size !== subcategoryNames.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Subcategory names must be unique within the request' });
  }
});
const updateFields = z.object({
  name: name.optional(), description, imageUrl, imagePublicId,
}).strict();
export const updateCategorySchema = updateFields;
const updateNestedSubcategorySchema = updateFields.extend({
  id: z.string().trim().min(1).optional(),
}).superRefine((item, ctx) => {
  if (!item.id && !item.name) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['name'], message: 'name is required when creating a subcategory' });
  }
  if (item.id && Object.keys(item).length === 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide at least one field to update' });
  }
});
const updateCategoryTreeSchema = updateFields.extend({
  id: z.string().trim().min(1, 'Category id is required'),
  subcategories: z.array(updateNestedSubcategorySchema).max(100).optional(),
}).superRefine((item, ctx) => {
  if (Object.keys(item).length === 1) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Provide at least one category or subcategory change' });
  }
});
export const updateCategoriesPayloadSchema = z.array(updateCategoryTreeSchema)
  .min(1, 'At least one category is required').max(100)
  .superRefine((categories, ctx) => {
    const ids = categories.map(({ id }) => id);
    if (new Set(ids).size !== ids.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Category IDs must be unique within the request' });
    }
  });
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
