import { ApiError } from '../../utils/ApiError.js';
import { cloudinary, uploadBuffer } from '../../utils/cloudinary.js';
import { toSlug } from '../../utils/slug.js';
import * as repo from '../../repositories/serviceCatalog.repository.js';

const pageInfo = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 });
const destroyImage = async (publicId) => {
  if (!publicId) return;
  try { await cloudinary.uploader.destroy(publicId, { invalidate: true }); }
  catch (error) { console.error('[service-catalog] Image cleanup failed:', error?.message); }
};
const getImage = async ({ body, file, folder, required = false }) => {
  if (file) {
    const result = await uploadBuffer({ buffer: file.buffer, folder, resourceType: 'image' });
    return { imageUrl: result.secure_url, imagePublicId: result.public_id };
  }
  if (body.imageUrl !== undefined) return { imageUrl: body.imageUrl, imagePublicId: body.imageUrl ? body.imagePublicId ?? null : null };
  if (required) throw ApiError.badRequest('An image is required. Send a multipart "file" or imageUrl.');
  return {};
};
const buildSlug = (name) => {
  const slug = toSlug(name);
  if (!slug) throw ApiError.badRequest('name must contain letters or numbers.');
  return slug;
};

export const getCategory = async (id) => {
  const item = await repo.findCategory(id);
  if (!item) throw ApiError.notFound('Service category not found.');
  return item;
};
export const createCategory = async ({ body, file }) => {
  const isBulk = Array.isArray(body);
  const categories = isBulk ? body : [body];
  if (file && isBulk) {
    throw ApiError.badRequest('A file upload is supported only when creating one category. Use imageUrl for bulk requests.');
  }

  const uploadedImage = file
    ? await getImage({ body: categories[0], file, folder: 'epic-wedplanner/service-categories' })
    : {};
  const itemData = (item) => ({
    name: item.name,
    slug: buildSlug(item.name),
    description: item.description ?? null,
    ...(item.imageUrl !== undefined && {
      imageUrl: item.imageUrl,
      imagePublicId: item.imageUrl ? item.imagePublicId ?? null : null,
    }),
  });
  const data = categories.map((category, index) => ({
    ...itemData(category),
    ...(index === 0 ? uploadedImage : {}),
  }));

  try {
    const created = await repo.createCategories(data);
    return isBulk ? { categories: created, count: created.length } : created[0];
  } catch (error) {
    if (file) await destroyImage(uploadedImage.imagePublicId);
    throw error;
  }
};
export const listCategories = async ({ page, limit, search }) => {
  const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {};
  const { items, total } = await repo.listCategories({ where, skip: (page - 1) * limit, take: limit });
  return { categories: items, pagination: pageInfo(total, page, limit) };
};
export const listPublicCategories = async ({ page, limit, search }) => {
  const where = search ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } : {};
  const { items, total } = await repo.listPublicCategories({ where, skip: (page - 1) * limit, take: limit });
  return { categories: items, pagination: pageInfo(total, page, limit) };
};
export const updateCategory = async ({ id, body, file }) => {
  if (!file && Object.keys(body).length === 0) throw ApiError.badRequest('At least one field or image is required.');
  const current = await getCategory(id);
  const data = { ...(body.name && { name: body.name, slug: buildSlug(body.name) }), ...(body.description !== undefined && { description: body.description }) };
  const image = await getImage({ body, file, folder: 'epic-wedplanner/service-categories' });
  Object.assign(data, image);
  try {
    const updated = await repo.updateCategory(id, data);
    if ('imageUrl' in image && current.imagePublicId !== image.imagePublicId) await destroyImage(current.imagePublicId);
    return updated;
  } catch (error) { if (file) await destroyImage(image.imagePublicId); throw error; }
};
export const updateCategories = async ({ body }) => {
  const updateData = (item) => ({
    ...(item.name !== undefined && { name: item.name, slug: buildSlug(item.name) }),
    ...(item.description !== undefined && { description: item.description }),
    ...(item.imageUrl !== undefined && {
      imageUrl: item.imageUrl,
      imagePublicId: item.imageUrl ? item.imagePublicId ?? null : null,
    }),
  });
  const updates = body.map(({ id, ...category }) => ({
    id,
    data: updateData(category),
  }));
  const categories = await repo.updateCategories(updates);
  return { categories, count: categories.length };
};
export const deleteCategory = async (id) => {
  const current = await getCategory(id);
  const deleted = await repo.deleteCategory(id);
  await Promise.all([destroyImage(current.imagePublicId), ...current.subcategories.map((item) => destroyImage(item.imagePublicId))]);
  return deleted;
};

export const getSubcategory = async (id) => {
  const item = await repo.findSubcategory(id);
  if (!item) throw ApiError.notFound('Service subcategory not found.');
  return item;
};
export const createSubcategory = async ({ body, file }) => {
  await getCategory(body.serviceCategoryId);
  const image = await getImage({ body, file, folder: 'epic-wedplanner/service-subcategories' });
  try { return await repo.createSubcategory({ name: body.name, slug: buildSlug(body.name), description: body.description ?? null, serviceCategoryId: body.serviceCategoryId, ...image }); }
  catch (error) { if (file) await destroyImage(image.imagePublicId); throw error; }
};
export const listSubcategories = async ({ page, limit, search, serviceCategoryId, serviceCategory }) => {
  const parentId = serviceCategoryId ?? serviceCategory;
  const where = { ...(parentId && { serviceCategoryId: parentId }), ...(search && { OR: [{ name: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] }) };
  const { items, total } = await repo.listSubcategories({ where, skip: (page - 1) * limit, take: limit });
  return { subcategories: items, pagination: pageInfo(total, page, limit) };
};
export const updateSubcategory = async ({ id, body, file }) => {
  if (!file && Object.keys(body).length === 0) throw ApiError.badRequest('At least one field or image is required.');
  const current = await getSubcategory(id);
  if (body.serviceCategoryId) await getCategory(body.serviceCategoryId);
  const data = { ...(body.name && { name: body.name, slug: buildSlug(body.name) }), ...(body.description !== undefined && { description: body.description }), ...(body.serviceCategoryId !== undefined && { serviceCategoryId: body.serviceCategoryId }) };
  const image = await getImage({ body, file, folder: 'epic-wedplanner/service-subcategories' });
  Object.assign(data, image);
  try {
    const updated = await repo.updateSubcategory(id, data);
    if ('imageUrl' in image && current.imagePublicId !== image.imagePublicId) await destroyImage(current.imagePublicId);
    return updated;
  } catch (error) { if (file) await destroyImage(image.imagePublicId); throw error; }
};
export const deleteSubcategory = async (id) => {
  const current = await getSubcategory(id);
  const deleted = await repo.deleteSubcategory(id);
  await destroyImage(current.imagePublicId);
  return deleted;
};
