import { randomUUID } from 'node:crypto';
import { ApiError } from '../../utils/ApiError.js';
import { toSlug } from '../../utils/slug.js';
import { env } from '../../config/env.js';
import * as listingRepo from '../../repositories/listing.repository.js';
import * as profileRepo from '../../repositories/vendorProfile.repository.js';

const pageInfo = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

const serializeCity = (city) => city && ({
  id: city.id,
  name: city.name,
  slug: city.slug,
  stateName: city.stateName,
  countryCode: city.countryCode,
});

const serializeComponent = (component) => ({
  id: component.id,
  price: component.price,
  metadata: component.metadata,
  sortOrder: component.sortOrder,
  service: {
    id: component.subcategory.id,
    name: component.subcategory.name,
    slug: component.subcategory.slug,
    description: component.subcategory.description,
    category: component.subcategory.serviceCategory,
  },
});

const serializePublicMedia = (media) => ({
  id: media.id,
  url: media.url,
  mediaType: media.mediaType,
  sortOrder: media.sortOrder,
});

const serializeVendorMedia = (media) => ({
  ...serializePublicMedia(media),
  publicId: media.publicId,
});

const serializeVendorListing = (listing) => ({
  id: listing.id,
  listingType: listing.listingType,
  title: listing.title,
  slug: listing.slug,
  description: listing.description,
  startingPrice: listing.startingPrice,
  priceType: listing.priceType,
  city: serializeCity(listing.city),
  serviceAreas: listing.serviceAreas.map(({ city }) => serializeCity(city)),
  metadata: listing.metadata,
  status: listing.status,
  submittedAt: listing.submittedAt,
  reviewedAt: listing.reviewedAt,
  rejectionReason: listing.rejectionReason,
  pausedAt: listing.pausedAt,
  pauseReason: listing.pauseReason,
  archivedAt: listing.archivedAt,
  services: listing.components.map(serializeComponent),
  media: listing.media.map(serializeVendorMedia),
  createdAt: listing.createdAt,
  updatedAt: listing.updatedAt,
});

const serializeRevision = (revision, includeCurrentListing = false) => ({
  id: revision.id,
  listingId: revision.listingId,
  status: revision.status,
  proposed: revision.payload,
  submittedAt: revision.submittedAt,
  reviewedAt: revision.reviewedAt,
  rejectionReason: revision.rejectionReason,
  createdAt: revision.createdAt,
  updatedAt: revision.updatedAt,
  ...(includeCurrentListing && revision.listing && {
    currentListing: {
      ...serializeVendorListing(revision.listing),
      vendor: revision.listing.vendor,
    },
  }),
});

const serializePublicListing = (listing) => ({
  id: listing.id,
  listingType: listing.listingType,
  title: listing.title,
  slug: listing.slug,
  description: listing.description,
  startingPrice: listing.startingPrice,
  priceType: listing.priceType,
  city: serializeCity(listing.city),
  serviceAreas: listing.serviceAreas.map(({ city }) => serializeCity(city)),
  metadata: listing.metadata,
  services: listing.components.map(serializeComponent),
  media: listing.media.map(serializePublicMedia),
  vendor: {
    vendorId: listing.vendor.userId,
    businessName: listing.vendor.businessName,
    slug: listing.vendor.slug,
    logoUrl: listing.vendor.logoUrl,
    about: listing.vendor.about,
  },
  createdAt: listing.createdAt,
});

const assertApprovedVendor = async (vendorUserId) => {
  const profile = await profileRepo.findVendorBusinessProfile(vendorUserId);
  if (!profile) throw ApiError.notFound('Vendor profile not found.');
  if (profile.kycStatus !== 'APPROVED') {
    throw ApiError.forbidden('Your KYC must be approved before you can manage listings.');
  }
  return profile;
};

const buildListingSlug = (title) => {
  const base = toSlug(title);
  if (!base) throw ApiError.badRequest('Listing title must contain letters or numbers.');
  return `${base}-${randomUUID().replaceAll('-', '').slice(0, 10)}`;
};

const assertActiveCity = async (cityId) => {
  const city = await listingRepo.findActiveCityById(cityId);
  if (!city) throw ApiError.badRequest('Select an active listing city.');
  return city;
};

