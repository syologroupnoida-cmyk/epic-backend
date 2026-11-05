import prisma from '../config/db.js';

export const PUBLIC_SELECT = {
  id: true,
  slug: true,
  businessName: true,
  category: true,
  website: true,
  address: true,
  city: true,
  state: true,
  pincode: true,
  rating: true,
  reviewCount: true,
  createdAt: true,
};

const ADMIN_SELECT = {
  ...PUBLIC_SELECT,
  keyword: true,
  location: true,
  phone: true,
  emails: true,
  googleCid: true,
  source: true,
  status: true,
  isPublished: true,
  salesNote: true,
  lastContactedAt: true,
  registeredVendorUserId: true,
  updatedAt: true,
};

const searchWhere = ({ search, category, city }) => ({
  ...(search && { OR: [
    { businessName: { contains: search, mode: 'insensitive' } },
    { category: { contains: search, mode: 'insensitive' } },
    { city: { contains: search, mode: 'insensitive' } },
  ] }),
  ...(category && { category: { equals: category, mode: 'insensitive' } }),
  ...(city && { city: { equals: city, mode: 'insensitive' } }),
});

const list = async ({ page, limit, where, select }) => {
  const [businesses, total] = await Promise.all([
    prisma.importedBusiness.findMany({ where, select, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.importedBusiness.count({ where }),
  ]);
  return { businesses, total };
};

export const listPublic = (query) => list({ ...query, where: { isPublished: true, ...searchWhere(query) }, select: PUBLIC_SELECT });
export const listAdmin = (query) => list({ ...query, where: { ...searchWhere(query), ...(query.status && { status: query.status }), ...(query.isPublished !== undefined && { isPublished: query.isPublished }) }, select: ADMIN_SELECT });
export const findPublicBySlug = (slug) => prisma.importedBusiness.findFirst({ where: { slug, isPublished: true }, select: PUBLIC_SELECT });
export const findAdminById = (id) => prisma.importedBusiness.findUnique({ where: { id }, select: ADMIN_SELECT });
export const findDuplicate = ({ googleCid, phone, emails }) => prisma.importedBusiness.findFirst({
  where: { OR: [
    ...(googleCid ? [{ googleCid }] : []),
    ...(phone ? [{ phone }] : []),
    ...emails.map((email) => ({ emails: { has: email } })),
  ] },
  select: { id: true },
});
export const create = (data) => prisma.importedBusiness.create({ data, select: ADMIN_SELECT });
export const update = ({ id, data }) => prisma.importedBusiness.update({ where: { id }, data, select: ADMIN_SELECT });
export const vendorExists = async (userId) => Boolean(await prisma.vendorProfile.findUnique({ where: { userId }, select: { userId: true } }));
export const createBatch = (data) => prisma.businessImportBatch.create({ data });
export const listBatches = async ({ page, limit }) => {
  const [batches, total] = await Promise.all([
    prisma.businessImportBatch.findMany({ skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.businessImportBatch.count(),
  ]);
  return { batches, total };
};
