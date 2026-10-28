import * as adminLeadService from '../services/adminLead/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const listLeads = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Leads retrieved.',
  data: await adminLeadService.listLeads(req.query),
}));

export const getLead = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Lead retrieved.',
  data: await adminLeadService.getLead(req.params.leadId),
}));

export const activateSharedLead = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Shared lead activated and made available for vendor purchase.',
  data: await adminLeadService.activateSharedLead({ leadId: req.params.leadId, adminId: req.user.id, payload: req.body }),
}));

export const rejectSharedLead = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Shared lead rejected.',
  data: await adminLeadService.rejectSharedLead({ leadId: req.params.leadId, adminId: req.user.id, reason: req.body.reason }),
}));

export const closeLead = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Lead closed.',
  data: await adminLeadService.closeLead({ leadId: req.params.leadId, adminId: req.user.id, reason: req.body.reason }),
}));
