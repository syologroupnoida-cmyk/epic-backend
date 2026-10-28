import prisma from '../config/db.js';

const CITY_SELECT = {
  id: true,
  name: true,
  slug: true,
  stateName: true,
  countryCode: true,
};

const CATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
  offeringKind: true,
};

const SUBCATEGORY_SELECT = {
  id: true,
  name: true,
  slug: true,
};

const LEAD_PREVIEW_SELECT = {
  id: true,
  leadType: true,
  sourceType: true,
  eventDate: true,
  guestCount: true,
  budgetMin: true,
  budgetMax: true,
  maxBuyerCount: true,
  soldCount: true,
  status: true,
  createdAt: true,
  expiresAt: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  message: true,
  city: { select: CITY_SELECT },
  serviceCategory: { select: CATEGORY_SELECT },
  serviceSubcategory: { select: SUBCATEGORY_SELECT },
  serviceListing: { select: { id: true, title: true, slug: true } },
  venueProperty: { select: { id: true, title: true, slug: true } },
};

const directLeadWhere = (vendorUserId) => ({
  targetVendorUserId: vendorUserId,
  leadType: 'DIRECT',
  status: 'ACTIVE',
});

export const listDirectLeadsForVendor = async ({ vendorUserId, page, limit }) => {
  const where = directLeadWhere(vendorUserId);
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: LEAD_PREVIEW_SELECT,
    }),
    prisma.lead.count({ where }),
  ]);
  return { leads, total };
};

export const findDirectLeadForVendor = (vendorUserId, leadId) => prisma.lead.findFirst({
  where: { ...directLeadWhere(vendorUserId), id: leadId },
  select: LEAD_PREVIEW_SELECT,
});
