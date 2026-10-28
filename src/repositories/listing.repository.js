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

const SERVICE_AREA_SELECT = {
  city: { select: CITY_SELECT },
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
  pausedAt: true,
  pausedByAdminId: true,
  pauseReason: true,
  archivedAt: true,
  createdAt: true,
  updatedAt: true,
  city: { select: CITY_SELECT },
  serviceAreas: { orderBy: { city: { name: 'asc' } }, select: SERVICE_AREA_SELECT },
  components: { orderBy: { sortOrder: 'asc' }, select: COMPONENT_SELECT },
  media: { orderBy: { sortOrder: 'asc' }, select: MEDIA_SELECT },
};

const REVISION_SELECT = {
  id: true,
  listingId: true,
  vendorUserId: true,
  payload: true,
  status: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedByAdminId: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
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
  serviceAreas: { orderBy: { city: { name: 'asc' } }, select: SERVICE_AREA_SELECT },
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

export const findActiveCitiesByIds = (ids) => prisma.city.findMany({
  where: { id: { in: ids }, isActive: true },
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

export const createServiceListing = ({ data, serviceAreaCityIds, components, media }) =>
  prisma.vendorListing.create({
    data: {
      ...data,
      listingType: 'SERVICE',
      serviceAreas: { create: serviceAreaCityIds.map((cityId) => ({ cityId })) },
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

export const updateVendorListing = ({ id, data, serviceAreaCityIds, components, media }) =>
  prisma.vendorListing.update({
    where: { id },
    data: {
      ...data,
      ...(serviceAreaCityIds && {
        serviceAreas: {
          deleteMany: {},
          create: serviceAreaCityIds.map((cityId) => ({ cityId })),
        },
      }),
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

export const findOpenVendorRevision = (vendorUserId, listingId) =>
  prisma.vendorListingRevision.findFirst({
    where: {
      listingId,
      vendorUserId,
      status: { in: ['DRAFT', 'PENDING_REVIEW', 'REJECTED'] },
    },
    select: REVISION_SELECT,
  });

export const createVendorRevision = ({ listingId, vendorUserId, payload }) =>
  prisma.vendorListingRevision.create({
    data: { listingId, vendorUserId, payload },
    select: REVISION_SELECT,
  });

export const updateVendorRevision = ({ id, payload }) =>
  prisma.vendorListingRevision.update({
    where: { id },
    data: { payload, rejectionReason: null },
    select: REVISION_SELECT,
  });

export const submitVendorRevision = (id) => prisma.vendorListingRevision.update({
  where: { id },
  data: {
    status: 'PENDING_REVIEW',
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedByAdminId: null,
    rejectionReason: null,
  },
  select: REVISION_SELECT,
});

export const cancelVendorRevision = (id) => prisma.vendorListingRevision.update({
  where: { id },
  data: { status: 'CANCELLED' },
  select: REVISION_SELECT,
});

export const findRevisionForAdmin = (id) => prisma.vendorListingRevision.findUnique({
  where: { id },
  select: {
    ...REVISION_SELECT,
    listing: {
      select: { ...PRIVATE_LISTING_SELECT, vendor: { select: VENDOR_SELECT } },
    },
  },
});

export const listRevisionsForAdmin = async ({ page, limit, status, vendorUserId, listingId }) => {
  const where = {
    ...(status && { status }),
    ...(vendorUserId && { vendorUserId }),
    ...(listingId && { listingId }),
  };
  const [revisions, total] = await Promise.all([
    prisma.vendorListingRevision.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ submittedAt: 'asc' }, { createdAt: 'asc' }],
      select: {
        ...REVISION_SELECT,
        listing: {
          select: { ...PRIVATE_LISTING_SELECT, vendor: { select: VENDOR_SELECT } },
        },
      },
    }),
    prisma.vendorListingRevision.count({ where }),
  ]);
  return { revisions, total };
};

export const rejectRevision = ({ id, adminId, reason }) =>
  prisma.vendorListingRevision.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedAt: new Date(),
      reviewedByAdminId: adminId,
      rejectionReason: reason,
    },
    select: {
      ...REVISION_SELECT,
      listing: {
        select: { ...PRIVATE_LISTING_SELECT, vendor: { select: VENDOR_SELECT } },
      },
    },
  });

export const approveRevision = ({ revisionId, adminId, listingId, data, serviceAreaCityIds, components, media }) =>
  prisma.$transaction(async (tx) => {
    await tx.vendorListing.update({
      where: { id: listingId },
      data: {
        ...data,
        serviceAreas: {
          deleteMany: {},
          create: serviceAreaCityIds.map((cityId) => ({ cityId })),
        },
        components: { deleteMany: {}, create: components },
        media: { deleteMany: {}, create: media },
      },
    });
    return tx.vendorListingRevision.update({
      where: { id: revisionId },
      data: {
        status: 'APPROVED',
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
        rejectionReason: null,
      },
      select: {
        ...REVISION_SELECT,
        listing: {
          select: { ...PRIVATE_LISTING_SELECT, vendor: { select: VENDOR_SELECT } },
        },
      },
    });
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

export const listAdminListings = async ({
  page,
  limit,
  status,
  vendorUserId,
  listingType,
  cityId,
  serviceSubcategoryId,
}) => {
  const where = {
    ...(status && { status }),
    ...(vendorUserId && { vendorUserId }),
    ...(listingType && { listingType }),
    ...(cityId && { serviceAreas: { some: { cityId } } }),
    ...(serviceSubcategoryId && { components: { some: { serviceSubcategoryId } } }),
  };
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

export const reviewListing = ({ listingId, adminId, status, rejectionReason = null }) =>
  prisma.vendorListing.update({
    where: { id: listingId },
    data: {
      status,
      reviewedAt: new Date(),
      reviewedByAdminId: adminId,
      rejectionReason,
    },
    select: { ...PRIVATE_LISTING_SELECT, vendor: { select: VENDOR_SELECT } },
  });

export const pauseListing = ({ listingId, adminId, reason }) =>
  prisma.vendorListing.update({
    where: { id: listingId },
    data: {
      status: 'PAUSED',
      pausedAt: new Date(),
      pausedByAdminId: adminId,
      pauseReason: reason,
    },
    select: { ...PRIVATE_LISTING_SELECT, vendor: { select: VENDOR_SELECT } },
  });

export const resumeListing = (listingId) => prisma.vendorListing.update({
  where: { id: listingId },
  data: {
    status: 'ACTIVE',
    pausedAt: null,
    pausedByAdminId: null,
    pauseReason: null,
  },
  select: { ...PRIVATE_LISTING_SELECT, vendor: { select: VENDOR_SELECT } },
});

export const archiveVendorListing = (id) => prisma.vendorListing.update({
  where: { id },
  data: {
    status: 'ARCHIVED',
    archivedAt: new Date(),
  },
  select: PRIVATE_LISTING_SELECT,
});

export const unarchiveVendorListing = (id) => prisma.vendorListing.update({
  where: { id },
  data: {
    status: 'DRAFT',
    archivedAt: null,
    submittedAt: null,
    reviewedAt: null,
    reviewedByAdminId: null,
    rejectionReason: null,
    pausedAt: null,
    pausedByAdminId: null,
    pauseReason: null,
  },
  select: PRIVATE_LISTING_SELECT,
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
  ...(cityId && { serviceAreas: { some: { cityId, city: { is: { isActive: true } } } } }),
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
