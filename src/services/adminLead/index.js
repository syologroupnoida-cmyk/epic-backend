import { ApiError } from '../../utils/ApiError.js';
import * as adminLeadRepo from '../../repositories/adminLead.repository.js';

const pageInfo = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

const serializeLead = (lead) => ({
  id: lead.id,
  leadType: lead.leadType,
  sourceType: lead.sourceType,
  status: lead.status,
  customer: {
    name: lead.customerName,
    phone: lead.customerPhone,
    email: lead.customerEmail,
  },
  requirement: {
    city: lead.city,
    category: lead.serviceCategory,
    subcategory: lead.serviceSubcategory,
    eventDate: lead.eventDate,
    guestCount: lead.guestCount,
    budgetMin: lead.budgetMin,
    budgetMax: lead.budgetMax,
    message: lead.message,
  },
  source: lead.serviceListing
    ? { type: 'SERVICE_LISTING', ...lead.serviceListing }
    : lead.venueProperty
      ? { type: 'VENUE_PROPERTY', ...lead.venueProperty }
      : lead.sourceType === 'VENDOR_PROFILE'
        ? { type: 'VENDOR_PROFILE' }
        : { type: 'GET_QUOTES' },
  targetVendor: lead.targetVendor,
  pricing: {
    basePrice: lead.basePrice,
    maxBuyerCount: lead.maxBuyerCount,
    soldCount: lead.soldCount,
  },
  review: {
    reviewedAt: lead.reviewedAt,
    reviewedByAdminId: lead.reviewedByAdminId,
    rejectionReason: lead.rejectionReason,
  },
  closure: {
    closedAt: lead.closedAt,
    closedByAdminId: lead.closedByAdminId,
    reason: lead.closureReason,
  },
  expiresAt: lead.expiresAt,
  createdAt: lead.createdAt,
  updatedAt: lead.updatedAt,
});

export const listLeads = async (query) => {
  const { leads, total } = await adminLeadRepo.listForAdmin(query);
  return { leads: leads.map(serializeLead), pagination: pageInfo(total, query.page, query.limit) };
};

export const getLead = async (leadId) => {
  const lead = await adminLeadRepo.findById(leadId);
  if (!lead) throw ApiError.notFound('Lead not found.');
  return serializeLead(lead);
};

const requirePendingSharedLead = async (leadId) => {
  const lead = await adminLeadRepo.findById(leadId);
  if (!lead) throw ApiError.notFound('Lead not found.');
  if (lead.leadType !== 'SHARED' || lead.status !== 'PENDING_REVIEW') {
    throw ApiError.conflict('Only shared leads pending review can be activated or rejected.');
  }
  return lead;
};

export const activateSharedLead = async ({ leadId, adminId, payload }) => {
  await requirePendingSharedLead(leadId);
  return serializeLead(await adminLeadRepo.activateSharedLead({ id: leadId, adminId, ...payload }));
};

export const rejectSharedLead = async ({ leadId, adminId, reason }) => {
  await requirePendingSharedLead(leadId);
  return serializeLead(await adminLeadRepo.rejectSharedLead({ id: leadId, adminId, reason }));
};

export const closeLead = async ({ leadId, adminId, reason }) => {
  const lead = await adminLeadRepo.findById(leadId);
  if (!lead) throw ApiError.notFound('Lead not found.');
  if (!['ACTIVE', 'SOLD_OUT', 'EXPIRED'].includes(lead.status)) {
    throw ApiError.conflict('Only active, sold-out, or expired leads can be closed.');
  }
  return serializeLead(await adminLeadRepo.closeLead({ id: leadId, adminId, reason }));
};
