import prisma from '../config/db.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

const KYC_SELECT = {
  vendorUserId: true,
  businessName: true,
  companyName: true,
  contactPerson: true,
  description: true,
  whatsappNumber: true,
  primaryCityId: true,
  primaryOperatingCity: true,
  serviceCategoryIds: true,
  serviceSubcategoryIds: true,
  addressStreet: true,
  addressLocality: true,
  addressCity: true,
  addressState: true,
  addressPincode: true,
  addressCountryCode: true,
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
  documentPublicId: true,
  isVerified: true,
  verifiedAt: true,
  verifiedByAdminId: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
};

const MANAGED_KYC_DOCUMENT_TYPES = ['PAN', 'AADHAR', 'GSTIN', 'CIN'];

const claimKycStatus = async ({ tx, vendorUserId, expectedStatus, nextStatus }) => {
  const expectedStatuses = Array.isArray(expectedStatus) ? expectedStatus : [expectedStatus];
  const { count } = await tx.vendorProfile.updateMany({
    where: {
      userId: vendorUserId,
      kycStatus: { in: expectedStatuses },
    },
    data: { kycStatus: nextStatus },
  });
  if (count !== 1) {
    throw ApiError.conflict(
      'KYC status changed while this action was being processed. Refresh and try again.',
    );
  }
};

