import prisma from '../config/db.js';

const leadSelect = {
  id: true, leadType: true, sourceType: true, targetVendorUserId: true,
  serviceSubcategoryId: true, cityId: true, customerName: true, customerPhone: true,
  customerEmail: true, eventDate: true, guestCount: true, budgetMin: true, budgetMax: true,
  message: true, basePrice: true, maxBuyerCount: true, soldCount: true, status: true,
  expiresAt: true, createdAt: true,
  city: { select: { id: true, name: true, slug: true, stateName: true, countryCode: true } },
  serviceCategory: { select: { id: true, name: true, slug: true, offeringKind: true } },
  serviceSubcategory: { select: { id: true, name: true, slug: true } },
  serviceListing: { select: { id: true, title: true, slug: true } },
  venueProperty: { select: { id: true, title: true, slug: true } },
};

const VENDOR_SHARED_LEAD_MATCH_SELECT = {
  primaryCityId: true,
  capabilities: {
    where: { status: 'APPROVED' },
    select: { serviceSubcategoryId: true },
  },
  listings: {
    where: { status: 'ACTIVE', listingType: 'SERVICE' },
    select: {
      cityId: true,
      components: { select: { serviceSubcategoryId: true } },
      serviceAreas: { select: { cityId: true } },
    },
  },
};

// A vendor can receive a shared service lead in its primary city for any
// approved capability. Outside the primary city, it must have an active
// matching service listing whose service areas include the lead city.
const buildSharedLeadMatchPairs = (vendor) => {
  const approvedSubcategoryIds = new Set(vendor?.capabilities.map((item) => item.serviceSubcategoryId) || []);
  const pairs = new Map();
  const addPair = (cityId, serviceSubcategoryId) => {
    if (!cityId || !approvedSubcategoryIds.has(serviceSubcategoryId)) return;
    pairs.set(`${cityId}:${serviceSubcategoryId}`, { cityId, serviceSubcategoryId });
  };

  if (vendor?.primaryCityId) {
    for (const serviceSubcategoryId of approvedSubcategoryIds) addPair(vendor.primaryCityId, serviceSubcategoryId);
  }

  for (const listing of vendor?.listings || []) {
    const cityIds = new Set([listing.cityId, ...listing.serviceAreas.map((area) => area.cityId)]);
    for (const cityId of cityIds) {
      for (const component of listing.components) addPair(cityId, component.serviceSubcategoryId);
    }
  }
  return [...pairs.values()];
};

const canVendorMatchSharedLead = (vendor, lead) => buildSharedLeadMatchPairs(vendor)
  .some((pair) => pair.cityId === lead.cityId && pair.serviceSubcategoryId === lead.serviceSubcategoryId);

export const findLeadForVendor = (leadId, vendorUserId) => prisma.lead.findFirst({
  where: {
    id: leadId,
    status: { in: ['ACTIVE', 'SOLD_OUT'] },
    OR: [
      { leadType: 'DIRECT', targetVendorUserId: vendorUserId },
      { leadType: 'SHARED', purchases: { some: { vendorUserId, status: 'PAID' } } },
    ],
  },
  select: { ...leadSelect, purchases: { where: { vendorUserId }, select: { id: true, amount: true, status: true, purchasedAt: true } } },
});

export const listSharedLeadsForVendor = async ({ vendorUserId, page, limit }) => {
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: vendorUserId },
    select: VENDOR_SHARED_LEAD_MATCH_SELECT,
  });
  const matchingPairs = buildSharedLeadMatchPairs(vendor);
  if (!matchingPairs.length) return { leads: [], total: 0 };
  const where = {
    leadType: 'SHARED', status: 'ACTIVE', OR: matchingPairs,
    purchases: { none: { vendorUserId, status: 'PAID' } },
  };
  const [all, total] = await Promise.all([
    prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' }, select: leadSelect }),
    prisma.lead.count({ where }),
  ]);
  const available = all.filter((lead) => lead.soldCount < lead.maxBuyerCount);
  return { leads: available.slice((page - 1) * limit, page * limit), total: available.length };
};

export const purchaseLead = async ({ leadId, vendorUserId, plan }) => prisma.$transaction(async (tx) => {
  const lead = await tx.lead.findUnique({ where: { id: leadId }, select: leadSelect });
  if (!lead || !['ACTIVE', 'SOLD_OUT'].includes(lead.status)) return { error: 'NOT_FOUND' };
  if (lead.status === 'SOLD_OUT' || lead.soldCount >= lead.maxBuyerCount) return { error: 'SOLD_OUT' };

  const alreadyBought = await tx.leadPurchase.findUnique({ where: { leadId_vendorUserId: { leadId, vendorUserId } } });
  if (alreadyBought) return { error: 'ALREADY_PURCHASED' };

  let amount;
  if (lead.leadType === 'DIRECT') {
    if (lead.targetVendorUserId !== vendorUserId) return { error: 'NOT_ELIGIBLE' };
    amount = plan.directLeadPrice;
  } else {
    const vendor = await tx.vendorProfile.findUnique({
      where: { userId: vendorUserId },
      select: VENDOR_SHARED_LEAD_MATCH_SELECT,
    });
    if (!vendor || !canVendorMatchSharedLead(vendor, lead)) return { error: 'NOT_ELIGIBLE' };
    amount = lead.basePrice;
  }
  if (amount === null || amount === undefined) return { error: 'PRICE_UNAVAILABLE' };

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const monthlyPurchases = await tx.leadPurchase.count({ where: {
    vendorUserId, status: 'PAID', purchasedAt: { gte: monthStart }, lead: { is: { leadType: lead.leadType } },
  } });
  const limit = lead.leadType === 'DIRECT' ? plan.maxDirectLeadPurchasesPerMonth : plan.maxSharedLeadPurchasesPerMonth;
  if (monthlyPurchases >= limit) return { error: 'PLAN_LIMIT_REACHED' };

  const wallet = await tx.vendorWallet.findUnique({ where: { vendorUserId }, select: { balance: true } });
  if (!wallet || wallet.balance < amount) return { error: 'INSUFFICIENT_BALANCE' };

  const updatedWallet = await tx.vendorWallet.update({ where: { vendorUserId }, data: { balance: { decrement: amount } }, select: { balance: true } });
  const purchase = await tx.leadPurchase.create({ data: { leadId, vendorUserId, subscriptionPlanId: plan.id, amount }, select: { id: true, amount: true, purchasedAt: true } });
  await tx.walletTransaction.create({ data: {
    vendorUserId, amount: -amount, balanceAfter: updatedWallet.balance, type: 'LEAD_PURCHASE',
    description: `${lead.leadType === 'DIRECT' ? 'Direct' : 'Shared'} lead unlocked.`, referenceType: 'LEAD_PURCHASE', referenceId: purchase.id,
  } });
  const soldCount = lead.soldCount + 1;
  const updatedLead = await tx.lead.update({ where: { id: leadId }, data: { soldCount, ...(soldCount >= lead.maxBuyerCount && { status: 'SOLD_OUT' }) }, select: leadSelect });
  return { lead: updatedLead, purchase, wallet: updatedWallet };
}, { isolationLevel: 'Serializable' });
