import { ApiError } from '../../utils/ApiError.js';
import { toSlug } from '../../utils/slug.js';
import * as cityRepo from '../../repositories/city.repository.js';

const pageInfo = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

const buildSlug = ({ name, stateName, countryCode }) => {
  const slug = toSlug(`${name}-${stateName}-${countryCode}`);
  if (!slug) throw ApiError.badRequest('City fields must contain letters or numbers.');
  return slug;
};

export const createCity = async (body) => cityRepo.createCity({
  ...body,
  slug: buildSlug(body),
});

export const getCity = async (id) => {
  const city = await cityRepo.findCityById(id);
  if (!city) throw ApiError.notFound('City not found.');
  return city;
};

export const getPublicCity = async (id) => {
  const city = await getCity(id);
  if (!city.isActive) throw ApiError.notFound('City not found.');
  return city;
};

export const listCities = async ({ page, limit, search, stateName, countryCode, isActive }) => {
  const where = {
    ...(isActive !== undefined && { isActive }),
    ...(stateName && { stateName: { equals: stateName, mode: 'insensitive' } }),
    ...(countryCode && { countryCode }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { stateName: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const { items, total } = await cityRepo.listCities({
    where,
    skip: (page - 1) * limit,
    take: limit,
  });
  return { cities: items, pagination: pageInfo(total, page, limit) };
};

export const listPublicCities = (query) => listCities({ ...query, isActive: true });

export const updateCity = async ({ id, body }) => {
  const current = await getCity(id);
  const data = { ...body };
  if (body.name || body.stateName || body.countryCode) {
    data.slug = buildSlug({
      name: body.name ?? current.name,
      stateName: body.stateName ?? current.stateName,
      countryCode: body.countryCode ?? current.countryCode,
    });
  }
  return cityRepo.updateCity(id, data);
};
