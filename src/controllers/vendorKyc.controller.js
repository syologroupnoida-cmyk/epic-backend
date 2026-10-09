import * as kycService from '../services/vendorKyc/index.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// --- Vendor-scoped handlers (operates on req.user.id) ---

export const getMyKycStatus = asyncHandler(async (req, res) => {
  const data = await kycService.getMyKycStatus(req.user.id);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'KYC status retrieved.',
    data,
  });
});

export const validateDocumentNumber = (type) => asyncHandler(async (req, res) => {
  await kycService.assertKycEditable(req.user.id);
  const data = kycService.buildDocumentValidationResult({ type, number: req.body.number });
  return sendSuccess(res, {
    statusCode: 200,
    message: `${type} number format is valid.`,
    data,
  });
});

export const submitMyKyc = asyncHandler(async (req, res) => {
  const data = await kycService.submitMyKyc({
    vendorUserId: req.user.id,
    payload: req.body,
  });
  return sendSuccess(res, {
    statusCode: 201,
    message: 'KYC submitted. Awaiting admin review.',
    data,
  });
});

// --- Admin-scoped handlers ---

export const listKycForAdmin = asyncHandler(async (req, res) => {
  const data = await kycService.listKycForAdmin(req.query);
  return sendSuccess(res, {
    statusCode: 200,
    message: 'KYC submissions retrieved.',
    data,
  });
});

export const approveVendorKyc = asyncHandler(async (req, res) => {
  const data = await kycService.approveVendorKyc({
    vendorUserId: req.params.userId,
    adminId: req.user.id,
  });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'KYC approved successfully.',
    data,
  });
});

export const rejectVendorKyc = asyncHandler(async (req, res) => {
  const data = await kycService.rejectVendorKyc({
    vendorUserId: req.params.userId,
    adminId: req.user.id,
    reason: req.body.reason,
  });
  return sendSuccess(res, {
    statusCode: 200,
    message: 'KYC rejected.',
    data,
  });
});
