import { z } from 'zod';

const id = z.string().trim().min(1).max(100);
const page = { page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(20) };
const optionalText = z.string().trim().min(1).max(5000).optional().nullable();
const image = z.object({ url: z.string().url().max(2000), publicId: z.string().trim().max(500).optional().nullable(), altText: z.string().trim().max(250).optional().nullable(), sortOrder: z.coerce.number().int().min(0).max(1000).default(0) }).strict();
const templateField = z.object({ key: z.string().trim().regex(/^[a-z][A-Za-z0-9_]*$/).max(80), label: z.string().trim().min(1).max(100), type: z.enum(['TEXT', 'NUMBER', 'BOOLEAN', 'SELECT', 'MULTI_SELECT']), required: z.boolean().default(false), options: z.array(z.string().trim().min(1).max(100)).max(100).optional() }).strict();
const specificationTemplate = z.object({ fields: z.array(templateField).max(100) }).strict().superRefine((value, ctx) => { const keys = new Set(); value.fields.forEach((field, i) => { if (keys.has(field.key)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fields', i, 'key'], message: 'Field key must be unique.' }); keys.add(field.key); if (['SELECT', 'MULTI_SELECT'].includes(field.type) && !field.options?.length) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['fields', i, 'options'], message: 'Select fields need options.' }); }); });
const variant = z.object({
  sku: z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9_-]+$/, 'sku may contain only letters, numbers, dashes and underscores'),
  barcode: z.string().trim().min(2).max(100).optional().nullable(),
  optionValues: z.record(z.string().trim().min(1).max(100)).optional().nullable(),
  mrpAmountPaise: z.coerce.number().int().min(0).max(1000000000),
  saleAmountPaise: z.coerce.number().int().min(0).max(1000000000),
  costAmountPaise: z.coerce.number().int().min(0).max(1000000000).optional().nullable(),
  weightGrams: z.coerce.number().int().positive().max(100000).optional().nullable(),
  imageUrl: z.string().url().max(2000).optional().nullable(),
  isActive: z.boolean().default(true),
  isDefault: z.boolean().default(false),
  initialStock: z.coerce.number().int().min(0).max(1000000).default(0),
}).strict().superRefine((value, ctx) => {
  if (value.saleAmountPaise > value.mrpAmountPaise) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['saleAmountPaise'], message: 'saleAmountPaise cannot exceed mrpAmountPaise.' });
});

const variants = z.array(variant).min(1).max(100).superRefine((items, ctx) => {
  const sku = new Set(); const barcode = new Set();
  items.forEach((item, index) => {
    if (sku.has(item.sku)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'sku'], message: 'SKU must be unique within the product.' });
    sku.add(item.sku);
    if (item.barcode) { if (barcode.has(item.barcode)) ctx.addIssue({ code: z.ZodIssueCode.custom, path: [index, 'barcode'], message: 'Barcode must be unique within the product.' }); barcode.add(item.barcode); }
  });
  if (items.filter((item) => item.isDefault).length > 1) ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Only one variant can be default.' });
});

