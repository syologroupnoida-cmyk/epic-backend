import Vendor from "../../../models/Vendor.js";
import ErrorResponse from "../../../utils/ErrorResponse.js";
import { uploadToCloudinary } from "../../../utils/cloudinary.js";

const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
const AADHAR_REGEX = /^[0-9]{12}$/;
const CIN_REGEX = /^[LUu]{1}[0-9]{5}[A-Za-z]{2}[0-9]{4}[A-Za-z]{3}[0-9]{6}$/;

export const KYC_DOC_FIELDS = [
  "panNumber",
  "gstinNumber",
  "cinNumber",
  "aadharNumber",
];

export const validateDocumentNumber = (field, value) => {
  const val = String(value || "").trim();
  if (!val) return { valid: false, message: "Document number is required" };

  switch (field) {
    case "panNumber":
      if (!PAN_REGEX.test(val)) {
        return { valid: false, message: "Invalid PAN format (e.g. ABCDE1234F)" };
      }
      break;
    case "gstinNumber":
      if (!GSTIN_REGEX.test(val)) {
        return { valid: false, message: "Invalid GSTIN format" };
      }
      break;
    case "aadharNumber":
      if (!AADHAR_REGEX.test(val)) {
        return { valid: false, message: "Aadhar must be 12 digits" };
      }
      break;
    case "cinNumber":
      if (!CIN_REGEX.test(val)) {
        return { valid: false, message: "Invalid CIN format" };
      }
      break;
    default:
      return { valid: false, message: "Unknown document type" };
  }

  return { valid: true, message: "Verified" };
};

const parseJsonField = (value, fallback) => {
  if (value == null || value === "") return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const uploadSingle = async (file) => {
  if (!file) return null;
  const [uploaded] = await uploadToCloudinary([file]);
  return uploaded || null;
};

export const getKycStatus = async (vendorId) => {
  const vendor = await Vendor.findById(vendorId).select(
    "kycStatus kyc kycRejectionReason vendorName category city email phone status"
  );

  if (!vendor) throw new ErrorResponse(404, "Vendor not found");

  return {
    kycStatus: vendor.kycStatus || "not_started",
    kycRejectionReason: vendor.kycRejectionReason || "",
    kyc: vendor.kyc || {},
    vendor: {
      brandName: vendor.vendorName,
      vendorType: vendor.category,
      city: vendor.city,
      email: vendor.email,
      mobile: vendor.phone,
      status: vendor.status,
    },
  };
};

export const saveKycDraft = async (vendorId, payload) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new ErrorResponse(404, "Vendor not found");

  if (["submitted", "approved"].includes(vendor.kycStatus)) {
    throw new ErrorResponse(400, "KYC already submitted and cannot be edited");
  }

  vendor.kyc = {
    ...(vendor.kyc?.toObject?.() || vendor.kyc || {}),
    ...payload,
  };
  vendor.kycStatus = "in_progress";
  await vendor.save({ validateBeforeSave: false });

  return { kycStatus: vendor.kycStatus, kyc: vendor.kyc };
};

export const verifyKycDocument = async (vendorId, { field, value }) => {
  if (!KYC_DOC_FIELDS.includes(field)) {
    throw new ErrorResponse(400, "Invalid document field");
  }

  const result = validateDocumentNumber(field, value);
  if (!result.valid) {
    throw new ErrorResponse(400, result.message);
  }

  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new ErrorResponse(404, "Vendor not found");

  if (!vendor.kyc) vendor.kyc = {};
  if (!vendor.kyc.verifiedDocs) vendor.kyc.verifiedDocs = {};

  vendor.kyc[field] = String(value).trim().toUpperCase();
  vendor.kyc.verifiedDocs[field] = true;
  vendor.kycStatus = vendor.kycStatus === "not_started" ? "in_progress" : vendor.kycStatus;
  vendor.markModified("kyc");
  await vendor.save({ validateBeforeSave: false });

  return {
    field,
    verified: true,
    verifiedDocs: vendor.kyc.verifiedDocs,
  };
};

