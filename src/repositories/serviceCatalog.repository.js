import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const categoryInclude = { _count: { select: { subcategories: true } } };
const subcategoryInclude = { serviceCategory: true };

export const createCategory = (data) => prisma.serviceCategory.create({ data, include: categoryInclude });
export const createCategoriesWithSubcategories = (categories) => prisma.$transaction(async (tx) => {
  const created = [];
  for (const category of categories) {
    created.push(await tx.serviceCategory.create({
      data: category,
      include: {
        subcategories: { orderBy: { createdAt: 'desc' } },
        _count: { select: { subcategories: true } },
      },
    }));
  }
  return created;
});
export const findCategory = (id) => prisma.serviceCategory.findUnique({ where: { id }, include: { ...categoryInclude, subcategories: { orderBy: { createdAt: 'desc' } } } });
export const listCategories = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.serviceCategory.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: categoryInclude }),
    prisma.serviceCategory.count({ where }),
  ]);
  return { items, total };
};
export const listPublicCategories = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.serviceCategory.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: { subcategories: { orderBy: { createdAt: 'desc' } } },
    }),
    prisma.serviceCategory.count({ where }),
  ]);
  return { items, total };
};
export const updateCategory = (id, data) => prisma.serviceCategory.update({ where: { id }, data, include: categoryInclude });
export const updateCategoriesWithSubcategories = (updates) => prisma.$transaction(async (tx) => {
  const currentCategories = await tx.serviceCategory.findMany({
    where: { id: { in: updates.map(({ id }) => id) } },
    select: { id: true, subcategories: { select: { id: true } } },
  });
  const currentById = new Map(currentCategories.map((item) => [item.id, item]));
  const missingCategoryIds = updates.map(({ id }) => id).filter((id) => !currentById.has(id));
  if (missingCategoryIds.length) {
    throw ApiError.notFound('One or more service categories were not found.', { missingCategoryIds });
  }

  const categories = [];
  for (const update of updates) {
    const validSubcategoryIds = new Set(currentById.get(update.id).subcategories.map(({ id }) => id));
    const invalidSubcategoryIds = update.subcategories
      .filter(({ id }) => id && !validSubcategoryIds.has(id))
      .map(({ id }) => id);
    if (invalidSubcategoryIds.length) {
      throw ApiError.badRequest('A subcategory does not belong to its supplied category.', {
        categoryId: update.id,
        invalidSubcategoryIds,
      });
    }

    for (const subcategory of update.subcategories) {
      if (subcategory.id) {
        await tx.serviceSubcategory.update({ where: { id: subcategory.id }, data: subcategory.data });
      } else {
        await tx.serviceSubcategory.create({ data: { ...subcategory.data, serviceCategoryId: update.id } });
      }
    }
    categories.push(await tx.serviceCategory.update({
      where: { id: update.id },
      data: update.data,
      include: {
        subcategories: { orderBy: { createdAt: 'desc' } },
        _count: { select: { subcategories: true } },
      },
    }));
  }
  return categories;
});
export const deleteCategory = (id) => prisma.serviceCategory.delete({ where: { id } });
export const createSubcategory = (data) => prisma.serviceSubcategory.create({ data, include: subcategoryInclude });
export const findSubcategory = (id) => prisma.serviceSubcategory.findUnique({ where: { id }, include: subcategoryInclude });
export const listSubcategories = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.serviceSubcategory.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: subcategoryInclude }),
    prisma.serviceSubcategory.count({ where }),
  ]);
  return { items, total };
};
export const updateSubcategory = (id, data) => prisma.serviceSubcategory.update({ where: { id }, data, include: subcategoryInclude });
export const deleteSubcategory = (id) => prisma.serviceSubcategory.delete({ where: { id } });

export const findCatalogSelections = async ({ serviceCategoryIds, serviceSubcategoryIds }) => {
  const [categories, subcategories] = await Promise.all([
    prisma.serviceCategory.findMany({
      where: { id: { in: serviceCategoryIds } },
      select: { id: true },
    }),
    prisma.serviceSubcategory.findMany({
      where: { id: { in: serviceSubcategoryIds } },
      select: { id: true, serviceCategoryId: true },
    }),
  ]);
  return { categories, subcategories };
};
