import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';

const KYC_SELECT = {
  vendorUserId: true,
  businessName: true,
  companyName: true,
  contactPerson: true,
  logoName: true,
  description: true,
  whatsappNumber: true,
  primaryOperatingCity: true,
  serviceCategoryIds: true,
  serviceSubcategoryIds: true,
  addressStreet: true,
  addressLocality: true,
  addressState: true,
  addressPincode: true,
  facebookUrl: true,
  instagramUrl: true,
  source: true,
  sourceNote: true,
  declaredDocumentStatus: true,
  submittedAt: true,
  reviewedAt: true,
  reviewedByAdminId: true,
  rejectionReason: true,
};

const DOC_SELECT = {
  id: true,
  type: true,
  documentNumber: true,
  documentUrl: true,
  isVerified: true,
  verifiedAt: true,
  verifiedByAdminId: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
};

export const findVendorProfile = async (userId) => {
  return prisma.vendorProfile.findUnique({
    where: { userId },
    include: {
      kyc: { select: KYC_SELECT },
      user: { select: { firstName: true, lastName: true, email: true, phone: true } },
      documents: { select: DOC_SELECT },
    },
  });
};

// Lightweight lookup used by login / /auth/me to drive the frontend's
// post-login redirect (KYC page vs dashboard).
export const findVendorKycStatus = async (userId) => {
  return prisma.vendorProfile.findUnique({
    where: { userId },
    select: { kycStatus: true },
  });
};

/**
 * Fetch a single KYC document row by (vendorUserId, type). Used to inspect the stored number and image for a document type.
 */
export const findKycDocument = async ({ vendorUserId, type }) => {
  return prisma.vendorKycDocument.findUnique({
    where: { vendorUserId_type: { vendorUserId, type } },
    select: DOC_SELECT,
  });
};

export const upsertDocumentPart = async ({ vendorUserId, type, field, value }) => {
  return prisma.$transaction(async (tx) => {
    const profile = await tx.vendorProfile.findUnique({ where: { userId: vendorUserId }, select: { kycStatus: true } });
    if (!profile) throw ApiError.notFound('Vendor profile not found.');
    if (profile.kycStatus !== 'PENDING' && profile.kycStatus !== 'REJECTED') {
      throw ApiError.forbidden('KYC is under review or already approved.');
    }
    return tx.vendorKycDocument.upsert({
      where: { vendorUserId_type: { vendorUserId, type } },
      create: { vendorUserId, type, [field]: value },
      update: {
        [field]: value, isVerified: false, verifiedAt: null, verifiedByAdminId: null,
        notes: null, thirdPartyVerified: false, thirdPartyProvider: null,
        thirdPartyVerifiedAt: null, thirdPartyResponse: null,
      },
      select: DOC_SELECT,
    });
  });
};

// ---- Whole-KYC writes (used by /vendor/kyc submit + admin review) ----

/**
 * Vendor submits or resubmits the company-level fields. Documents are NOT
 * touched here — they are managed by the number and image upload endpoints.
 *
 * Transactionally:
 *   1. Upserts the VendorKyc main row (resets review fields on resubmit).
 *   2. Flips VendorProfile.kycStatus → SUBMITTED.
 *   3. Deactivates the User (isActive=false) — vendor can't log in again
 *      until admin approves. Existing access tokens still work until expiry
 *      (~15 min) so the vendor can see the "thank you" screen.
 *   4. Revokes all refresh tokens so the session can't be extended.
 */
