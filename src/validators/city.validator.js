import { z } from 'zod';

const name = z.string().trim().min(2, 'name must be at least 2 characters').max(120);
const stateName = z.string().trim().min(2, 'stateName must be at least 2 characters').max(120);
const countryCode = z.string().trim().regex(/^[A-Za-z]{2}$/, 'countryCode must be a 2-letter ISO code')
  .transform((value) => value.toUpperCase());

export const createCitySchema = z.object({
  name,
  stateName,
  countryCode: countryCode.default('IN'),
  isActive: z.boolean().optional().default(true),
}).strict();

export const updateCitySchema = z.object({
  name: name.optional(),
  stateName: stateName.optional(),
  countryCode: countryCode.optional(),
  isActive: z.boolean().optional(),
}).strict().refine((body) => Object.keys(body).length > 0, {
  message: 'At least one field is required',
});

export const listCitiesSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(120).optional(),
  stateName: z.string().trim().max(120).optional(),
  countryCode: countryCode.optional(),
  isActive: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
}).strict();
