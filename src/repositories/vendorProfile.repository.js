import prisma from '../config/db.js';

const CITY_SELECT = {
  id: true,
  name: true,
  slug: true,
  stateName: true,
  countryCode: true,
  isActive: true,
};

const SELF_PROFILE_SELECT = {
  userId: true,
  kycStatus: true,
  businessName: true,
  slug: true,
  about: true,
  logoUrl: true,
  logoPublicId: true,
  profileStatus: true,
  createdAt: true,
  updatedAt: true,
  primaryCity: { select: CITY_SELECT },
};

const SUBCATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isActive: true,
  serviceCategory: {
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      offeringKind: true,
      isActive: true,
    },
  },
};

const PUBLIC_CAPABILITIES_SELECT = {
  where: {
    status: 'APPROVED',
    subcategory: {
      isActive: true,
      serviceCategory: { isActive: true },
    },
  },
  orderBy: { createdAt: 'asc' },
  select: {
    subcategory: { select: SUBCATEGORY_SELECT },
  },
};

const PUBLIC_PROFILE_SELECT = {
  userId: true,
  businessName: true,
  slug: true,
  about: true,
  logoUrl: true,
  primaryCity: { select: CITY_SELECT },
  capabilities: PUBLIC_CAPABILITIES_SELECT,
};

const buildPublicVendorWhere = ({
  search,
  cityId,
  serviceCategoryId,
  serviceSubcategoryId,
  offeringKind,
} = {}) => {
  const hasServiceFilter = serviceCategoryId || serviceSubcategoryId || offeringKind;
  const serviceCategory = {
    isActive: true,
    ...(serviceCategoryId && { id: serviceCategoryId }),
    ...(offeringKind && { offeringKind }),
  };

  return {
    kycStatus: 'APPROVED',
    profileStatus: 'ACTIVE',
    user: { is: { isActive: true } },
    primaryCity: {
      is: {
        isActive: true,
        ...(cityId && { id: cityId }),
      },
    },
    ...(search && {
      OR: [
        { businessName: { contains: search, mode: 'insensitive' } },
        { about: { contains: search, mode: 'insensitive' } },
      ],
    }),
    ...(hasServiceFilter && {
      capabilities: {
        some: {
          status: 'APPROVED',
          subcategory: {
            isActive: true,
            ...(serviceSubcategoryId && { id: serviceSubcategoryId }),
            serviceCategory,
          },
        },
      },
    }),
  };
};

export const findVendorBusinessProfile = (userId) =>
  prisma.vendorProfile.findUnique({
    where: { userId },
    select: SELF_PROFILE_SELECT,
  });

export const findActiveCityById = (id) =>
  prisma.city.findFirst({
    where: { id, isActive: true },
    select: CITY_SELECT,
  });

export const updateVendorBusinessProfile = (userId, data) =>
  prisma.vendorProfile.update({
    where: { userId },
    data,
    select: SELF_PROFILE_SELECT,
  });

export const listVendorCapabilities = (vendorUserId, offeringKind) =>
  prisma.vendorCapability.findMany({
    where: {
      vendorUserId,
      status: 'APPROVED',
      subcategory: {
        isActive: true,
        serviceCategory: { isActive: true, ...(offeringKind && { offeringKind }) },
      },
    },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      status: true,
      source: true,
      reviewedAt: true,
      createdAt: true,
      updatedAt: true,
      subcategory: { select: SUBCATEGORY_SELECT },
    },
  });

export const replaceVendorCapabilities = (vendorUserId, serviceSubcategoryIds) =>
  prisma.$transaction(async (tx) => {
    await tx.vendorCapability.updateMany({
      where: {
        vendorUserId,
        serviceSubcategoryId: { notIn: serviceSubcategoryIds },
        status: { not: 'INACTIVE' },
      },
      data: { status: 'INACTIVE' },
    });

    // A public listing must never continue advertising a service the vendor
    // has just removed from their capabilities. Drafts remain editable; only
    // already-public listings are paused automatically.
    await tx.vendorListing.updateMany({
      where: {
        vendorUserId,
        status: 'ACTIVE',
        components: {
          some: { serviceSubcategoryId: { notIn: serviceSubcategoryIds } },
        },
      },
      data: { status: 'PAUSED' },
    });

    for (const serviceSubcategoryId of serviceSubcategoryIds) {
      await tx.vendorCapability.upsert({
        where: {
          vendorUserId_serviceSubcategoryId: { vendorUserId, serviceSubcategoryId },
        },
        create: {
          vendorUserId,
          serviceSubcategoryId,
          status: 'APPROVED',
          source: 'VENDOR_PROFILE',
        },
        update: {
          status: 'APPROVED',
          source: 'VENDOR_PROFILE',
          reviewedAt: null,
          reviewedByAdminId: null,
        },
      });
    }

    return tx.vendorCapability.findMany({
      where: {
        vendorUserId,
        status: 'APPROVED',
        subcategory: {
          isActive: true,
          serviceCategory: { isActive: true },
        },
      },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        status: true,
        source: true,
        reviewedAt: true,
        createdAt: true,
        updatedAt: true,
        subcategory: { select: SUBCATEGORY_SELECT },
      },
    });
  });

export const findPublicVendorBySlug = (slug) =>
  prisma.vendorProfile.findFirst({
    where: {
      ...buildPublicVendorWhere(),
      slug,
    },
    select: PUBLIC_PROFILE_SELECT,
  });

export const listPublicVendorProfiles = async ({ page, limit, ...filters }) => {
  const where = buildPublicVendorWhere(filters);
  const [vendors, total] = await Promise.all([
    prisma.vendorProfile.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: [{ updatedAt: 'desc' }, { userId: 'asc' }],
      select: PUBLIC_PROFILE_SELECT,
    }),
    prisma.vendorProfile.count({ where }),
  ]);

  return { vendors, total };
};