const assertActiveServiceAreas = async ({ cityIds, primaryCityId }) => {
  if (!cityIds.includes(primaryCityId)) {
    throw ApiError.badRequest('Service areas must include the primary city.');
  }
  const activeCities = await listingRepo.findActiveCitiesByIds(cityIds);
  if (activeCities.length !== cityIds.length) {
    throw ApiError.badRequest('Select only active service area cities.');
  }
  return activeCities;
};

const assertApprovedServiceCapabilities = async (vendorUserId, components) => {
  const ids = components.map(({ serviceSubcategoryId }) => serviceSubcategoryId);
  const capabilities = await listingRepo.findApprovedServiceCapabilities(vendorUserId, ids);
  if (capabilities.length !== ids.length) {
    throw ApiError.forbidden(
      'Every listing service must be an active service capability selected by this vendor.',
    );
  }
};

const assertOwnedMedia = ({ vendorUserId, media }) => {
  const expectedPrefix = `epic-wedplanner/listing-media/${vendorUserId}/`;
  for (const asset of media) {
    let parsedUrl;
    let decodedPath;
    try {
      parsedUrl = new URL(asset.url);
      decodedPath = decodeURIComponent(parsedUrl.pathname);
    } catch {
      throw ApiError.badRequest('Listing media URL is invalid.');
    }
    const owned = parsedUrl.protocol === 'https:' &&
      parsedUrl.hostname === 'res.cloudinary.com' &&
      decodedPath.startsWith(`/${env.CLOUDINARY_CLOUD_NAME}/`) &&
      asset.publicId.startsWith(expectedPrefix) &&
      decodedPath.includes(`/${asset.publicId}`);
    if (!owned) {
      throw ApiError.badRequest('Listing media must be uploaded by this vendor using upload purpose listing-media.');
    }
  }
};

const mapComponents = (components) => components.map((component, sortOrder) => ({
  ...component,
  sortOrder,
}));

const mapMedia = (media) => media.map((asset, sortOrder) => ({
  ...asset,
  sortOrder,
}));

const listingSnapshot = (listing) => ({
  title: listing.title,
  description: listing.description,
  startingPrice: listing.startingPrice,
  priceType: listing.priceType,
  cityId: listing.city.id,
  serviceAreaCityIds: listing.serviceAreas.map(({ city }) => city.id),
  metadata: listing.metadata,
  services: listing.components.map((component) => ({
    serviceSubcategoryId: component.subcategory.id,
    price: component.price,
    metadata: component.metadata,
  })),
  media: listing.media.map((asset) => ({
    url: asset.url,
    publicId: asset.publicId,
    mediaType: asset.mediaType,
  })),
});

const validateRevisionSnapshot = async ({ vendorUserId, payload }) => {
  await assertActiveCity(payload.cityId);
  await assertActiveServiceAreas({
    cityIds: payload.serviceAreaCityIds,
    primaryCityId: payload.cityId,
  });
  await assertApprovedServiceCapabilities(vendorUserId, payload.services);
  assertOwnedMedia({ vendorUserId, media: payload.media });
};

const assertEditable = (listing) => {
  if (!['DRAFT', 'REJECTED'].includes(listing.status)) {
    throw ApiError.conflict('Only draft or rejected listings can be edited.');
  }
};

export const createServiceListing = async ({ vendorUserId, payload }) => {
  await assertApprovedVendor(vendorUserId);
  await assertActiveCity(payload.cityId);
  const serviceAreaCityIds = payload.serviceAreaCityIds ?? [payload.cityId];
  await assertActiveServiceAreas({ cityIds: serviceAreaCityIds, primaryCityId: payload.cityId });
  await assertApprovedServiceCapabilities(vendorUserId, payload.services);
  assertOwnedMedia({ vendorUserId, media: payload.media });

  const listing = await listingRepo.createServiceListing({
    data: {
      vendorUserId,
      title: payload.title,
      slug: buildListingSlug(payload.title),
      description: payload.description,
      startingPrice: payload.startingPrice,
      priceType: payload.priceType,
      cityId: payload.cityId,
      metadata: payload.metadata,
      status: payload.submitForReview ? 'PENDING_REVIEW' : 'DRAFT',
      ...(payload.submitForReview && { submittedAt: new Date() }),
    },
    serviceAreaCityIds,
    components: mapComponents(payload.services),
    media: mapMedia(payload.media),
  });
  return serializeVendorListing(listing);
};

