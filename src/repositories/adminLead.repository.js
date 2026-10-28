import prisma from '../config/db.js';

const CITY_SELECT = { id: true, name: true, slug: true, stateName: true, countryCode: true };
const CATEGORY_SELECT = { id: true, name: true, slug: true, offeringKind: true };
const SUBCATEGORY_SELECT = { id: true, name: true, slug: true };
const VENDOR_SELECT = { userId: true, businessName: true, slug: true, logoUrl: true };

const ADMIN_LEAD_SELECT = {
  id: true,
  leadType: true,
  sourceType: true,
  targetVendorUserId: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  eventDate: true,
  guestCount: true,
  budgetMin: true,
  budgetMax: true,
  message: true,
  basePrice: true,
  maxBuyerCount: true,
  soldCount: true,
  status: true,
  reviewedAt: true,
  reviewedByAdminId: true,
  rejectionReason: true,
  closedAt: true,
  closedByAdminId: true,
  closureReason: true,
  expiresAt: true,
  createdAt: true,
  updatedAt: true,
  city: { select: CITY_SELECT },
  serviceCategory: { select: CATEGORY_SELECT },
  serviceSubcategory: { select: SUBCATEGORY_SELECT },
  targetVendor: { select: VENDOR_SELECT },
  serviceListing: { select: { id: true, title: true, slug: true } },
  venueProperty: { select: { id: true, title: true, slug: true } },
};

const buildWhere = ({ status, leadType, sourceType, targetVendorUserId, cityId, serviceSubcategoryId }) => ({
  ...(status && { status }),
  ...(leadType && { leadType }),
  ...(sourceType && { sourceType }),
  ...(targetVendorUserId && { targetVendorUserId }),
  ...(cityId && { cityId }),
  ...(serviceSubcategoryId && { serviceSubcategoryId }),
});

export const listForAdmin = async ({ page, limit, ...filters }) => {
  const where = buildWhere(filters);
  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: ADMIN_LEAD_SELECT,
    }),
    prisma.lead.count({ where }),
  ]);
  return { leads, total };
};

export const findById = (id) => prisma.lead.findUnique({ where: { id }, select: ADMIN_LEAD_SELECT });

export const activateSharedLead = ({ id, adminId, basePrice, maxBuyerCount }) => prisma.lead.update({
  where: { id },
  data: {
    status: 'ACTIVE',
    basePrice,
    maxBuyerCount,
    reviewedAt: new Date(),
    reviewedByAdminId: adminId,
    rejectionReason: null,
  },
  select: ADMIN_LEAD_SELECT,
});

export const rejectSharedLead = ({ id, adminId, reason }) => prisma.lead.update({
  where: { id },
  data: {
    status: 'REJECTED',
    reviewedAt: new Date(),
    reviewedByAdminId: adminId,
    rejectionReason: reason,
  },
  select: ADMIN_LEAD_SELECT,
});

export const closeLead = ({ id, adminId, reason }) => prisma.lead.update({
  where: { id },
  data: {
    status: 'CLOSED',
    closedAt: new Date(),
    closedByAdminId: adminId,
    closureReason: reason,
  },
  select: ADMIN_LEAD_SELECT,
});
