import prisma from '../config/db.js';

const activeVendorWhere = {
  kycStatus: 'APPROVED',
  profileStatus: 'ACTIVE',
  user: { is: { isActive: true } },
};

const activeVendorRelation = { is: activeVendorWhere };

export const findPublicVendorBySlug = (slug) => prisma.vendorProfile.findFirst({
  where: {
    slug,
    ...activeVendorWhere,
    primaryCity: { is: { isActive: true } },
  },
  select: { userId: true, primaryCityId: true },
});

export const findPublicServiceListingBySlug = (slug) => prisma.vendorListing.findFirst({
  where: {
    slug,
    listingType: 'SERVICE',
    status: 'ACTIVE',
    vendor: activeVendorRelation,
    city: { is: { isActive: true } },
  },
  select: { id: true, vendorUserId: true, cityId: true },
});

export const findPublicVenuePropertyBySlug = (slug) => prisma.venuePropertyListing.findFirst({
  where: {
    slug,
    status: 'ACTIVE',
    vendor: activeVendorRelation,
    city: { is: { isActive: true } },
  },
  select: { id: true, vendorUserId: true, cityId: true },
});

export const findActiveCityById = (id) => prisma.city.findFirst({
  where: { id, isActive: true },
  select: { id: true },
});

export const findActiveSubcategoryById = (id) => prisma.serviceSubcategory.findFirst({
  where: { id, isActive: true, serviceCategory: { isActive: true } },
  select: { id: true, serviceCategoryId: true },
});

export const createLead = (data) => prisma.lead.create({
  data,
  select: {
    id: true,
    leadType: true,
    sourceType: true,
    status: true,
    maxBuyerCount: true,
    createdAt: true,
  },
});
