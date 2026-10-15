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
  metadata: listing.metadata,
  status: listing.status,
  submittedAt: listing.submittedAt,
  reviewedAt: listing.reviewedAt,
  rejectionReason: listing.rejectionReason,
  services: listing.components.map(serializeComponent),
  media: listing.media.map(serializeVendorMedia),
  createdAt: listing.createdAt,
  updatedAt: listing.updatedAt,
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

const assertEditable = (listing) => {
  if (!['DRAFT', 'REJECTED'].includes(listing.status)) {
    throw ApiError.conflict('Only draft or rejected listings can be edited.');
  }
};

export const createServiceListing = async ({ vendorUserId, payload }) => {
  await assertApprovedVendor(vendorUserId);
  await assertActiveCity(payload.cityId);
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
    },
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

  if (payload.cityId) await assertActiveCity(payload.cityId);
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
    ...(payload.services && { components: mapComponents(payload.services) }),
    ...(payload.media && { media: mapMedia(payload.media) }),
  });
  return serializeVendorListing(listing);
};

export const submitMyListing = async ({ vendorUserId, listingId }) => {
  await assertApprovedVendor(vendorUserId);
  const listing = await listingRepo.findVendorListingById(vendorUserId, listingId);
  if (!listing) throw ApiError.notFound('Listing not found.');
  assertEditable(listing);
  await assertActiveCity(listing.city.id);
  await assertApprovedServiceCapabilities(vendorUserId, listing.components.map((component) => ({
    serviceSubcategoryId: component.subcategory.id,
  })));

  return serializeVendorListing(await listingRepo.submitVendorListing(listingId));
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
