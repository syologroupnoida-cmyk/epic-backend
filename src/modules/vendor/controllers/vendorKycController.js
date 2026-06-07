import asyncHandler from "../../../utils/asyncHandler.js";
import SuccessResponse from "../../../utils/SuccessResponse.js";
import {
  getKycStatus,
  saveKycDraft,
  verifyKycDocument,
  submitKyc,
} from "../services/vendorKycService.js";

export const getVendorKycStatus = asyncHandler(async (req, res) => {
  const data = await getKycStatus(req.vendorAuth.id);
  res.status(200).json(new SuccessResponse(200, "KYC status fetched", data));
});

export const saveVendorKycDraft = asyncHandler(async (req, res) => {
  const data = await saveKycDraft(req.vendorAuth.id, req.body);
  res.status(200).json(new SuccessResponse(200, "KYC draft saved", data));
});

export const verifyVendorKycDocument = asyncHandler(async (req, res) => {
  const data = await verifyKycDocument(req.vendorAuth.id, req.body);
  res.status(200).json(new SuccessResponse(200, "Document verified", data));
});

export const submitVendorKyc = asyncHandler(async (req, res) => {
  const data = await submitKyc(req.vendorAuth.id, req.body, req.files || {});
  res.status(200).json(new SuccessResponse(200, data.message, data));
});