export const ecommerceCategoryIdParamsSchema = z.object({ categoryId: id }).strict();
export const ecommerceSubcategoryIdParamsSchema = z.object({ subcategoryId: id }).strict();
export const ecommerceProductIdParamsSchema = z.object({ productId: id }).strict();
export const ecommerceVariantIdParamsSchema = z.object({ variantId: id }).strict();
export const ecommerceImageIdParamsSchema = z.object({ productId: id, imageId: id }).strict();
export const createEcommerceCategorySchema = z.object({ name: z.string().trim().min(2).max(120), description: optionalText, imageUrl: z.string().url().max(2000).optional().nullable(), imagePublicId: z.string().trim().max(500).optional().nullable(), sortOrder: z.coerce.number().int().min(0).max(10000).default(0) }).strict();
export const updateEcommerceCategorySchema = createEcommerceCategorySchema.partial().extend({ isActive: z.boolean().optional() }).strict().refine((v) => Object.keys(v).length > 0, 'At least one field is required.');
export const createEcommerceSubcategorySchema = z.object({ categoryId: id, name: z.string().trim().min(2).max(120), description: optionalText, specificationTemplate: specificationTemplate.optional().nullable(), sortOrder: z.coerce.number().int().min(0).max(10000).default(0) }).strict();
export const updateEcommerceSubcategorySchema = createEcommerceSubcategorySchema.omit({ categoryId: true }).partial().extend({ categoryId: id.optional(), isActive: z.boolean().optional() }).strict().refine((v) => Object.keys(v).length > 0, 'At least one field is required.');
export const createEcommerceProductSchema = z.object({
  categoryId: id,
  subcategoryId: id,
  title: z.string().trim().min(3).max(200),
  shortDescription: optionalText,
  description: z.string().trim().min(10).max(20000),
  brandName: z.string().trim().min(1).max(120).optional().nullable(),
  specifications: z.record(z.unknown()).optional().nullable(),
  optionDefinitions: z.array(z.object({ name: z.string().trim().min(1).max(80), values: z.array(z.string().trim().min(1).max(100)).min(1).max(100) }).strict()).max(3).optional().nullable(),
  gstPercentage: z.coerce.number().int().min(0).max(100).default(0),
  isFeatured: z.boolean().default(false),
  images: z.array(image).max(20).default([]),
  variants,
}).strict();
export const updateEcommerceProductSchema = createEcommerceProductSchema.omit({ categoryId: true, variants: true, images: true }).partial().extend({ categoryId: id.optional(), status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional() }).strict().refine((v) => Object.keys(v).length > 0, 'At least one field is required.');
export const ecommerceProductListQuerySchema = z.object({ ...page, categoryId: id.optional(), status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).optional(), search: z.string().trim().min(1).max(100).optional(), featured: z.coerce.boolean().optional() }).strict();
export const ecommercePublicProductListQuerySchema = z.object({ ...page, categorySlug: z.string().trim().min(1).max(160).optional(), subcategoryId: id.optional(), minPrice: z.coerce.number().int().min(0).max(1000000000).optional(), maxPrice: z.coerce.number().int().min(0).max(1000000000).optional(), search: z.string().trim().min(1).max(100).optional(), featured: z.coerce.boolean().optional() }).strict().refine((value) => value.minPrice === undefined || value.maxPrice === undefined || value.minPrice <= value.maxPrice, { message: 'minPrice cannot be greater than maxPrice.', path: ['minPrice'] });
export const ecommercePublicCategoryListQuerySchema = z.object({ ...page }).strict();
export const adjustEcommerceInventorySchema = z.object({ quantity: z.coerce.number().int().min(-1000000).max(1000000).refine((v) => v !== 0, 'quantity cannot be zero'), note: z.string().trim().min(3).max(500), type: z.enum(['STOCK_RECEIVED', 'MANUAL_ADJUSTMENT', 'DAMAGED', 'RETURN_RECEIVED']).default('MANUAL_ADJUSTMENT') }).strict();
export const ecommerceInventoryListQuerySchema = z.object({ ...page, productId: id.optional(), categoryId: id.optional(), lowStockOnly: z.coerce.boolean().optional(), search: z.string().trim().min(1).max(100).optional() }).strict();
export const ecommerceInventoryMovementQuerySchema = z.object({ ...page, variantId: id.optional(), productId: id.optional(), type: z.enum(['INITIAL_STOCK', 'STOCK_RECEIVED', 'MANUAL_ADJUSTMENT', 'ORDER_RESERVED', 'ORDER_RELEASED', 'ORDER_SOLD', 'RETURN_RECEIVED', 'DAMAGED']).optional() }).strict();
export const updateEcommerceInventorySettingsSchema = z.object({ lowStockThreshold: z.coerce.number().int().min(0).max(1000000) }).strict();
export const createEcommerceProductImageSchema = image;
export const updateEcommerceVariantSchema = z.object({ sku: z.string().trim().min(2).max(100).regex(/^[A-Za-z0-9_-]+$/).optional(), barcode: z.string().trim().min(2).max(100).optional().nullable(), optionValues: z.record(z.string().trim().min(1).max(100)).optional().nullable(), mrpAmountPaise: z.coerce.number().int().min(0).max(1000000000).optional(), saleAmountPaise: z.coerce.number().int().min(0).max(1000000000).optional(), costAmountPaise: z.coerce.number().int().min(0).max(1000000000).optional().nullable(), weightGrams: z.coerce.number().int().positive().max(100000).optional().nullable(), imageUrl: z.string().url().max(2000).optional().nullable(), isActive: z.boolean().optional(), isDefault: z.boolean().optional() }).strict().refine((v) => Object.keys(v).length > 0, 'At least one field is required.');
export const createEcommerceVariantSchema = variant;
