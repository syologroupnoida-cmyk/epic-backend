import prisma from '../config/db.js';

const productInclude = { category: true, images: { orderBy: { sortOrder: 'asc' } }, variants: { orderBy: { createdAt: 'asc' } } };
const publicProductInclude = { category: { select: { id: true, name: true, slug: true } }, subcategory: { select: { id: true, name: true, slug: true } }, images: { orderBy: { sortOrder: 'asc' } }, variants: { where: { isActive: true }, orderBy: { createdAt: 'asc' }, select: { id: true, sku: true, optionValues: true, mrpAmountPaise: true, saleAmountPaise: true, weightGrams: true, imageUrl: true, isDefault: true, onHandQuantity: true, reservedQuantity: true } } };

export const createCategory = (data) => prisma.ecommerceCategory.create({ data });
export const findCategory = (id) => prisma.ecommerceCategory.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
export const updateCategory = (id, data) => prisma.ecommerceCategory.update({ where: { id }, data });
export const deleteCategory = (id) => prisma.ecommerceCategory.delete({ where: { id } });
export const listCategories = ({ where, skip, take, publicOnly = false }) => prisma.ecommerceCategory.findMany({ where: { ...where, ...(publicOnly && { isActive: true }) }, skip, take, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
export const countCategories = (where) => prisma.ecommerceCategory.count({ where });
export const findActiveCategory = (id) => prisma.ecommerceCategory.findFirst({ where: { id, isActive: true } });
export const createSubcategory = (data) => prisma.ecommerceSubcategory.create({ data, include: { category: true } });
export const findSubcategory = (id) => prisma.ecommerceSubcategory.findUnique({ where: { id }, include: { category: true } });
export const listSubcategories = ({ where, publicOnly = false }) => prisma.ecommerceSubcategory.findMany({ where: { ...where, ...(publicOnly && { isActive: true, category: { isActive: true } }) }, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }], include: { category: true } });
export const updateSubcategory = (id, data) => prisma.ecommerceSubcategory.update({ where: { id }, data, include: { category: true } });

export const createProduct = ({ data, initialMovements }) => prisma.$transaction(async (tx) => {
  const product = await tx.ecommerceProduct.create({ data, include: productInclude });
  if (initialMovements.length) await tx.ecommerceInventoryMovement.createMany({ data: initialMovements.map(({ sku, ...item }) => ({ ...item, variantId: product.variants.find((v) => v.sku === sku).id })) });
  return tx.ecommerceProduct.findUnique({ where: { id: product.id }, include: productInclude });
});
export const findProduct = (id) => prisma.ecommerceProduct.findUnique({ where: { id }, include: productInclude });
export const findPublicProductBySlug = (slug) => prisma.ecommerceProduct.findFirst({ where: { slug, status: 'ACTIVE', category: { isActive: true } }, include: publicProductInclude });
export const listProducts = async ({ where, skip, take, publicOnly = false }) => {
  const finalWhere = publicOnly ? { AND: [where, { status: 'ACTIVE', category: { isActive: true } }] } : where;
  const include = publicOnly ? publicProductInclude : productInclude;
  const [items, total] = await Promise.all([prisma.ecommerceProduct.findMany({ where: finalWhere, skip, take, orderBy: { createdAt: 'desc' }, include }), prisma.ecommerceProduct.count({ where: finalWhere })]);
  return { items, total };
};
export const updateProduct = (id, data) => prisma.ecommerceProduct.update({ where: { id }, data, include: productInclude });
export const createProductImage = (productId, data) => prisma.ecommerceProductImage.create({ data: { productId, ...data } });
export const deleteProductImage = (productId, id) => prisma.ecommerceProductImage.delete({ where: { id }, });
export const findProductImage = (id, productId) => prisma.ecommerceProductImage.findFirst({ where: { id, productId } });
export const findVariant = (id) => prisma.ecommerceProductVariant.findUnique({ where: { id }, include: { product: { select: { id: true, status: true } } } });
export const createVariant = (productId, data) => prisma.ecommerceProductVariant.create({ data: { productId, ...data } });
export const updateVariant = (id, data) => prisma.ecommerceProductVariant.update({ where: { id }, data });
export const adjustInventory = ({ variantId, quantity, type, note, adminId }) => prisma.$transaction(async (tx) => {
  const variant = await tx.ecommerceProductVariant.update({ where: { id: variantId }, data: { onHandQuantity: { increment: quantity } } });
  if (variant.onHandQuantity < variant.reservedQuantity) throw new Error('INSUFFICIENT_STOCK');
  await tx.ecommerceInventoryMovement.create({ data: { variantId, quantity, type, note, adminId } });
  return tx.ecommerceProductVariant.findUnique({ where: { id: variantId } });
});
export const listInventory = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([prisma.ecommerceProductVariant.findMany({ where, skip, take, orderBy: { updatedAt: 'desc' }, include: { product: { include: { category: true } } } }), prisma.ecommerceProductVariant.count({ where })]);
  return { items, total };
};
export const listInventoryMovements = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([prisma.ecommerceInventoryMovement.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: { variant: { include: { product: { select: { id: true, title: true, slug: true } } } } } }), prisma.ecommerceInventoryMovement.count({ where })]);
  return { items, total };
};
export const updateInventorySettings = (variantId, data) => prisma.ecommerceProductVariant.update({ where: { id: variantId }, data });