export const getMyListing = async ({ vendorUserId, listingId }) => {
  const listing = await listingRepo.findVendorListingById(vendorUserId, listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  return serializeVendorListing(listing);
};

export const listMyListings = async ({ vendorUserId, query }) => {
  const { listings, total } = await listingRepo.listVendorListings({ vendorUserId, ...query });
  return {
    listings: listings.map(serializeVendorListing),
    pagination: pageInfo(total, query.page, query.limit),
  };
};

export const updateMyListing = async ({ vendorUserId, listingId, payload }) => {
  await assertApprovedVendor(vendorUserId);
  const current = await listingRepo.findVendorListingById(vendorUserId, listingId);
  if (!current) throw ApiError.notFound('Listing not found.');
  assertEditable(current);

  const primaryCityId = payload.cityId ?? current.city.id;
  const serviceAreaCityIds = payload.serviceAreaCityIds ?? (
    payload.cityId
      ? [...new Set([...current.serviceAreas.map(({ city }) => city.id), payload.cityId])]
      : current.serviceAreas.map(({ city }) => city.id)
  );
  if (payload.cityId) await assertActiveCity(payload.cityId);
  if (payload.cityId || payload.serviceAreaCityIds) {
    await assertActiveServiceAreas({ cityIds: serviceAreaCityIds, primaryCityId });
  }
  if (payload.services) await assertApprovedServiceCapabilities(vendorUserId, payload.services);
  if (payload.media) assertOwnedMedia({ vendorUserId, media: payload.media });

  const listing = await listingRepo.updateVendorListing({
    id: listingId,
    data: {
      ...(payload.title !== undefined && { title: payload.title }),
      ...(payload.description !== undefined && { description: payload.description }),
      ...(payload.startingPrice !== undefined && { startingPrice: payload.startingPrice }),
      ...(payload.priceType !== undefined && { priceType: payload.priceType }),
      ...(payload.cityId !== undefined && { cityId: payload.cityId }),
      ...(payload.metadata !== undefined && { metadata: payload.metadata }),
      ...(current.status === 'REJECTED' && { rejectionReason: null }),
    },
    ...(payload.cityId || payload.serviceAreaCityIds ? { serviceAreaCityIds } : {}),
    ...(payload.services && { components: mapComponents(payload.services) }),
    ...(payload.media && { media: mapMedia(payload.media) }),
  });
  return serializeVendorListing(listing);
};

export const createMyListingRevision = async ({ vendorUserId, listingId }) => {
  await assertApprovedVendor(vendorUserId);
  const listing = await listingRepo.findVendorListingById(vendorUserId, listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  if (listing.status !== 'ACTIVE') {
    throw ApiError.conflict('Only active listings use the revision workflow. Edit draft or rejected listings directly.');
  }

  const existing = await listingRepo.findOpenVendorRevision(vendorUserId, listingId);
  if (existing) return serializeRevision(existing);

  const revision = await listingRepo.createVendorRevision({
    listingId,
    vendorUserId,
    payload: listingSnapshot(listing),
  });
  return serializeRevision(revision);
};

export const getMyListingRevision = async ({ vendorUserId, listingId }) => {
  const revision = await listingRepo.findOpenVendorRevision(vendorUserId, listingId);
  if (!revision) throw ApiError.notFound('Open listing revision not found.');
  return serializeRevision(revision);
};

export const updateMyListingRevision = async ({ vendorUserId, listingId, payload }) => {
  await assertApprovedVendor(vendorUserId);
  const listing = await listingRepo.findVendorListingById(vendorUserId, listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  if (listing.status !== 'ACTIVE') {
    throw ApiError.conflict('The live listing must be active while its revision is edited.');
  }
  const revision = await listingRepo.findOpenVendorRevision(vendorUserId, listingId);
  if (!revision) throw ApiError.notFound('Open listing revision not found.');
  if (!['DRAFT', 'REJECTED'].includes(revision.status)) {
    throw ApiError.conflict('A revision pending review cannot be edited.');
  }

  const proposed = {
    ...revision.payload,
    ...payload,
    ...(payload.cityId && !payload.serviceAreaCityIds && {
      serviceAreaCityIds: [...new Set([...revision.payload.serviceAreaCityIds, payload.cityId])],
    }),
  };
  await validateRevisionSnapshot({ vendorUserId, payload: proposed });
  return serializeRevision(await listingRepo.updateVendorRevision({ id: revision.id, payload: proposed }));
};

export const submitMyListingRevision = async ({ vendorUserId, listingId }) => {
  await assertApprovedVendor(vendorUserId);
  const listing = await listingRepo.findVendorListingById(vendorUserId, listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  if (listing.status !== 'ACTIVE') {
    throw ApiError.conflict('The live listing must be active before its revision can be submitted.');
  }
  const revision = await listingRepo.findOpenVendorRevision(vendorUserId, listingId);
  if (!revision) throw ApiError.notFound('Open listing revision not found.');
  if (!['DRAFT', 'REJECTED'].includes(revision.status)) {
    throw ApiError.conflict('Only draft or rejected revisions can be submitted.');
  }
  await validateRevisionSnapshot({ vendorUserId, payload: revision.payload });
  return serializeRevision(await listingRepo.submitVendorRevision(revision.id));
};

export const cancelMyListingRevision = async ({ vendorUserId, listingId }) => {
  const revision = await listingRepo.findOpenVendorRevision(vendorUserId, listingId);
  if (!revision) throw ApiError.notFound('Open listing revision not found.');
  if (!['DRAFT', 'REJECTED'].includes(revision.status)) {
    throw ApiError.conflict('A revision pending review cannot be cancelled.');
  }
  return serializeRevision(await listingRepo.cancelVendorRevision(revision.id));
};

export const submitMyListing = async ({ vendorUserId, listingId }) => {
  await assertApprovedVendor(vendorUserId);
  const listing = await listingRepo.findVendorListingById(vendorUserId, listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  assertEditable(listing);
  await assertActiveCity(listing.city.id);
  await assertActiveServiceAreas({
    cityIds: listing.serviceAreas.map(({ city }) => city.id),
    primaryCityId: listing.city.id,
  });
  await assertApprovedServiceCapabilities(vendorUserId, listing.components.map((component) => ({
    serviceSubcategoryId: component.subcategory.id,
  })));

  return serializeVendorListing(await listingRepo.submitVendorListing(listingId));
};

export const archiveMyListing = async ({ vendorUserId, listingId }) => {
  const listing = await listingRepo.findVendorListingById(vendorUserId, listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  if (!['DRAFT', 'REJECTED', 'ACTIVE', 'PAUSED'].includes(listing.status)) {
    throw ApiError.conflict('Only draft, rejected, active, or paused listings can be archived.');
  }
  return serializeVendorListing(await listingRepo.archiveVendorListing(listingId));
};

export const unarchiveMyListing = async ({ vendorUserId, listingId }) => {
  const listing = await listingRepo.findVendorListingById(vendorUserId, listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  if (listing.status !== 'ARCHIVED') {
    throw ApiError.conflict('Only archived listings can be restored.');
  }
  return serializeVendorListing(await listingRepo.unarchiveVendorListing(listingId));
};

export const listListingsForAdmin = async (query) => {
  const { listings, total } = await listingRepo.listAdminListings(query);
  return {
    listings: listings.map((listing) => ({
      ...serializeVendorListing(listing),
      vendor: listing.vendor,
    })),
    pagination: pageInfo(total, query.page, query.limit),
  };
};

export const getListingForAdmin = async (listingId) => {
  const listing = await listingRepo.findListingForAdmin(listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  return {
    ...serializeVendorListing(listing),
    vendor: listing.vendor,
  };
};

export const listListingRevisionsForAdmin = async (query) => {
  const { revisions, total } = await listingRepo.listRevisionsForAdmin(query);
  return {
    revisions: revisions.map((revision) => serializeRevision(revision, true)),
    pagination: pageInfo(total, query.page, query.limit),
  };
};

export const getListingRevisionForAdmin = async (revisionId) => {
  const revision = await listingRepo.findRevisionForAdmin(revisionId);
  if (!revision) throw ApiError.notFound('Listing revision not found.');
  return serializeRevision(revision, true);
};

const requirePendingRevision = async (revisionId, { requireActiveListing = false } = {}) => {
  const revision = await listingRepo.findRevisionForAdmin(revisionId);
  if (!revision) throw ApiError.notFound('Listing revision not found.');
  if (revision.status !== 'PENDING_REVIEW') {
    throw ApiError.conflict('Only listing revisions pending review can be reviewed.');
  }
  if (requireActiveListing && revision.listing.status !== 'ACTIVE') {
    throw ApiError.conflict('The original listing must be active before its revision can be reviewed.');
  }
  return revision;
};

export const approveListingRevision = async ({ revisionId, adminId }) => {
  const revision = await requirePendingRevision(revisionId, { requireActiveListing: true });
  const proposed = revision.payload;
  await validateRevisionSnapshot({ vendorUserId: revision.vendorUserId, payload: proposed });
  const approved = await listingRepo.approveRevision({
    revisionId,
    adminId,
    listingId: revision.listingId,
    data: {
      title: proposed.title,
      description: proposed.description,
      startingPrice: proposed.startingPrice,
      priceType: proposed.priceType,
      cityId: proposed.cityId,
      metadata: proposed.metadata,
    },
    serviceAreaCityIds: proposed.serviceAreaCityIds,
    components: mapComponents(proposed.services),
    media: mapMedia(proposed.media),
  });
  return serializeRevision(approved, true);
};

export const rejectListingRevision = async ({ revisionId, adminId, reason }) => {
  await requirePendingRevision(revisionId);
  return serializeRevision(await listingRepo.rejectRevision({
    id: revisionId,
    adminId,
    reason,
  }), true);
};

const requirePendingListing = async (listingId) => {
  const listing = await listingRepo.findListingForAdmin(listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  if (listing.status !== 'PENDING_REVIEW') {
    throw ApiError.conflict('Only listings pending review can be reviewed.');
  }
  return listing;
};

export const approveListing = async ({ listingId, adminId }) => {
  const listing = await requirePendingListing(listingId);
  await assertActiveCity(listing.city.id);
  await assertActiveServiceAreas({
    cityIds: listing.serviceAreas.map(({ city }) => city.id),
    primaryCityId: listing.city.id,
  });
  await assertApprovedServiceCapabilities(listing.vendorUserId, listing.components.map((component) => ({
    serviceSubcategoryId: component.subcategory.id,
  })));
  const reviewed = await listingRepo.reviewListing({ listingId, adminId, status: 'ACTIVE' });
  return { ...serializeVendorListing(reviewed), vendor: reviewed.vendor };
};

export const rejectListing = async ({ listingId, adminId, reason }) => {
  await requirePendingListing(listingId);
  const reviewed = await listingRepo.reviewListing({
    listingId,
    adminId,
    status: 'REJECTED',
    rejectionReason: reason,
  });
  return { ...serializeVendorListing(reviewed), vendor: reviewed.vendor };
};

export const pauseListing = async ({ listingId, adminId, reason }) => {
  const listing = await listingRepo.findListingForAdmin(listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  if (listing.status !== 'ACTIVE') {
    throw ApiError.conflict('Only active listings can be paused.');
  }

  const paused = await listingRepo.pauseListing({ listingId, adminId, reason });
  return { ...serializeVendorListing(paused), vendor: paused.vendor };
};

export const resumeListing = async ({ listingId }) => {
  const listing = await listingRepo.findListingForAdmin(listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  if (listing.status !== 'PAUSED') {
    throw ApiError.conflict('Only paused listings can be resumed.');
  }

  await assertActiveCity(listing.city.id);
  await assertActiveServiceAreas({
    cityIds: listing.serviceAreas.map(({ city }) => city.id),
    primaryCityId: listing.city.id,
  });
  await assertApprovedServiceCapabilities(listing.vendorUserId, listing.components.map((component) => ({
    serviceSubcategoryId: component.subcategory.id,
  })));

  const resumed = await listingRepo.resumeListing(listingId);
  return { ...serializeVendorListing(resumed), vendor: resumed.vendor };
};

export const getPublicListing = async (slug) => {
  const listing = await listingRepo.findPublicListingBySlug(slug);
  if (!listing) throw ApiError.notFound('Listing not found.');
  return serializePublicListing(listing);
};

export const listPublicListings = async (query) => {
  const { listings, total } = await listingRepo.listPublicListings(query);
  return {
    listings: listings.map(serializePublicListing),
    pagination: pageInfo(total, query.page, query.limit),
  };
};
