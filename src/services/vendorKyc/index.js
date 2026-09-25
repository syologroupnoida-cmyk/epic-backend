import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import * as kycRepo from '../../repositories/vendorKyc.repository.js';
import {
  sendVendorApprovedNotice,
  sendVendorRejectedNotice,
} from '../mail/index.js';

// Vendor-facing login page. Centralized here so all KYC outcome emails point
// to the same URL — change once when the frontend route changes.
const VENDOR_LOGIN_URL = `${env.FRONTEND_URL}/vendor/login`;

// Legacy provider fields remain in the database for migration compatibility.
const stripInternalDocFields = (documents) =>
  (documents ?? []).map(({ thirdPartyResponse, thirdPartyVerified, thirdPartyProvider, thirdPartyVerifiedAt, ...rest }) => rest);

const buildVendorKycView = (profile) => ({
  kycStatus: profile.kycStatus,
  kyc: profile.kyc ?? null,
  registration: {
    contactPersonName: `${profile.user.firstName} ${profile.user.lastName}`.trim(),
    mobileNumber: profile.user.phone,
    email: profile.user.email,
  },
  documents: stripInternalDocFields(profile.documents),
  approval: buildApprovalSummary(profile.kycStatus),
});

/**
 * Frontend-friendly summary of where the vendor stands in the approval
 * pipeline. Derived from `kycStatus` — single source of truth in the DB.
 */
const buildApprovalSummary = (kycStatus) => {
  switch (kycStatus) {
    case 'PENDING':
      return {
        status: 'KYC_NOT_SUBMITTED',
        adminApproved: false,
        canLogin: true,
        message: 'Please complete and submit your KYC to continue.',
      };
    case 'SUBMITTED':
      return {
        status: 'PENDING_ADMIN_REVIEW',
        adminApproved: false,
        canLogin: false,
        message:
          'Your application is under review. We will email you once an admin approves your account.',
      };
    case 'APPROVED':
      return {
        status: 'APPROVED',
        adminApproved: true,
        canLogin: true,
        message: 'Your KYC is approved. You can use your vendor account.',
      };
    case 'REJECTED':
      return {
        status: 'REJECTED',
        adminApproved: false,
        canLogin: true,
        message:
          'Your KYC was rejected. Please review the reason, fix the issues, and resubmit.',
      };
    default:
      return {
        status: 'UNKNOWN',
        adminApproved: false,
        canLogin: false,
        message: null,
      };
  }
};

/**
 * Persist only fields not already collected during vendor registration.
 */
const mapPayloadToKyc = (payload) => ({
  businessName: payload.businessName,
  whatsappNumber: payload.whatsappNumber,
  primaryOperatingCity: payload.primaryOperatingCity,
  addressStreet: payload.businessAddress.street,
  addressLocality: payload.businessAddress.locality,
  addressState: payload.businessAddress.state,
  addressPincode: payload.businessAddress.pincode,
});

export const getMyKycStatus = async (vendorUserId) => {
  const profile = await kycRepo.findVendorProfile(vendorUserId);
  if (!profile) {
    throw ApiError.notFound('Vendor profile not found.');
  }
  return buildVendorKycView(profile);
};

const DOCUMENT_PURPOSE_TYPES = {
  'kyc-pan': 'PAN', 'kyc-aadhaar': 'AADHAR', 'kyc-gst': 'GSTIN', 'kyc-cin': 'CIN',
};

export const assertKycEditable = async (vendorUserId) => {
  const profile = await kycRepo.findVendorKycStatus(vendorUserId);
  if (!profile) throw ApiError.notFound('Vendor profile not found.');
  if (profile.kycStatus === 'APPROVED' || profile.kycStatus === 'SUBMITTED') {
    throw ApiError.forbidden('KYC is under review or already approved.');
  }
};

export const saveDocumentNumber = async ({ vendorUserId, type, number }) => {
  await assertKycEditable(vendorUserId);
  const storedNumber = type === 'AADHAR' ? `XXXXXXXX${number.slice(-4)}` : number;
  return kycRepo.upsertDocumentPart({ vendorUserId, type, field: 'documentNumber', value: storedNumber });
};

export const saveDocumentImage = async ({ vendorUserId, purpose, url }) => {
  const type = DOCUMENT_PURPOSE_TYPES[purpose];
  if (!type) throw ApiError.badRequest('Invalid KYC document purpose.');
  await assertKycEditable(vendorUserId);
  return kycRepo.upsertDocumentPart({ vendorUserId, type, field: 'documentUrl', value: url });
};

