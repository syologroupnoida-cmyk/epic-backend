import prisma from '../config/db.js';

export const createCity = (data) => prisma.city.create({ data });
export const findCityById = (id) => prisma.city.findUnique({ where: { id } });
export const findActiveCityById = (id) => prisma.city.findFirst({
  where: { id, isActive: true },
});

export const listCities = async ({ where, skip, take }) => {
  const [items, total] = await Promise.all([
    prisma.city.findMany({ where, skip, take, orderBy: [{ stateName: 'asc' }, { name: 'asc' }] }),
    prisma.city.count({ where }),
  ]);
  return { items, total };
};

export const updateCity = (id, data) => prisma.city.update({ where: { id }, data });
