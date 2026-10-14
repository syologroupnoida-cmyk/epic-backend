import { z } from 'zod';

const name = z.string().trim().min(1, 'name is required').max(120);
const description = z.string().trim().max(2000).nullable().optional();
const imageUrl = z.string().trim().url('imageUrl must be a valid URL').nullable().optional();
const imagePublicId = z.string().trim().min(1).max(255).nullable().optional();
const offeringKind = z.enum(['SERVICE', 'VENUE_PROPERTY']);
const isActive = z.boolean();

const itemFields = { name, description, imageUrl, imagePublicId };
const createSubcategoryItemSchema = z.object({
  ...itemFields,
  isActive: isActive.optional().default(true),
}).strict();

export const createCategorySchema = z.object({
  ...itemFields,
  offeringKind: offeringKind.optional().default('SERVICE'),
  isActive: isActive.optional().default(true),
}).strict();
export const createCategoryPayloadSchema = z.union([
  createCategorySchema,
  z.array(createCategorySchema).min(1, 'At least one category is required').max(100),
]).superRefine((payload, ctx) => {
  const categories = Array.isArray(payload) ? payload : [payload];
  const categoryNames = categories.map((item) => item.name.toLowerCase());
  if (new Set(categoryNames).size !== categoryNames.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Category names must be unique within the request' });
  }
});
const updateItemFields = {
  name: name.optional(), description, imageUrl, imagePublicId, isActive: isActive.optional(),
};
export const updateCategorySchema = z.object({
  ...updateItemFields,
  offeringKind: offeringKind.optional(),
}).strict();
export const createSubcategorySchema = createSubcategoryItemSchema.extend({
  serviceCategoryId: z.string().trim().min(1, 'serviceCategoryId is required'),
});
const createSubcategoriesForCategorySchema = z.object({
  serviceCategoryId: z.string().trim().min(1, 'serviceCategoryId is required'),
  subcategories: z.array(createSubcategoryItemSchema)
    .min(1, 'At least one subcategory is required')
    .max(100),
}).strict().superRefine(({ subcategories }, ctx) => {
  const names = subcategories.map(({ name }) => name.toLowerCase());
  if (new Set(names).size !== names.length) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['subcategories'], message: 'Subcategory names must be unique within the request' });
  }
});
export const createSubcategoryPayloadSchema = z.union([
  createSubcategorySchema,
  createSubcategoriesForCategorySchema,
]);
export const updateSubcategorySchema = z.object(updateItemFields).extend({
  serviceCategoryId: z.string().trim().min(1).optional(),
});
export const listCatalogSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().trim().max(120).optional(),
  id: z.string().trim().min(1).optional(),
  slug: z.string().trim().min(1).max(160).optional(),
  offeringKind: offeringKind.optional(),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
}).strict();
export const listSubcategoriesSchema = listCatalogSchema.extend({
  serviceCategoryId: z.string().trim().min(1).optional(),
  serviceCategory: z.string().trim().min(1).optional(),
});