export const submitKyc = async (vendorId, body, files = {}) => {
  const vendor = await Vendor.findById(vendorId);
  if (!vendor) throw new ErrorResponse(404, "Vendor not found");

  if (vendor.kycStatus === "submitted" || vendor.kycStatus === "approved") {
    throw new ErrorResponse(400, "KYC has already been submitted");
  }

  const services = parseJsonField(body.services, []);
  const destinations = parseJsonField(body.destinations, []);
  const verifiedDocs = parseJsonField(body.verifiedDocs, {});

  if (!Array.isArray(services) || services.length === 0) {
    throw new ErrorResponse(400, "Select at least one service");
  }
  if (!Array.isArray(destinations) || destinations.length === 0) {
    throw new ErrorResponse(400, "Select at least one destination");
  }
  if (!body.dailyLeadRequirement) {
    throw new ErrorResponse(400, "Daily lead requirement is required");
  }
  if (!body.officeAddress?.trim()) {
    throw new ErrorResponse(400, "Office address is required");
  }
  if (!body.officeCity?.trim()) {
    throw new ErrorResponse(400, "Office city is required");
  }
  if (!body.officeState?.trim()) {
    throw new ErrorResponse(400, "Office state is required");
  }
  if (!body.gstNumber?.trim()) {
    throw new ErrorResponse(400, "GST number is required");
  }
  if (!body.companySince) {
    throw new ErrorResponse(400, "Company since year is required");
  }
  if (!body.teamSize) {
    throw new ErrorResponse(400, "Team size is required");
  }
  if (!body.companyType?.trim()) {
    throw new ErrorResponse(400, "Company type is required");
  }
  if (!body.referralSource?.trim()) {
    throw new ErrorResponse(400, "Referral source is required");
  }
  if (body.referralSource === "OTHERS" && !body.otherSource?.trim()) {
    throw new ErrorResponse(400, "Please specify referral source");
  }
  if (!body.marketplaceWorked) {
    throw new ErrorResponse(400, "Marketplace experience is required");
  }
  if (body.agreeTerms !== "true" && body.agreeTerms !== true) {
    throw new ErrorResponse(400, "You must agree to terms");
  }
  if (body.declareTrue !== "true" && body.declareTrue !== true) {
    throw new ErrorResponse(400, "You must confirm the declaration");
  }

  const hasVerifiedDoc = KYC_DOC_FIELDS.some((field) => verifiedDocs[field]);
  if (!hasVerifiedDoc) {
    throw new ErrorResponse(400, "Verify at least one KYC document");
  }

  for (const field of KYC_DOC_FIELDS) {
    if (verifiedDocs[field] && body[field]) {
      const check = validateDocumentNumber(field, body[field]);
      if (!check.valid) throw new ErrorResponse(400, check.message);
    }
  }

  const [companyLogo, panDocument, gstinDocument, cinDocument, aadharDocument] =
    await Promise.all([
      uploadSingle(files.companyLogo?.[0]),
      uploadSingle(files.panDocument?.[0]),
      uploadSingle(files.gstinDocument?.[0]),
      uploadSingle(files.cinDocument?.[0]),
      uploadSingle(files.aadharDocument?.[0]),
    ]);

  const existingKyc = vendor.kyc?.toObject?.() || vendor.kyc || {};

  vendor.kyc = {
    services,
    destinations,
    dailyLeadRequirement: Number(body.dailyLeadRequirement),
    officeAddress: body.officeAddress.trim(),
    officeCity: body.officeCity.trim(),
    officeState: body.officeState.trim(),
    gstNumber: body.gstNumber.trim().toUpperCase(),
    companySince: Number(body.companySince),
    companyType: body.companyType.trim(),
    teamSize: Number(body.teamSize),
    facebookUrl: body.facebookUrl?.trim() || "",
    instagramUrl: body.instagramUrl?.trim() || "",
    profileUrl: body.profileUrl?.trim() || "",
    companyLogo: companyLogo || existingKyc.companyLogo || undefined,
    panNumber: body.panNumber?.trim().toUpperCase() || existingKyc.panNumber,
    panDocument: panDocument || existingKyc.panDocument || undefined,
    gstinNumber: body.gstinNumber?.trim().toUpperCase() || existingKyc.gstinNumber,
    gstinDocument: gstinDocument || existingKyc.gstinDocument || undefined,
    cinNumber: body.cinNumber?.trim().toUpperCase() || existingKyc.cinNumber,
    cinDocument: cinDocument || existingKyc.cinDocument || undefined,
    aadharNumber: body.aadharNumber?.trim() || existingKyc.aadharNumber,
    aadharDocument: aadharDocument || existingKyc.aadharDocument || undefined,
    verifiedDocs: {
      panNumber: Boolean(verifiedDocs.panNumber),
      gstinNumber: Boolean(verifiedDocs.gstinNumber),
      cinNumber: Boolean(verifiedDocs.cinNumber),
      aadharNumber: Boolean(verifiedDocs.aadharNumber),
    },
    referralSource: body.referralSource.trim(),
    otherSource: body.otherSource?.trim() || "",
    marketplaceWorked: body.marketplaceWorked,
    submittedAt: new Date(),
  };

  vendor.kycStatus = "submitted";
  vendor.kycRejectionReason = "";
  vendor.teamSize = Number(body.teamSize);
  vendor.workingSince = Number(body.companySince);
  vendor.state = body.officeState.trim();
  vendor.locality = body.officeCity.trim();
  vendor.address = body.officeAddress.trim();

  if (companyLogo) {
    vendor.profile = companyLogo;
  }

  vendor.documents = {
    ...(vendor.documents?.toObject?.() || vendor.documents || {}),
    gst: gstinDocument || vendor.documents?.gst,
    pan: panDocument || vendor.documents?.pan,
    idProof: aadharDocument || vendor.documents?.idProof,
    registrationProof: cinDocument || vendor.documents?.registrationProof,
  };

  await vendor.save({ validateBeforeSave: false });

  return {
    kycStatus: vendor.kycStatus,
    message:
      "KYC submitted successfully. Our team will review your application within 24 hours.",
  };
};
