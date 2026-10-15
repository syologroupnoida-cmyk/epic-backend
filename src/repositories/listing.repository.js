import prisma from '../config/db.js';

const CITY_SELECT = {
  id: true,
  name: true,
  slug: true,
  stateName: true,
  countryCode: true,
  isActive: true,
};

const SUBCATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  serviceCategory: {
    select: {
      id: true,
      name: true,
      slug: true,
      offeringKind: true,
    },
  },
};

const COMPONENT_SELECT = {
  id: true,
  price: true,
  metadata: true,
  sortOrder: true,
  subcategory: { select: SUBCATEGORY_SELECT },
};

const MEDIA_SELECT = {
  id: true,
  url: true,
  publicId: true,
  mediaType: true,
  sortOrder: true,
};

const VENDOR_SELECT = {
  userId: true,
  businessName: true,
  slug: true,
  logoUrl: true,
  about: true,
};

const PRIVATE_LISTING_SELECT = {
  id: true,
  vendorUserId: true,
  listingType: true,
  title: true,
  slug: true,
  description: true,
  startingPrice: true,
  priceType: true,
  metadata: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedByAdminId: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
  city: { select: CITY_SELECT },
  components: { orderBy: { sortOrder: 'asc' }, select: COMPONENT_SELECT },
  media: { orderBy: { sortOrder: 'asc' }, select: MEDIA_SELECT },
};

const PUBLIC_LISTING_SELECT = {
  id: true,
  listingType: true,
  title: true,
  slug: true,
  description: true,
  startingPrice: true,
  priceType: true,
  metadata: true,
  createdAt: true,
  city: { select: CITY_SELECT },
  vendor: { select: VENDOR_SELECT },
  components: {
    where: {
      subcategory: { isActive: true, serviceCategory: { isActive: true } },
    },
    orderBy: { sortOrder: 'asc' },
    select: COMPONENT_SELECT,
  },
  media: { orderBy: { sortOrder: 'asc' }, select: MEDIA_SELECT },
};

export const findActiveCityById = (id) => prisma.city.findFirst({
  where: { id, isActive: true },
  select: CITY_SELECT,
});

export const findApprovedServiceCapabilities = (vendorUserId, serviceSubcategoryIds) =>
  prisma.vendorCapability.findMany({
    where: {
      vendorUserId,
      serviceSubcategoryId: { in: serviceSubcategoryIds },
      status: 'APPROVED',
      subcategory: {
        isActive: true,
        serviceCategory: { isActive: true, offeringKind: 'SERVICE' },
      },
    },
    select: { serviceSubcategoryId: true },
  });

export const createServiceListing = ({ data, components, media }) =>
  prisma.vendorListing.create({
    data: {
      ...data,
      listingType: 'SERVICE',
      components: { create: components },
      media: { create: media },
    },
    select: PRIVATE_LISTING_SELECT,
  });

export const findVendorListingById = (vendorUserId, id) =>
  prisma.vendorListing.findFirst({
    where: { id, vendorUserId },
    select: PRIVATE_LISTING_SELECT,
  });

export const updateVendorListing = ({ id, data, components, media }) =>
  prisma.vendorListing.update({
    where: { id },
    data: {
      ...data,
      ...(components && {
        components: {
          deleteMany: {},
          create: components,
        },
      }),
      ...(media && {
        media: {
          deleteMany: {},
          create: media,
        },
      }),
    },
    select: PRIVATE_LISTING_SELECT,
  });

export const listVendorListings = async ({ vendorUserId, page, limit, status }) => {
  const where = { vendorUserId, ...(status && { status }) };
  const [listings, total] = await Promise.all([
    prisma.vendorListing.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: PRIVATE_LISTING_SELECT,
    }),
    prisma.vendorListing.count({ where }),
  ]);
  return { listings, total };
};

export const submitVendorListing = (id) => prisma.vendorListing.update({
  where: { id },
  data: {
    status: 'PENDING_REVIEW',
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedByAdminId: null,
    rejectionReason: null,
  },
  select: PRIVATE_LISTING_SELECT,
});

export const findListingForAdmin = (id) => prisma.vendorListing.findUnique({
  where: { id },
  select: {
    ...PRIVATE_LISTING_SELECT,
    vendor: { select: VENDOR_SELECT },
  },
});

export const listAdminListings = async ({ page, limit, status, vendorUserId }) => {
  const where = { ...(status && { status }), ...(vendorUserId && { vendorUserId }) };
  const [listings, total] = await Promise.all([
    prisma.vendorListing.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { submittedAt: 'asc' },
      select: { ...PRIVATE_LISTING_SELECT, vendor: { select: VENDOR_SELECT } },
    }),
    prisma.vendorListing.count({ where }),
  ]);
  return { listings, total };
};

export const reviewListing = ({ id, adminId, status, rejectionReason = null }) =>
  prisma.vendorListing.update({
    where: { id },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedByAdminId: adminId,
      rejectionReason,
    },
    select: { ...PRIVATE_LISTING_SELECT, vendor: { select: VENDOR_SELECT } },
  });

const publicListingWhere = ({ search, cityId, serviceSubcategoryId } = {}) => ({
  listingType: 'SERVICE',
  status: 'ACTIVE',
  vendor: {
    is: {
      kycStatus: 'APPROVED',
      profileStatus: 'ACTIVE',
      user: { is: { isActive: true } },
    },
  },
  city: { is: { isActive: true } },
  ...(cityId && { cityId }),
  ...(search && {
    OR: [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ],
  }),
  components: {
    every: {
      subcategory: { isActive: true, serviceCategory: { isActive: true } },
    },
    ...(serviceSubcategoryId && {
      some: {
        serviceSubcategoryId,
        subcategory: { isActive: true, serviceCategory: { isActive: true } },
      },
    }),
  },
});

export const findPublicListingBySlug = (slug) => prisma.vendorListing.findFirst({
  where: { ...publicListingWhere(), slug },
  select: PUBLIC_LISTING_SELECT,
});

export const listPublicListings = async ({ page, limit, ...filters }) => {
  const where = publicListingWhere(filters);
  const [listings, total] = await Promise.all([
    prisma.vendorListing.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { updatedAt: 'desc' },
      select: PUBLIC_LISTING_SELECT,
    }),
    prisma.vendorListing.count({ where }),
  ]);
  return { listings, total };
};
