import { randomUUID } from 'node:crypto';
import { ApiError } from '../../utils/ApiError.js';
import { toSlug } from '../../utils/slug.js';
import { env } from '../../config/env.js';
import * as repo from '../../repositories/venueProperty.repository.js';
import * as profileRepo from '../../repositories/vendorProfile.repository.js';

const pageInfo = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 });
const city = (value) => value && ({ id: value.id, name: value.name, slug: value.slug, stateName: value.stateName, countryCode: value.countryCode });
const type = (value) => ({ id: value.id, sortOrder: value.sortOrder, venueType: { id: value.subcategory.id, name: value.subcategory.name, slug: value.subcategory.slug, description: value.subcategory.description, category: value.subcategory.serviceCategory } });
const publicMedia = (value) => ({ id: value.id, url: value.url, mediaType: value.mediaType, sortOrder: value.sortOrder });
const vendorMedia = (value) => ({ ...publicMedia(value), publicId: value.publicId });
const serialize = (item) => ({
  id: item.id, title: item.title, slug: item.slug, description: item.description, startingPrice: item.startingPrice, priceType: item.priceType,
  city: city(item.city), address: item.address, capacityMin: item.capacityMin, capacityMax: item.capacityMax, rooms: item.rooms, parkingCapacity: item.parkingCapacity, amenities: item.amenities, metadata: item.metadata,
  status: item.status, submittedAt: item.submittedAt, reviewedAt: item.reviewedAt, rejectionReason: item.rejectionReason, pausedAt: item.pausedAt, pauseReason: item.pauseReason, archivedAt: item.archivedAt,
  venueTypes: item.types.map(type), media: item.media.map(vendorMedia), createdAt: item.createdAt, updatedAt: item.updatedAt,
});
const serializePublic = (item) => ({
  id: item.id, title: item.title, slug: item.slug, description: item.description, startingPrice: item.startingPrice, priceType: item.priceType,
  city: city(item.city), address: item.address, capacityMin: item.capacityMin, capacityMax: item.capacityMax, rooms: item.rooms, parkingCapacity: item.parkingCapacity, amenities: item.amenities, metadata: item.metadata,
  venueTypes: item.types.map(type), media: item.media.map(publicMedia), vendor: { vendorId: item.vendor.userId, businessName: item.vendor.businessName, slug: item.vendor.slug, logoUrl: item.vendor.logoUrl, about: item.vendor.about }, createdAt: item.createdAt,
});
const mapTypes = (ids) => ids.map((serviceSubcategoryId, sortOrder) => ({ serviceSubcategoryId, sortOrder }));
const mapMedia = (items) => items.map((item, sortOrder) => ({ ...item, sortOrder }));
const slug = (title) => {
  const base = toSlug(title);
  if (!base) throw ApiError.badRequest('Venue property title must contain letters or numbers.');
  return `${base}-${randomUUID().replaceAll('-', '').slice(0, 10)}`;
};
const approvedVendor = async (vendorUserId) => {
  const profile = await profileRepo.findVendorBusinessProfile(vendorUserId);
  if (!profile) throw ApiError.notFound('Vendor profile not found.');
  if (profile.kycStatus !== 'APPROVED') throw ApiError.forbidden('Your KYC must be approved before you can manage venue properties.');
};
const activeCity = async (cityId) => {
  if (!await repo.findActiveCity(cityId)) throw ApiError.badRequest('Select an active venue city.');
};
const venueCapabilities = async (vendorUserId, ids) => {
  const capabilities = await repo.findApprovedVenueCapabilities(vendorUserId, ids);
  if (capabilities.length !== ids.length) throw ApiError.forbidden('Every venue type must be an active approved venue-property capability of this vendor.');
};
const ownedMedia = ({ vendorUserId, media }) => {
  const prefix = `epic-wedplanner/venue-property-media/${vendorUserId}/`;
  for (const asset of media) {
    let url; let path;
    try { url = new URL(asset.url); path = decodeURIComponent(url.pathname); } catch { throw ApiError.badRequest('Venue media URL is invalid.'); }
    if (!(url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' && path.startsWith(`/${env.CLOUDINARY_CLOUD_NAME}/`) && asset.publicId.startsWith(prefix) && path.includes(`/${asset.publicId}`))) {
      throw ApiError.badRequest('Venue media must be uploaded by this vendor using upload purpose venue-property-media.');
    }
  }
};
const editable = (item) => {
  if (!['DRAFT', 'REJECTED'].includes(item.status)) throw ApiError.conflict('Only draft or rejected venue properties can be edited.');
};

export const create = async ({ vendorUserId, payload }) => {
  await approvedVendor(vendorUserId); await activeCity(payload.cityId); await venueCapabilities(vendorUserId, payload.venueTypes); ownedMedia({ vendorUserId, media: payload.media });
  return serialize(await repo.create({ data: {
    vendorUserId, title: payload.title, slug: slug(payload.title), description: payload.description, startingPrice: payload.startingPrice, priceType: payload.priceType, cityId: payload.cityId,
    address: payload.address, capacityMin: payload.capacityMin, capacityMax: payload.capacityMax, rooms: payload.rooms, parkingCapacity: payload.parkingCapacity, amenities: payload.amenities, metadata: payload.metadata,
    status: payload.submitForReview ? 'PENDING_REVIEW' : 'DRAFT', ...(payload.submitForReview && { submittedAt: new Date() }),
  }, types: mapTypes(payload.venueTypes), media: mapMedia(payload.media) }));
};
export const getMine = async ({ vendorUserId, venuePropertyId }) => { const item = await repo.findVendorById(vendorUserId, venuePropertyId); if (!item) throw ApiError.notFound('Venue property not found.'); return serialize(item); };
export const listMine = async ({ vendorUserId, query }) => { const { items, total } = await repo.listVendor({ vendorUserId, ...query }); return { venueProperties: items.map(serialize), pagination: pageInfo(total, query.page, query.limit) }; };
export const updateMine = async ({ vendorUserId, venuePropertyId, payload }) => {
  await approvedVendor(vendorUserId); const current = await repo.findVendorById(vendorUserId, venuePropertyId); if (!current) throw ApiError.notFound('Venue property not found.'); editable(current);
  if (payload.cityId) await activeCity(payload.cityId); if (payload.venueTypes) await venueCapabilities(vendorUserId, payload.venueTypes); if (payload.media) ownedMedia({ vendorUserId, media: payload.media });
  return serialize(await repo.update({ id: venuePropertyId, data: { ...Object.fromEntries(Object.entries(payload).filter(([key]) => !['venueTypes', 'media'].includes(key))), ...(current.status === 'REJECTED' && { rejectionReason: null }) }, ...(payload.venueTypes && { types: mapTypes(payload.venueTypes) }), ...(payload.media && { media: mapMedia(payload.media) }) }));
};
export const submitMine = async ({ vendorUserId, venuePropertyId }) => {
  await approvedVendor(vendorUserId); const item = await repo.findVendorById(vendorUserId, venuePropertyId); if (!item) throw ApiError.notFound('Venue property not found.'); editable(item);
  await activeCity(item.city.id); await venueCapabilities(vendorUserId, item.types.map((value) => value.subcategory.id)); return serialize(await repo.submit(venuePropertyId));
};
export const archiveMine = async ({ vendorUserId, venuePropertyId }) => {
  const item = await repo.findVendorById(vendorUserId, venuePropertyId); if (!item) throw ApiError.notFound('Venue property not found.');
  if (!['DRAFT', 'REJECTED', 'ACTIVE', 'PAUSED'].includes(item.status)) throw ApiError.conflict('Only draft, rejected, active, or paused venue properties can be archived.'); return serialize(await repo.archive(venuePropertyId));
};
export const unarchiveMine = async ({ vendorUserId, venuePropertyId }) => { const item = await repo.findVendorById(vendorUserId, venuePropertyId); if (!item) throw ApiError.notFound('Venue property not found.'); if (item.status !== 'ARCHIVED') throw ApiError.conflict('Only archived venue properties can be restored.'); return serialize(await repo.unarchive(venuePropertyId)); };
export const listAdmin = async (query) => { const { items, total } = await repo.listAdmin(query); return { venueProperties: items.map((item) => ({ ...serialize(item), vendor: item.vendor })), pagination: pageInfo(total, query.page, query.limit) }; };
export const getAdmin = async (id) => { const item = await repo.findAdminById(id); if (!item) throw ApiError.notFound('Venue property not found.'); return { ...serialize(item), vendor: item.vendor }; };
const pending = async (id) => { const item = await repo.findAdminById(id); if (!item) throw ApiError.notFound('Venue property not found.'); if (item.status !== 'PENDING_REVIEW') throw ApiError.conflict('Only venue properties pending review can be reviewed.'); return item; };
export const approve = async ({ id, adminId }) => { const item = await pending(id); await activeCity(item.city.id); await venueCapabilities(item.vendorUserId, item.types.map((value) => value.subcategory.id)); const result = await repo.review({ id, adminId, status: 'ACTIVE' }); return { ...serialize(result), vendor: result.vendor }; };
export const reject = async ({ id, adminId, reason }) => { await pending(id); const result = await repo.review({ id, adminId, status: 'REJECTED', rejectionReason: reason }); return { ...serialize(result), vendor: result.vendor }; };
export const pause = async ({ id, adminId, reason }) => { const item = await repo.findAdminById(id); if (!item) throw ApiError.notFound('Venue property not found.'); if (item.status !== 'ACTIVE') throw ApiError.conflict('Only active venue properties can be paused.'); const result = await repo.pause({ id, adminId, reason }); return { ...serialize(result), vendor: result.vendor }; };
export const resume = async (id) => { const item = await repo.findAdminById(id); if (!item) throw ApiError.notFound('Venue property not found.'); if (item.status !== 'PAUSED') throw ApiError.conflict('Only paused venue properties can be resumed.'); await activeCity(item.city.id); await venueCapabilities(item.vendorUserId, item.types.map((value) => value.subcategory.id)); const result = await repo.resume(id); return { ...serialize(result), vendor: result.vendor }; };
export const getPublic = async (slugValue) => { const item = await repo.findPublicBySlug(slugValue); if (!item) throw ApiError.notFound('Venue property not found.'); return serializePublic(item); };
export const listPublic = async (query) => { const { items, total } = await repo.listPublic(query); return { venueProperties: items.map(serializePublic), pagination: pageInfo(total, query.page, query.limit) }; };
