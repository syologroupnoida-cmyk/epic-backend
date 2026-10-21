import * as venuePropertyService from '../services/venueProperty/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createMine = asyncHandler(async (req, res) => {
  const data = await venuePropertyService.create({ vendorUserId: req.user.id, payload: req.body });
  return sendSuccess(res, { statusCode: 201, message: req.body.submitForReview ? 'Venue property created and submitted for review.' : 'Venue property draft created.', data });
});
export const getMine = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property retrieved.', data: await venuePropertyService.getMine({ vendorUserId: req.user.id, venuePropertyId: req.params.venuePropertyId }) }));
export const listMine = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue properties retrieved.', data: await venuePropertyService.listMine({ vendorUserId: req.user.id, query: req.query }) }));
export const updateMine = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property updated.', data: await venuePropertyService.updateMine({ vendorUserId: req.user.id, venuePropertyId: req.params.venuePropertyId, payload: req.body }) }));
export const submitMine = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property submitted for review.', data: await venuePropertyService.submitMine({ vendorUserId: req.user.id, venuePropertyId: req.params.venuePropertyId }) }));
export const archiveMine = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property archived and removed from the marketplace.', data: await venuePropertyService.archiveMine({ vendorUserId: req.user.id, venuePropertyId: req.params.venuePropertyId }) }));
export const unarchiveMine = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property restored as a draft.', data: await venuePropertyService.unarchiveMine({ vendorUserId: req.user.id, venuePropertyId: req.params.venuePropertyId }) }));
export const listAdmin = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue properties retrieved.', data: await venuePropertyService.listAdmin(req.query) }));
export const getAdmin = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property retrieved.', data: await venuePropertyService.getAdmin(req.params.venuePropertyId) }));
export const approve = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property approved and published.', data: await venuePropertyService.approve({ id: req.params.venuePropertyId, adminId: req.user.id }) }));
export const reject = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property rejected.', data: await venuePropertyService.reject({ id: req.params.venuePropertyId, adminId: req.user.id, reason: req.body.reason }) }));
export const pause = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property paused and removed from the marketplace.', data: await venuePropertyService.pause({ id: req.params.venuePropertyId, adminId: req.user.id, reason: req.body.reason }) }));
export const resume = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Venue property resumed and published.', data: await venuePropertyService.resume(req.params.venuePropertyId) }));
export const listPublic = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Public venue properties retrieved.', data: await venuePropertyService.listPublic(req.query) }));
export const getPublic = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Public venue property retrieved.', data: await venuePropertyService.getPublic(req.params.slug) }));
