import * as listingService from '../services/listing/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createMyServiceListing = asyncHandler(async (req, res) => {
  const data = await listingService.createServiceListing({ vendorUserId: req.user.id, payload: req.body });
  return sendSuccess(res, {
    statusCode: 201,
    message: req.body.submitForReview
      ? 'Service listing created and submitted for review.'
      : 'Service listing draft created.',
    data,
  });
});

export const getMyListing = asyncHandler(async (req, res) => {
  const data = await listingService.getMyListing({ vendorUserId: req.user.id, listingId: req.params.listingId });
  return sendSuccess(res, { message: 'Vendor listing retrieved.', data });
});

export const listMyListings = asyncHandler(async (req, res) => {
  const data = await listingService.listMyListings({ vendorUserId: req.user.id, query: req.query });
  return sendSuccess(res, { message: 'Vendor listings retrieved.', data });
});

export const updateMyListing = asyncHandler(async (req, res) => {
  const data = await listingService.updateMyListing({
    vendorUserId: req.user.id,
    listingId: req.params.listingId,
    payload: req.body,
  });
  return sendSuccess(res, { message: 'Service listing updated.', data });
});

export const submitMyListing = asyncHandler(async (req, res) => {
  const data = await listingService.submitMyListing({ vendorUserId: req.user.id, listingId: req.params.listingId });
  return sendSuccess(res, { message: 'Service listing submitted for review.', data });
});

export const archiveMyListing = asyncHandler(async (req, res) => {
  const data = await listingService.archiveMyListing({
    vendorUserId: req.user.id,
    listingId: req.params.listingId,
  });
  return sendSuccess(res, { message: 'Listing archived and removed from the marketplace.', data });
});

export const unarchiveMyListing = asyncHandler(async (req, res) => {
  const data = await listingService.unarchiveMyListing({
    vendorUserId: req.user.id,
    listingId: req.params.listingId,
  });
  return sendSuccess(res, { message: 'Listing restored as a draft. Submit it for review to publish it again.', data });
});

export const listListingsForAdmin = asyncHandler(async (req, res) => {
  const data = await listingService.listListingsForAdmin(req.query);
  return sendSuccess(res, { message: 'Listings retrieved.', data });
});

export const getListingForAdmin = asyncHandler(async (req, res) => {
  const data = await listingService.getListingForAdmin(req.params.listingId);
  return sendSuccess(res, { message: 'Listing retrieved.', data });
});

export const approveListing = asyncHandler(async (req, res) => {
  const data = await listingService.approveListing({ listingId: req.params.listingId, adminId: req.user.id });
  return sendSuccess(res, { message: 'Listing approved and published.', data });
});

export const rejectListing = asyncHandler(async (req, res) => {
  const data = await listingService.rejectListing({
    listingId: req.params.listingId,
    adminId: req.user.id,
    reason: req.body.reason,
  });
  return sendSuccess(res, { message: 'Listing rejected.', data });
});

export const pauseListing = asyncHandler(async (req, res) => {
  const data = await listingService.pauseListing({
    listingId: req.params.listingId,
    adminId: req.user.id,
    reason: req.body.reason,
  });
  return sendSuccess(res, { message: 'Listing paused and removed from the marketplace.', data });
});

export const resumeListing = asyncHandler(async (req, res) => {
  const data = await listingService.resumeListing({ listingId: req.params.listingId });
  return sendSuccess(res, { message: 'Listing resumed and published.', data });
});

export const listPublicListings = asyncHandler(async (req, res) => {
  const data = await listingService.listPublicListings(req.query);
  return sendSuccess(res, { message: 'Public listings retrieved.', data });
});

export const getPublicListing = asyncHandler(async (req, res) => {
  const data = await listingService.getPublicListing(req.params.slug);
  return sendSuccess(res, { message: 'Public listing retrieved.', data });
});
