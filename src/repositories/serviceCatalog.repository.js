import prisma from '../config/db.js';

const categoryInclude = { _count: { select: { subcategories: true } } };
const subcategoryInclude = { serviceCategory: true };

export const createCategory = (data) => prisma.serviceCategory.create({ data, include: categoryInclude });
export const createCategories = (categories) => prisma.$transaction(async (tx) => {
  const created = [];
  for (const category of categories) {
    created.push(await tx.serviceCategory.create({
      data: category,
      include: categoryInclude,
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
export const updateCategories = (updates) => prisma.$transaction(async (tx) => {
  const categories = [];
  for (const update of updates) {
    categories.push(await tx.serviceCategory.update({
      where: { id: update.id },
      data: update.data,
      include: categoryInclude,
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
