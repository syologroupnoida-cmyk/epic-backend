import { ApiError } from '../../utils/ApiError.js';
import { toSlug } from '../../utils/slug.js';
import * as repo from '../../repositories/ecommerce.repository.js';

const pageInfo = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 });
const serializePublicProduct = (product) => ({
  ...product,
  variants: product.variants.map(({ onHandQuantity, reservedQuantity, ...variant }) => ({
    ...variant,
    availableQuantity: Math.max(0, onHandQuantity - reservedQuantity),
    inStock: onHandQuantity - reservedQuantity > 0,
  })),
});
const slugFor = (value) => { const slug = toSlug(value); if (!slug) throw ApiError.badRequest('Name must contain letters or numbers.'); return slug; };
const validateSpecifications = (template, specifications) => {
  if (!template?.fields) return;
  const fields = new Map(template.fields.map((field) => [field.key, field]));
  for (const key of Object.keys(specifications ?? {})) if (!fields.has(key)) throw ApiError.badRequest(`Specification "${key}" is not allowed for this subcategory.`);
  for (const field of fields.values()) {
    const value = specifications?.[field.key];
    if (field.required && (value === undefined || value === null || value === '')) throw ApiError.badRequest(`Specification "${field.label}" is required.`);
    if (value === undefined || value === null) continue;
    if (field.type === 'TEXT' && typeof value !== 'string') throw ApiError.badRequest(`Specification "${field.label}" must be text.`);
    if (field.type === 'NUMBER' && typeof value !== 'number') throw ApiError.badRequest(`Specification "${field.label}" must be a number.`);
    if (field.type === 'BOOLEAN' && typeof value !== 'boolean') throw ApiError.badRequest(`Specification "${field.label}" must be true or false.`);
    const values = field.type === 'MULTI_SELECT' ? value : [value];
    if ((field.type === 'SELECT' && Array.isArray(value)) || (field.type === 'MULTI_SELECT' && !Array.isArray(value)) || ['SELECT', 'MULTI_SELECT'].includes(field.type) && values.some((item) => !field.options?.includes(item))) throw ApiError.badRequest(`Specification "${field.label}" has an invalid option.`);
  }
};
const productPayload = (body, adminId) => ({
  categoryId: body.categoryId,
  subcategoryId: body.subcategoryId ?? null,
  title: body.title,
  slug: slugFor(body.title),
  shortDescription: body.shortDescription ?? null,
  description: body.description,
  brandName: body.brandName ?? null,
  specifications: body.specifications ?? undefined,
  optionDefinitions: body.optionDefinitions ?? undefined,
  gstPercentage: body.gstPercentage,
  isFeatured: body.isFeatured,
  createdByAdminId: adminId,
  images: { create: body.images.map(({ publicId, ...image }) => ({ ...image, publicId: publicId ?? null })) },
  variants: { create: body.variants.map(({ initialStock, ...variant }) => ({ ...variant, barcode: variant.barcode ?? null, optionValues: variant.optionValues ?? undefined, costAmountPaise: variant.costAmountPaise ?? null, weightGrams: variant.weightGrams ?? null, imageUrl: variant.imageUrl ?? null, onHandQuantity: initialStock })) },
});

export const createCategory = async ({ body }) => repo.createCategory({ ...body, slug: slugFor(body.name), description: body.description ?? null, imageUrl: body.imageUrl ?? null, imagePublicId: body.imagePublicId ?? null });
export const listCategories = async ({ page = 1, limit = 20, ...where } = {}) => ({ categories: await repo.listCategories({ where, skip: (page - 1) * limit, take: limit }), pagination: pageInfo(await repo.countCategories(where), page, limit) });
export const getCategory = async (id) => { const category = await repo.findCategory(id); if (!category) throw ApiError.notFound('E-commerce category not found.'); return category; };
export const updateCategory = async ({ id, body }) => { await getCategory(id); return repo.updateCategory(id, { ...body, ...(body.name && { slug: slugFor(body.name) }) }); };
export const deleteCategory = async (id) => { const category = await getCategory(id); if (category._count.products) throw ApiError.conflict('Cannot delete a category that contains products. Archive or move its products first.'); return repo.deleteCategory(id); };
export const createSubcategory = async ({ body }) => { if (!await repo.findActiveCategory(body.categoryId)) throw ApiError.badRequest('categoryId must be an active e-commerce category.'); return repo.createSubcategory({ ...body, slug: slugFor(body.name), description: body.description ?? null, specificationTemplate: body.specificationTemplate ?? undefined }); };
export const getSubcategory = async (id) => { const item = await repo.findSubcategory(id); if (!item) throw ApiError.notFound('E-commerce subcategory not found.'); return item; };
export const listSubcategories = async ({ categoryId, publicOnly = false }) => ({ subcategories: await repo.listSubcategories({ where: { ...(categoryId && { categoryId }) }, publicOnly }) });
export const updateSubcategory = async ({ id, body }) => { await getSubcategory(id); if (body.categoryId && !await repo.findActiveCategory(body.categoryId)) throw ApiError.badRequest('categoryId must be active.'); return repo.updateSubcategory(id, { ...body, ...(body.name && { slug: slugFor(body.name) }) }); };

