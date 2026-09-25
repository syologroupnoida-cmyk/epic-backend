import prisma from '../config/db.js';

const categoryInclude = { _count: { select: { subcategories: true } } };
const subcategoryInclude = { serviceCategory: true };

export const createCategory = (data) => prisma.serviceCategory.create({ data, include: categoryInclude });
export const findCategory = (id) => prisma.serviceCategory.findUnique({ where: { id }, include: { ...categoryInclude, subcategories: { orderBy: { createdAt: 'desc' } } } });
export const listCategories = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.serviceCategory.findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, include: categoryInclude }),
    prisma.serviceCategory.count({ where }),
  ]);
  return { items, total };
};
export const updateCategory = (id, data) => prisma.serviceCategory.update({ where: { id }, data, include: categoryInclude });
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
