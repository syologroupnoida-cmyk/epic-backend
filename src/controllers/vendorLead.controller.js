import * as vendorLeadService from '../services/vendorLead/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listMyLeads = asyncHandler(async (req, res) => {
  const data = await vendorLeadService.listMyLeads({ vendorUserId: req.user.id, query: req.query });
  return sendSuccess(res, { message: 'Vendor leads retrieved.', data });
});

export const getMyLead = asyncHandler(async (req, res) => {
  const data = await vendorLeadService.getMyLead({ vendorUserId: req.user.id, leadId: req.params.leadId });
  return sendSuccess(res, { message: 'Vendor lead retrieved.', data });
});

export const listSharedLeads = asyncHandler(async (req, res) => {
  const data = await vendorLeadService.listSharedLeads({ vendorUserId: req.user.id, query: req.query });
  return sendSuccess(res, { message: 'Matching shared leads retrieved.', data });
});

export const purchaseLead = asyncHandler(async (req, res) => {
  const data = await vendorLeadService.purchaseLead({ vendorUserId: req.user.id, leadId: req.params.leadId });
  return sendSuccess(res, { message: 'Lead unlocked successfully.', data });
});
