import * as leadService from '../services/lead/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const sendCreated = (res, message, data) => sendSuccess(res, { statusCode: 201, message, data });

export const createVendorProfileEnquiry = asyncHandler(async (req, res) => sendCreated(
  res,
  'Your enquiry was sent to the vendor.',
  await leadService.createVendorProfileEnquiry({ slug: req.params.slug, payload: req.body }),
));

export const createServiceListingEnquiry = asyncHandler(async (req, res) => sendCreated(
  res,
  'Your enquiry was sent to the vendor.',
  await leadService.createServiceListingEnquiry({ slug: req.params.slug, payload: req.body }),
));

export const createVenuePropertyEnquiry = asyncHandler(async (req, res) => sendCreated(
  res,
  'Your enquiry was sent to the vendor.',
  await leadService.createVenuePropertyEnquiry({ slug: req.params.slug, payload: req.body }),
));

export const createSharedLead = asyncHandler(async (req, res) => sendCreated(
  res,
  'Your request was received. We will match you with suitable vendors shortly.',
  await leadService.createSharedLead({ payload: req.body }),
));