const reviewKycSnapshot = async ({
  tx,
  vendorUserId,
  expectedSubmittedAt,
  reviewData,
}) => {
  const { count } = await tx.vendorKyc.updateMany({
    where: { vendorUserId, submittedAt: expectedSubmittedAt },
    data: reviewData,
  });
  if (count !== 1) {
    throw ApiError.conflict(
      'The vendor submitted a newer KYC application. Refresh before reviewing it.',
    );
  }
  return tx.vendorKyc.findUnique({
    where: { vendorUserId },
    select: KYC_SELECT,
  });
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

// ---- Whole-KYC writes (used by /vendor/kyc submit + admin review) ----

/**
 * Vendor submits or resubmits a complete KYC snapshot, including document
 * references produced by the upload endpoints.
 *
 * Transactionally:
 *   1. Atomically claims the SUBMITTED state.
 *   2. Replaces managed document rows and upserts the VendorKyc main row.
 *   3. Deactivates the User (isActive=false) — vendor can't log in again
 *      until admin approves. Existing access tokens still work until expiry
 *      (~15 min) so the vendor can see the "thank you" screen.
 *   4. Revokes all refresh tokens so the session can't be extended.
 */
export const upsertKycAndMarkSubmitted = async ({ vendorUserId, kyc, documents }) => {
  return prisma.$transaction(async (tx) => {
    await claimKycStatus({
      tx,
      vendorUserId,
      expectedStatus: ['PENDING', 'REJECTED'],
      nextStatus: 'SUBMITTED',
    });

    const submittedDocumentTypes = new Set(documents.map(({ type }) => type));
    const removedDocumentTypes = MANAGED_KYC_DOCUMENT_TYPES.filter(
      (type) => !submittedDocumentTypes.has(type),
    );
    if (removedDocumentTypes.length) {
      await tx.vendorKycDocument.deleteMany({
        where: {
          vendorUserId,
          type: { in: removedDocumentTypes },
        },
      });
    }

    for (const document of documents) {
      await tx.vendorKycDocument.upsert({
        where: { vendorUserId_type: { vendorUserId, type: document.type } },
        create: { vendorUserId, ...document },
        update: {
          documentNumber: document.documentNumber,
          documentUrl: document.documentUrl,
          documentPublicId: document.documentPublicId,
          isVerified: false,
          verifiedAt: null,
          verifiedByAdminId: null,
          notes: null,
          thirdPartyVerified: false,
          thirdPartyProvider: null,
          thirdPartyVerifiedAt: null,
          thirdPartyResponse: null,
        },
      });
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
      // Submission only advances the verification workflow. Public business
      // fields are initialized after an admin approves this KYC snapshot.
      data: { kycStatus: 'SUBMITTED' },
      select: {
        userId: true,
        kycStatus: true,
        updatedAt: true,
      },
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

    const savedDocuments = await tx.vendorKycDocument.findMany({
      where: { vendorUserId },
      select: DOC_SELECT,
    });
    return { kyc: { ...created, documents: savedDocuments }, profile };
  });
};

// Admin approves the KYC — also re-activates the User so the vendor can
// log back in. From here on they have full marketplace access.
export const approveKyc = async ({
  vendorUserId,
  adminId,
  profileSlug,
  expectedSubmittedAt,
}) => {
  return prisma.$transaction(async (tx) => {
    await claimKycStatus({
      tx,
      vendorUserId,
      expectedStatus: 'SUBMITTED',
      nextStatus: 'APPROVED',
    });

    const kyc = await reviewKycSnapshot({
      tx,
      vendorUserId,
      expectedSubmittedAt,
      reviewData: {
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
        rejectionReason: null,
      },
    });

    let primaryCity = null;
    if (kyc.primaryCityId) {
      primaryCity = await tx.city.findFirst({
        where: { id: kyc.primaryCityId, isActive: true },
        select: { id: true },
      });
      if (!primaryCity) {
        throw ApiError.conflict(
          'The selected primary city is no longer active. Reactivate it or reject the KYC for correction.',
        );
      }
    } else if (kyc.primaryOperatingCity) {
      // Compatibility for submissions created before KYC stored City IDs.
      const matchingCities = await tx.city.findMany({
        where: {
          name: { equals: kyc.primaryOperatingCity, mode: 'insensitive' },
          isActive: true,
        },
        select: { id: true },
        take: 2,
      });
      primaryCity = matchingCities.length === 1 ? matchingCities[0] : null;
    }

    await tx.vendorCapability.updateMany({
      where: {
        vendorUserId,
        source: 'KYC',
        serviceSubcategoryId: { notIn: kyc.serviceSubcategoryIds },
      },
      data: {
        status: 'INACTIVE',
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
      },
    });

    for (const serviceSubcategoryId of kyc.serviceSubcategoryIds) {
      await tx.vendorCapability.upsert({
        where: {
          vendorUserId_serviceSubcategoryId: { vendorUserId, serviceSubcategoryId },
        },
        create: {
          vendorUserId,
          serviceSubcategoryId,
          status: 'APPROVED',
          source: 'KYC',
          reviewedAt: new Date(),
          reviewedByAdminId: adminId,
        },
        update: {
          status: 'APPROVED',
          source: 'KYC',
          reviewedAt: new Date(),
          reviewedByAdminId: adminId,
        },
      });
    }

    await tx.vendorKycDocument.updateMany({
      where: { vendorUserId },
      data: { isVerified: true, verifiedAt: new Date(), verifiedByAdminId: adminId },
    });
    const profile = await tx.vendorProfile.update({
      where: { userId: vendorUserId },
      data: {
        kycStatus: 'APPROVED',
        businessName: kyc.businessName ?? kyc.companyName ?? null,
        about: kyc.description ?? null,
        slug: profileSlug,
        ...(primaryCity && { primaryCityId: primaryCity.id }),
        profileStatus: 'DRAFT',
      },
      select: {
        userId: true,
        kycStatus: true,
        businessName: true,
        slug: true,
        about: true,
        primaryCityId: true,
        profileStatus: true,
        updatedAt: true,
      },
    });
    // The wallet is created only once. A KYC resubmission/re-approval never
    // grants the signup promotion a second time.
    await tx.vendorWallet.upsert({
      where: { vendorUserId },
      create: {
        vendorUserId,
        balance: env.SIGNUP_WALLET_BONUS,
        transactions: env.SIGNUP_WALLET_BONUS > 0
          ? {
            create: {
              amount: env.SIGNUP_WALLET_BONUS,
              balanceAfter: env.SIGNUP_WALLET_BONUS,
              type: 'SIGNUP_BONUS',
              description: 'Vendor KYC approval signup wallet credit.',
              referenceType: 'KYC_APPROVAL',
              referenceId: vendorUserId,
            },
          }
          : undefined,
      },
      update: {},
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
    const capabilities = await tx.vendorCapability.findMany({
      where: { vendorUserId, status: 'APPROVED' },
      include: {
        subcategory: {
          include: { serviceCategory: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return { kyc: { ...kyc, documents }, profile, capabilities, user };
  });
};

// Admin rejects the KYC — re-activates the User so the vendor can log
// back in, see the rejection reason, and resubmit a corrected KYC.
// (A second submission will flip isActive back to false.)
export const rejectKyc = async ({
  vendorUserId,
  adminId,
  reason,
  expectedKycStatus,
  expectedSubmittedAt,
}) => {
  return prisma.$transaction(async (tx) => {
    await claimKycStatus({
      tx,
      vendorUserId,
      expectedStatus: expectedKycStatus,
      nextStatus: 'REJECTED',
    });

    const kyc = await reviewKycSnapshot({
      tx,
      vendorUserId,
      expectedSubmittedAt,
      reviewData: {
        reviewedAt: new Date(),
        reviewedByAdminId: adminId,
        rejectionReason: reason,
      },
    });
    await tx.vendorKycDocument.updateMany({
      where: { vendorUserId },
      data: { isVerified: false, verifiedAt: null, verifiedByAdminId: null },
    });
    const profile = await tx.vendorProfile.update({
      where: { userId: vendorUserId },
      data: { kycStatus: 'REJECTED', profileStatus: 'SUSPENDED' },
      select: {
        userId: true,
        kycStatus: true,
        profileStatus: true,
        updatedAt: true,
      },
    });
    await tx.vendorCapability.updateMany({
      where: { vendorUserId },
      data: { status: 'INACTIVE', reviewedAt: new Date(), reviewedByAdminId: adminId },
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