export const createProduct = async ({ body, adminId }) => {
  if (!await repo.findActiveCategory(body.categoryId)) throw ApiError.badRequest('categoryId must be an active e-commerce category.');
  if (body.subcategoryId) { const sub = await repo.findSubcategory(body.subcategoryId); if (!sub?.isActive || sub.categoryId !== body.categoryId) throw ApiError.badRequest('subcategoryId must be active and belong to categoryId.'); validateSpecifications(sub.specificationTemplate, body.specifications); }
  const initialMovements = body.variants.filter((v) => v.initialStock > 0).map((v) => ({ sku: v.sku, quantity: v.initialStock, type: 'INITIAL_STOCK', note: 'Initial product stock', adminId }));
  return repo.createProduct({ data: productPayload(body, adminId), initialMovements });
};
export const getProduct = async (id) => { const product = await repo.findProduct(id); if (!product) throw ApiError.notFound('E-commerce product not found.'); return product; };
const productWhere = ({ categoryId, status, search, featured }) => ({ ...(categoryId && { categoryId }), ...(status && { status }), ...(featured !== undefined && { isFeatured: featured }), ...(search && { OR: [{ title: { contains: search, mode: 'insensitive' } }, { brandName: { contains: search, mode: 'insensitive' } }, { variants: { some: { sku: { contains: search, mode: 'insensitive' } } } }] }) });
export const listProducts = async ({ page, limit, ...query }) => { const where = productWhere(query); const { items, total } = await repo.listProducts({ where, skip: (page - 1) * limit, take: limit }); return { products: items, pagination: pageInfo(total, page, limit) }; };
export const updateProduct = async ({ id, body }) => {
  await getProduct(id);
  if (body.categoryId && !await repo.findActiveCategory(body.categoryId)) throw ApiError.badRequest('categoryId must be an active e-commerce category.');
  if (body.subcategoryId) { const sub = await repo.findSubcategory(body.subcategoryId); const categoryId = body.categoryId ?? (await getProduct(id)).categoryId; if (!sub?.isActive || sub.categoryId !== categoryId) throw ApiError.badRequest('subcategoryId must be active and belong to categoryId.'); validateSpecifications(sub.specificationTemplate, body.specifications); }
  const data = { ...body, ...(body.title && { slug: slugFor(body.title) }) };
  if (body.status === 'ACTIVE') Object.assign(data, { publishedAt: new Date(), archivedAt: null });
  if (body.status === 'ARCHIVED') Object.assign(data, { archivedAt: new Date() });
  return repo.updateProduct(id, data);
};
export const publishProduct = async (id) => { const product = await getProduct(id); if (!product.variants.some((v) => v.isActive)) throw ApiError.conflict('A product needs at least one active variant before publishing.'); return repo.updateProduct(id, { status: 'ACTIVE', publishedAt: new Date(), archivedAt: null }); };
export const archiveProduct = async (id) => { await getProduct(id); return repo.updateProduct(id, { status: 'ARCHIVED', archivedAt: new Date(), isFeatured: false }); };
export const addProductImage = async ({ productId, body }) => { await getProduct(productId); return repo.createProductImage(productId, body); };
export const removeProductImage = async ({ productId, imageId }) => { const image = await repo.findProductImage(imageId, productId); if (!image) throw ApiError.notFound('Product image not found.'); return repo.deleteProductImage(productId, imageId); };
const variantData = ({ initialStock, ...data }) => ({ ...data, barcode: data.barcode ?? null, optionValues: data.optionValues ?? undefined, costAmountPaise: data.costAmountPaise ?? null, weightGrams: data.weightGrams ?? null, imageUrl: data.imageUrl ?? null, onHandQuantity: 0 });
export const addVariant = async ({ productId, body, adminId }) => { await getProduct(productId); const created = await repo.createVariant(productId, variantData(body)); if (body.initialStock) await repo.adjustInventory({ variantId: created.id, quantity: body.initialStock, type: 'INITIAL_STOCK', note: 'Initial variant stock', adminId }); return repo.findVariant(created.id); };
export const updateVariant = async ({ variantId, body }) => { const current = await repo.findVariant(variantId); if (!current) throw ApiError.notFound('Product variant not found.'); if (body.saleAmountPaise !== undefined && body.saleAmountPaise > (body.mrpAmountPaise ?? current.mrpAmountPaise)) throw ApiError.badRequest('saleAmountPaise cannot exceed mrpAmountPaise.'); return repo.updateVariant(variantId, body); };
export const adjustInventory = async ({ variantId, body, adminId }) => {
  const variant = await repo.findVariant(variantId); if (!variant) throw ApiError.notFound('Product variant not found.');
  if (body.quantity < 0 && variant.onHandQuantity + body.quantity < variant.reservedQuantity) throw ApiError.conflict('Stock cannot be reduced below reserved quantity.');
  try { return await repo.adjustInventory({ variantId, ...body, adminId }); } catch (error) { if (error.message === 'INSUFFICIENT_STOCK') throw ApiError.conflict('Stock cannot be reduced below reserved quantity.'); throw error; }
};
export const listInventory = async ({ page, limit, productId, categoryId, lowStockOnly, search }) => {
  const where = { ...(productId && { productId }), ...(categoryId && { product: { categoryId } }), ...(search && { OR: [{ sku: { contains: search, mode: 'insensitive' } }, { product: { title: { contains: search, mode: 'insensitive' } } }] }) };
  const { items, total } = await repo.listInventory({ where, skip: lowStockOnly ? 0 : (page - 1) * limit, take: lowStockOnly ? 1000 : limit });
  const inventory = items.map((item) => ({ ...item, availableQuantity: item.onHandQuantity - item.reservedQuantity, isLowStock: item.onHandQuantity - item.reservedQuantity <= item.lowStockThreshold }));
  const filtered = lowStockOnly ? inventory.filter((item) => item.isLowStock) : inventory;
  const visible = lowStockOnly ? filtered.slice((page - 1) * limit, page * limit) : filtered;
  return { inventory: visible, pagination: pageInfo(lowStockOnly ? filtered.length : total, page, limit) };
};
export const listInventoryMovements = async ({ page, limit, variantId, productId, type }) => { const { items, total } = await repo.listInventoryMovements({ where: { ...(variantId && { variantId }), ...(productId && { variant: { productId } }), ...(type && { type }) }, skip: (page - 1) * limit, take: limit }); return { movements: items, pagination: pageInfo(total, page, limit) }; };
export const updateInventorySettings = async ({ variantId, body }) => { if (!await repo.findVariant(variantId)) throw ApiError.notFound('Product variant not found.'); return repo.updateInventorySettings(variantId, body); };
export const listPublicCategories = async ({ page, limit }) => ({ categories: await repo.listCategories({ where: {}, skip: (page - 1) * limit, take: limit, publicOnly: true }), pagination: pageInfo(await repo.countCategories({ isActive: true }), page, limit) });
export const listPublicSubcategories = async ({ categoryId }) => ({ subcategories: await repo.listSubcategories({ where: { ...(categoryId && { categoryId }) }, publicOnly: true }) });
export const listPublicProducts = async ({ page, limit, categorySlug, subcategoryId, minPrice, maxPrice, search, featured }) => { const price = { ...(minPrice !== undefined && { gte: minPrice }), ...(maxPrice !== undefined && { lte: maxPrice }) }; const where = { ...(categorySlug && { category: { slug: categorySlug } }), ...(subcategoryId && { subcategoryId }), ...(featured !== undefined && { isFeatured: featured }), ...(search && { title: { contains: search, mode: 'insensitive' } }), ...((minPrice !== undefined || maxPrice !== undefined) && { variants: { some: { isActive: true, saleAmountPaise: price } } }) }; const { items, total } = await repo.listProducts({ where, skip: (page - 1) * limit, take: limit, publicOnly: true }); return { products: items.map(serializePublicProduct), pagination: pageInfo(total, page, limit) }; };
export const getPublicProduct = async (slug) => { const product = await repo.findPublicProductBySlug(slug); if (!product) throw ApiError.notFound('Product not found.'); return serializePublicProduct(product); };