export const submitMyKyc = async ({ vendorUserId, payload }) => {
  const profile = await kycRepo.findVendorProfile(vendorUserId);
  if (!profile) {
    throw ApiError.notFound('Vendor profile not found.');
  }
  if (profile.kycStatus === 'APPROVED') {
    throw ApiError.forbidden(
      'Your KYC is already approved. Contact support to update business details.',
    );
  }
  if (profile.kycStatus === 'SUBMITTED') {
    throw ApiError.forbidden(
      'A KYC submission is already under review. Please wait for admin response.',
    );
  }

  const kycFields = mapPayloadToKyc(payload);
  const { kyc, profile: updatedProfile } = await kycRepo.upsertKycAndMarkSubmitted({
    vendorUserId,
    kyc: kycFields,
  });

  return {
    kycStatus: updatedProfile.kycStatus,
    kyc,
    approval: buildApprovalSummary(updatedProfile.kycStatus),
  };
};

export const listKycForAdmin = async (query) => {
  const { items, total } = await kycRepo.listKycSubmissions(query);
  // Expose only the document fields used by manual review.
  const cleanItems = items.map((item) => ({
    ...item,
    documents: stripInternalDocFields(item.documents),
  }));
  return { items: cleanItems, total };
};

// Only a submitted application can be approved after manual document review.
const APPROVABLE_KYC_STATES = ['SUBMITTED'];

export const approveVendorKyc = async ({ vendorUserId, adminId }) => {
  const profile = await kycRepo.findVendorProfile(vendorUserId);
  if (!profile) {
    throw ApiError.notFound('Vendor profile not found.');
  }
  if (!APPROVABLE_KYC_STATES.includes(profile.kycStatus)) {
    throw ApiError.badRequest(
      `Cannot approve KYC from status ${profile.kycStatus}. ` +
        `Vendor must be in one of: ${APPROVABLE_KYC_STATES.join(', ')}.`,
    );
  }
  const pan = profile.documents.find((doc) => doc.type === 'PAN');
  const aadhaar = profile.documents.find((doc) => doc.type === 'AADHAR');
  if (!profile.kyc || !pan?.documentNumber || !pan?.documentUrl ||
      !aadhaar?.documentNumber || !aadhaar?.documentUrl ||
      profile.documents.some((doc) => !doc.documentNumber || !doc.documentUrl)) {
    throw new ApiError(422, 'PAN and Aadhaar numbers and card images are required before approval.');
  }

  const { kyc, profile: updatedProfile, user } = await kycRepo.approveKyc({
    vendorUserId,
    adminId,
  });

  // Fire-and-forget approval email. Approval still succeeds if SMTP fails —
  // admin can resend manually if needed.
  sendVendorApprovedNotice({
    to: user.email,
    firstName: user.firstName,
    loginUrl: VENDOR_LOGIN_URL,
  }).catch((err) =>
    console.error('[kyc] Failed to send vendor-approved notice:', err?.message),
  );

  return {
    kycStatus: updatedProfile.kycStatus,
    kyc,
    approval: buildApprovalSummary(updatedProfile.kycStatus),
  };
};

// Allowed source states for /reject:
//   SUBMITTED → REJECTED  — normal review-time rejection
//   APPROVED  → REJECTED  — mistake-undo for an accidental approval
// All other states (NOT_SUBMITTED, IN_PROGRESS, REJECTED) are blocked.
const REJECTABLE_KYC_STATES = ['SUBMITTED', 'APPROVED'];

export const rejectVendorKyc = async ({ vendorUserId, adminId, reason }) => {
  const profile = await kycRepo.findVendorProfile(vendorUserId);
  if (!profile) {
    throw ApiError.notFound('Vendor profile not found.');
  }
  if (!REJECTABLE_KYC_STATES.includes(profile.kycStatus)) {
    throw ApiError.badRequest(
      `Cannot reject KYC from status ${profile.kycStatus}. ` +
        `Vendor must be in one of: ${REJECTABLE_KYC_STATES.join(', ')}.`,
    );
  }
  const wasApproved = profile.kycStatus === 'APPROVED';

  const { kyc, profile: updatedProfile, user } = await kycRepo.rejectKyc({
    vendorUserId,
    adminId,
    reason,
  });

  // Audit trail — explicit log line for the rarer "approval undone" path so it's
  // easy to grep through logs later if a vendor disputes the decision.
  if (wasApproved) {
    console.log(
      `[admin-audit] KYC_APPROVAL_REVERTED_AND_REJECTED vendor=${vendorUserId} by admin=${adminId} reason="${reason}"`,
    );
  }

  // Fire-and-forget rejection email so vendor knows to log back in and fix.
  sendVendorRejectedNotice({
    to: user.email,
    firstName: user.firstName,
    reason,
    loginUrl: VENDOR_LOGIN_URL,
  }).catch((err) =>
    console.error('[kyc] Failed to send vendor-rejected notice:', err?.message),
  );

  return {
    kycStatus: updatedProfile.kycStatus,
    kyc,
    approval: buildApprovalSummary(updatedProfile.kycStatus),
  };
};
