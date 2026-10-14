import * as profileService from '../services/vendorProfile/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getMyProfile = asyncHandler(async (req, res) => {
  const data = await profileService.getMyProfile(req.user.id);
  return sendSuccess(res, {
    message: 'Vendor business profile retrieved.',
    data,
  });
});

export const updateMyProfile = asyncHandler(async (req, res) => {
  const data = await profileService.updateMyProfile({
    vendorUserId: req.user.id,
    payload: req.body,
  });
  return sendSuccess(res, {
    message: 'Vendor business profile updated.',
    data,
  });
});

export const getMyCapabilities = asyncHandler(async (req, res) => {
  const data = await profileService.getMyCapabilities(req.user.id);
  return sendSuccess(res, {
    message: 'Vendor capabilities retrieved.',
    data,
  });
});

export const getPublicVendorProfile = asyncHandler(async (req, res) => {
  const data = await profileService.getPublicVendorProfile(req.params.slug);
  return sendSuccess(res, {
    message: 'Public vendor profile retrieved.',
    data,
  });
});

export const listPublicVendorProfiles = asyncHandler(async (req, res) => {
  const data = await profileService.listPublicVendorProfiles(req.query);
  return sendSuccess(res, {
    message: 'Public vendor profiles retrieved.',
    data,
  });
});
