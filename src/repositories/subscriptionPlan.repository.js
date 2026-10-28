import prisma from '../config/db.js';

const PLAN_SELECT = {
  id: true,
  code: true,
  kind: true,
  displayName: true,
  shortDescription: true,
  monthlyPrice: true,
  directLeadPrice: true,
  walletCreditPerBillingCycle: true,
  maxActiveServiceListings: true,
  maxActiveVenueProperties: true,
  maxDirectLeadPurchasesPerMonth: true,
  maxSharedLeadPurchasesPerMonth: true,
  maxMediaPerListing: true,
  featuredListingSlots: true,
  benefits: true,
  badgeText: true,
  theme: true,
  ctaText: true,
  sortOrder: true,
  isFeatured: true,
  isActive: true,
  isDefault: true,
  isPurchasable: true,
  createdAt: true,
  updatedAt: true,
};

export const findById = (id) => prisma.subscriptionPlan.findUnique({ where: { id }, select: PLAN_SELECT });

export const listForAdmin = ({ isActive, kind }) => prisma.subscriptionPlan.findMany({
  where: {
    ...(isActive !== undefined && { isActive }),
    ...(kind && { kind }),
  },
  orderBy: [{ sortOrder: 'asc' }, { monthlyPrice: 'asc' }, { createdAt: 'asc' }],
  select: PLAN_SELECT,
});

export const create = async (data) => prisma.$transaction(async (tx) => {
  if (data.isDefault) await tx.subscriptionPlan.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
  return tx.subscriptionPlan.create({ data, select: PLAN_SELECT });
});

export const update = async ({ id, data, clearOtherDefault = false }) => prisma.$transaction(async (tx) => {
  if (clearOtherDefault) await tx.subscriptionPlan.updateMany({ where: { isDefault: true, id: { not: id } }, data: { isDefault: false } });
  return tx.subscriptionPlan.update({ where: { id }, data, select: PLAN_SELECT });
});

export const activate = (id) => prisma.subscriptionPlan.update({
  where: { id },
  data: { isActive: true },
  select: PLAN_SELECT,
});

export const deactivate = (id) => prisma.subscriptionPlan.update({
  where: { id },
  data: { isActive: false },
  select: PLAN_SELECT,
});

export const remove = (id) => prisma.subscriptionPlan.delete({ where: { id }, select: PLAN_SELECT });