export const upsertKycAndMarkSubmitted = async ({ vendorUserId, kyc }) => {
  return prisma.$transaction(async (tx) => {
    const profileForSubmit = await tx.vendorProfile.findUnique({ where: { userId: vendorUserId }, select: { kycStatus: true } });
    if (!profileForSubmit || !['PENDING', 'REJECTED'].includes(profileForSubmit.kycStatus)) {
      throw ApiError.forbidden('KYC cannot be submitted in its current state.');
    }
    const documentRows = await tx.vendorKycDocument.findMany({ where: { vendorUserId }, select: DOC_SELECT });
    const pan = documentRows.find((doc) => doc.type === 'PAN');
    const aadhaar = documentRows.find((doc) => doc.type === 'AADHAR');
    if (!pan?.documentNumber || !pan?.documentUrl || !aadhaar?.documentNumber || !aadhaar?.documentUrl ||
        documentRows.some((doc) => !doc.documentNumber || !doc.documentUrl)) {
      throw new ApiError(422, 'Save PAN and Aadhaar numbers and upload both card images before submitting KYC. Optional documents also need both parts.');
    }
    const created = await tx.vendorKyc.upsert({
      where: { vendorUserId },
      create: { vendorUserId, ...kyc },
      update: {
        ...kyc,
        submittedAt: new Date(),
        reviewedAt: null,
        reviewedByAdminId: null,
        rejectionReason: null,
      },
      select: KYC_SELECT,
    });

    const profile = await tx.vendorProfile.update({
      where: { userId: vendorUserId },
      data: { kycStatus: 'SUBMITTED' },
      select: { userId: true, kycStatus: true, updatedAt: true },
    });

    // Deactivate the account so the vendor can't log in again until admin
    // makes a decision. They'll see a clear "under review" message on login.
    await tx.user.update({
      where: { id: vendorUserId },
      data: { isActive: false },
    });

    // Revoke all refresh tokens so they can't extend the current session
    // beyond the access token's natural expiry.
    await tx.refreshToken.updateMany({
      where: { userId: vendorUserId, isRevoked: false },
      data: { isRevoked: true },
    });

    const documents = await tx.vendorKycDocument.findMany({
      where: { vendorUserId },
      select: DOC_SELECT,
    });
    return { kyc: { ...created, documents }, profile };
  });
};

// Admin approves the KYC — also re-activates the User so the vendor can
// log back in. From here on they have full marketplace access.
export const approveKyc = async ({ vendorUserId, adminId }) => {
  return prisma.$transaction(async (tx) => {
    const kyc = await tx.vendorKyc.update({
      where: { vendorUserId },
      data: {
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
        rejectionReason: null,
      },
      select: KYC_SELECT,
    });
    await tx.vendorKycDocument.updateMany({
      where: { vendorUserId },
      data: { isVerified: true, verifiedAt: new Date(), verifiedByAdminId: adminId },
    });
    const profile = await tx.vendorProfile.update({
      where: { userId: vendorUserId },
      data: { kycStatus: 'APPROVED' },
      select: { userId: true, kycStatus: true, updatedAt: true },
    });
    const user = await tx.user.update({
      where: { id: vendorUserId },
      data: { isActive: true },
      select: { id: true, email: true, firstName: true, isActive: true },
    });
    const documents = await tx.vendorKycDocument.findMany({
      where: { vendorUserId },
      select: DOC_SELECT,
    });
    return { kyc: { ...kyc, documents }, profile, user };
  });
};

// Admin rejects the KYC — re-activates the User so the vendor can log
// back in, see the rejection reason, and resubmit a corrected KYC.
// (A second submission will flip isActive back to false.)
export const rejectKyc = async ({ vendorUserId, adminId, reason }) => {
  return prisma.$transaction(async (tx) => {
    const kyc = await tx.vendorKyc.update({
      where: { vendorUserId },
      data: {
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
        rejectionReason: reason,
      },
      select: KYC_SELECT,
    });
    await tx.vendorKycDocument.updateMany({
      where: { vendorUserId },
      data: { isVerified: false, verifiedAt: null, verifiedByAdminId: null },
    });
    const profile = await tx.vendorProfile.update({
      where: { userId: vendorUserId },
      data: { kycStatus: 'REJECTED' },
      select: { userId: true, kycStatus: true, updatedAt: true },
    });
    const user = await tx.user.update({
      where: { id: vendorUserId },
      data: { isActive: true },
      select: { id: true, email: true, firstName: true, isActive: true },
    });
    const documents = await tx.vendorKycDocument.findMany({
      where: { vendorUserId },
      select: DOC_SELECT,
    });
    return { kyc: { ...kyc, documents }, profile, user };
  });
};

export const listKycSubmissions = async ({ status, take, skip }) => {
  const where = status ? { kycStatus: status } : {};
  const [items, total] = await Promise.all([
    prisma.vendorProfile.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      take,
      skip,
      include: {
        kyc: { select: KYC_SELECT },
        documents: { select: DOC_SELECT },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            isActive: true,
            emailVerifiedAt: true,
            createdAt: true,
          },
        },
      },
    }),
    prisma.vendorProfile.count({ where }),
  ]);
  return { items, total };
};
