import prisma from '../config/db.js';

const city = { id: true, name: true, slug: true, stateName: true, countryCode: true, isActive: true };
const vendor = { userId: true, businessName: true, slug: true, logoUrl: true, about: true };
const type = {
  id: true,
  sortOrder: true,
  subcategory: {
    select: {
      id: true, name: true, slug: true, description: true,
      serviceCategory: { select: { id: true, name: true, slug: true, offeringKind: true } },
    },
  },
};
const media = { id: true, url: true, publicId: true, mediaType: true, sortOrder: true };
const privateSelect = {
  id: true, vendorUserId: true, title: true, slug: true, description: true, startingPrice: true, priceType: true,
  address: true, capacityMin: true, capacityMax: true, rooms: true, parkingCapacity: true, amenities: true, metadata: true,
  status: true, submittedAt: true, reviewedAt: true, reviewedByAdminId: true, rejectionReason: true,
  pausedAt: true, pausedByAdminId: true, pauseReason: true, archivedAt: true, createdAt: true, updatedAt: true,
  city: { select: city }, types: { orderBy: { sortOrder: 'asc' }, select: type }, media: { orderBy: { sortOrder: 'asc' }, select: media },
};
const publicSelect = {
  id: true, title: true, slug: true, description: true, startingPrice: true, priceType: true,
  address: true, capacityMin: true, capacityMax: true, rooms: true, parkingCapacity: true, amenities: true, metadata: true, createdAt: true,
  city: { select: city }, vendor: { select: vendor },
  types: { where: { subcategory: { isActive: true, serviceCategory: { isActive: true } } }, orderBy: { sortOrder: 'asc' }, select: type },
  media: { orderBy: { sortOrder: 'asc' }, select: media },
};

export const findActiveCity = (id) => prisma.city.findFirst({ where: { id, isActive: true }, select: city });
export const findApprovedVenueCapabilities = (vendorUserId, ids) => prisma.vendorCapability.findMany({
  where: { vendorUserId, serviceSubcategoryId: { in: ids }, status: 'APPROVED', subcategory: { isActive: true, serviceCategory: { isActive: true, offeringKind: 'VENUE_PROPERTY' } } },
  select: { serviceSubcategoryId: true },
});
export const create = ({ data, types, media: venueMedia }) => prisma.venuePropertyListing.create({
  data: { ...data, types: { create: types }, media: { create: venueMedia } }, select: privateSelect,
});
export const findVendorById = (vendorUserId, id) => prisma.venuePropertyListing.findFirst({ where: { id, vendorUserId }, select: privateSelect });
export const update = ({ id, data, types, media: venueMedia }) => prisma.venuePropertyListing.update({
  where: { id }, data: { ...data, ...(types && { types: { deleteMany: {}, create: types } }), ...(venueMedia && { media: { deleteMany: {}, create: venueMedia } }) }, select: privateSelect,
});
export const submit = (id) => prisma.venuePropertyListing.update({
  where: { id }, data: { status: 'PENDING_REVIEW', submittedAt: new Date(), reviewedAt: null, reviewedByAdminId: null, rejectionReason: null }, select: privateSelect,
});
export const listVendor = async ({ vendorUserId, page, limit, status }) => {
  const where = { vendorUserId, ...(status && { status }) };
  const [items, total] = await Promise.all([prisma.venuePropertyListing.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: 'desc' }, select: privateSelect }), prisma.venuePropertyListing.count({ where })]);
  return { items, total };
};
export const findAdminById = (id) => prisma.venuePropertyListing.findUnique({ where: { id }, select: { ...privateSelect, vendor: { select: vendor } } });
export const listAdmin = async ({ page, limit, status, vendorUserId, cityId, serviceSubcategoryId }) => {
  const where = { ...(status && { status }), ...(vendorUserId && { vendorUserId }), ...(cityId && { cityId }), ...(serviceSubcategoryId && { types: { some: { serviceSubcategoryId } } }) };
  const [items, total] = await Promise.all([prisma.venuePropertyListing.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { submittedAt: 'asc' }, select: { ...privateSelect, vendor: { select: vendor } } }), prisma.venuePropertyListing.count({ where })]);
  return { items, total };
};
export const review = ({ id, adminId, status, rejectionReason = null }) => prisma.venuePropertyListing.update({ where: { id }, data: { status, reviewedAt: new Date(), reviewedByAdminId: adminId, rejectionReason }, select: { ...privateSelect, vendor: { select: vendor } } });
export const pause = ({ id, adminId, reason }) => prisma.venuePropertyListing.update({ where: { id }, data: { status: 'PAUSED', pausedAt: new Date(), pausedByAdminId: adminId, pauseReason: reason }, select: { ...privateSelect, vendor: { select: vendor } } });
export const resume = (id) => prisma.venuePropertyListing.update({ where: { id }, data: { status: 'ACTIVE', pausedAt: null, pausedByAdminId: null, pauseReason: null }, select: { ...privateSelect, vendor: { select: vendor } } });
export const archive = (id) => prisma.venuePropertyListing.update({ where: { id }, data: { status: 'ARCHIVED', archivedAt: new Date() }, select: privateSelect });
export const unarchive = (id) => prisma.venuePropertyListing.update({ where: { id }, data: { status: 'DRAFT', archivedAt: null, submittedAt: null, reviewedAt: null, reviewedByAdminId: null, rejectionReason: null, pausedAt: null, pausedByAdminId: null, pauseReason: null }, select: privateSelect });

const publicWhere = ({ search, cityId, serviceSubcategoryId } = {}) => ({
  status: 'ACTIVE', vendor: { is: { kycStatus: 'APPROVED', profileStatus: 'ACTIVE', user: { is: { isActive: true } } } }, city: { is: { isActive: true } },
  ...(cityId && { cityId }), ...(search && { OR: [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] }),
  types: { every: { subcategory: { isActive: true, serviceCategory: { isActive: true } } }, ...(serviceSubcategoryId && { some: { serviceSubcategoryId } }) },
});
export const findPublicBySlug = (slug) => prisma.venuePropertyListing.findFirst({ where: { ...publicWhere(), slug }, select: publicSelect });
export const listPublic = async ({ page, limit, ...filters }) => {
  const where = publicWhere(filters);
  const [items, total] = await Promise.all([prisma.venuePropertyListing.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { updatedAt: 'desc' }, select: publicSelect }), prisma.venuePropertyListing.count({ where })]);
  return { items, total };
};
