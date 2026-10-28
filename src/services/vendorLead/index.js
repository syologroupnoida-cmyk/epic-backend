import { ApiError } from '../../utils/ApiError.js';
import * as vendorLeadRepo from '../../repositories/vendorLead.repository.js';
import * as leadPurchaseRepo from '../../repositories/leadPurchase.repository.js';
import { getEffectiveSubscription } from '../vendorSubscription/index.js';

const maskName = (name) => {
  const [firstName] = name.trim().split(/\s+/);
  return firstName.length <= 1 ? '*' : `${firstName[0]}${'*'.repeat(Math.min(firstName.length - 1, 5))}`;
};

const maskPhone = (phone) => `${'*'.repeat(Math.max(phone.length - 4, 0))}${phone.slice(-4)}`;

const maskEmail = (email) => {
  if (!email) return null;
  const [local, domain] = email.split('@');
  return `${local.slice(0, 1)}***@${domain}`;
};

const serializeCity = (city) => city && ({
  id: city.id,
  name: city.name,
  slug: city.slug,
  stateName: city.stateName,
  countryCode: city.countryCode,
});

const serializeLeadPreview = (lead) => ({
  id: lead.id,
  leadType: lead.leadType,
  sourceType: lead.sourceType,
  status: lead.status,
  eventDate: lead.eventDate,
  guestCount: lead.guestCount,
  budgetMin: lead.budgetMin,
  budgetMax: lead.budgetMax,
  city: serializeCity(lead.city),
  requirement: {
    category: lead.serviceCategory,
    subcategory: lead.serviceSubcategory,
  },
  source: lead.serviceListing
    ? { type: 'SERVICE_LISTING', ...lead.serviceListing }
    : lead.venueProperty
      ? { type: 'VENUE_PROPERTY', ...lead.venueProperty }
      : { type: 'VENDOR_PROFILE' },
  customer: {
    name: maskName(lead.customerName),
    phone: maskPhone(lead.customerPhone),
    email: maskEmail(lead.customerEmail),
  },
  messageAvailable: Boolean(lead.message),
  pricing: lead.leadType === 'SHARED' ? { unlockPrice: lead.basePrice } : undefined,
  buyerAvailability: lead.leadType === 'SHARED' ? {
    maxBuyerCount: lead.maxBuyerCount,
    soldCount: lead.soldCount,
    remainingBuyerSlots: Math.max(lead.maxBuyerCount - lead.soldCount, 0),
  } : undefined,
  contactUnlocked: false,
  createdAt: lead.createdAt,
  expiresAt: lead.expiresAt,
});

const serializeUnlockedLead = (lead) => ({
  ...serializeLeadPreview(lead),
  customer: {
    name: lead.customerName,
    phone: lead.customerPhone,
    email: lead.customerEmail,
  },
  message: lead.message,
  contactUnlocked: true,
  purchase: lead.purchases?.[0] ? {
    id: lead.purchases[0].id,
    amount: lead.purchases[0].amount,
    purchasedAt: lead.purchases[0].purchasedAt,
  } : undefined,
});

const pageInfo = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

export const listMyLeads = async ({ vendorUserId, query }) => {
  const { leads, total } = await vendorLeadRepo.listDirectLeadsForVendor({ vendorUserId, ...query });
  return {
    leads: leads.map(serializeLeadPreview),
    pagination: pageInfo(total, query.page, query.limit),
  };
};

export const getMyLead = async ({ vendorUserId, leadId }) => {
  const lead = await leadPurchaseRepo.findLeadForVendor(leadId, vendorUserId)
    || await vendorLeadRepo.findDirectLeadForVendor(vendorUserId, leadId);
  if (!lead) throw ApiError.notFound('Lead not found.');
  return lead.purchases?.some((purchase) => purchase.status === 'PAID')
    ? serializeUnlockedLead(lead)
    : serializeLeadPreview(lead);
};

export const listSharedLeads = async ({ vendorUserId, query }) => {
  const { leads, total } = await leadPurchaseRepo.listSharedLeadsForVendor({ vendorUserId, ...query });
  return {
    leads: leads.map(serializeLeadPreview),
    pagination: pageInfo(total, query.page, query.limit),
  };
};

export const purchaseLead = async ({ vendorUserId, leadId }) => {
  const effective = await getEffectiveSubscription(vendorUserId);
  let result;
  try {
    result = await leadPurchaseRepo.purchaseLead({ leadId, vendorUserId, plan: effective.plan });
  } catch (error) {
    if (error.code === 'P2034') throw ApiError.conflict('Another vendor is purchasing this lead. Please try again.');
    throw error;
  }
  const messages = {
    NOT_FOUND: 'Lead not found or is no longer available.',
    SOLD_OUT: 'This lead has no remaining buyer slots.',
    ALREADY_PURCHASED: 'You have already purchased this lead.',
    NOT_ELIGIBLE: 'This lead does not match your approved city and capability.',
    PRICE_UNAVAILABLE: 'This lead does not have a purchase price yet.',
    PLAN_LIMIT_REACHED: 'Your subscription monthly lead-purchase limit has been reached.',
    INSUFFICIENT_BALANCE: 'Your wallet balance is insufficient to unlock this lead.',
  };
  if (result.error) throw ApiError.conflict(messages[result.error]);
  return {
    lead: serializeUnlockedLead({ ...result.lead, purchases: [{ ...result.purchase, status: 'PAID' }] }),
    wallet: { balance: result.wallet.balance, debitedAmount: result.purchase.amount },
    plan: { id: effective.plan.id, displayName: effective.plan.displayName },
  };
};
