import { ApiError } from '../../utils/ApiError.js';
import { toSlug } from '../../utils/slug.js';
import * as profileRepo from '../../repositories/vendorProfile.repository.js';
import { env } from '../../config/env.js';

const serializeCity = (city) => {
  if (!city) return null;
  return {
    id: city.id,
    name: city.name,
    slug: city.slug,
    stateName: city.stateName,
    countryCode: city.countryCode,
  };
};

const serializeService = (subcategory) => ({
  id: subcategory.id,
  name: subcategory.name,
  slug: subcategory.slug,
  description: subcategory.description,
  category: {
    id: subcategory.serviceCategory.id,
    name: subcategory.serviceCategory.name,
    slug: subcategory.serviceCategory.slug,
    description: subcategory.serviceCategory.description,
    offeringKind: subcategory.serviceCategory.offeringKind,
  },
});

export const serializePublicVendorProfile = (profile) => ({
  vendorId: profile.userId,
  businessName: profile.businessName,
  slug: profile.slug,
  about: profile.about,
  logoUrl: profile.logoUrl,
  primaryCity: serializeCity(profile.primaryCity),
  services: (profile.capabilities ?? []).map(({ subcategory }) =>
    serializeService(subcategory)),
});

const serializeSelfProfile = (profile) => ({
  userId: profile.userId,
  kycStatus: profile.kycStatus,
  profileStatus: profile.profileStatus,
  businessName: profile.businessName,
  slug: profile.slug,
  about: profile.about,
  logoUrl: profile.logoUrl,
  logoPublicId: profile.logoPublicId,
  primaryCity: serializeCity(profile.primaryCity),
  createdAt: profile.createdAt,
  updatedAt: profile.updatedAt,
});

const requireProfile = async (vendorUserId) => {
  const profile = await profileRepo.findVendorBusinessProfile(vendorUserId);
  if (!profile) throw ApiError.notFound('Vendor profile not found.');
  return profile;
};

const assertApproved = (profile) => {
  if (profile.kycStatus !== 'APPROVED') {
    throw ApiError.forbidden(
      'Your KYC must be approved before you can manage your business profile.',
      { code: 'KYC_REQUIRED', kycStatus: profile.kycStatus },
    );
  }
};

const assertOwnedCompanyLogo = ({ vendorUserId, url, publicId }) => {
  if (!url && !publicId) return;
  const expectedPrefix = `epic-wedplanner/company-logo/${vendorUserId}/`;
  let parsedUrl;
  let decodedPath;
  try {
    parsedUrl = new URL(url);
    decodedPath = decodeURIComponent(parsedUrl.pathname);
  }
  catch { throw ApiError.badRequest('Invalid company logo URL.'); }
  const isOwnedUpload = parsedUrl.protocol === 'https:' &&
    parsedUrl.hostname === 'res.cloudinary.com' &&
    decodedPath.startsWith(`/${env.CLOUDINARY_CLOUD_NAME}/`) &&
    publicId.startsWith(expectedPrefix) &&
    decodedPath.includes(`/${publicId}`);
  if (!isOwnedUpload) {
    throw ApiError.badRequest(
      'Company logo must be uploaded by this vendor using upload purpose company-logo.',
    );
  }
};

export const buildVendorProfileSlug = ({ businessName, vendorUserId }) => {
  const base = toSlug(businessName ?? '');
  if (!base) throw ApiError.badRequest('Business name must contain letters or numbers.');
  const suffix = toSlug(vendorUserId).slice(-16);
  return `${base}-${suffix}`;
};

export const getMyProfile = async (vendorUserId) =>
  serializeSelfProfile(await requireProfile(vendorUserId));

export const updateMyProfile = async ({ vendorUserId, payload }) => {
  const current = await requireProfile(vendorUserId);
  assertApproved(current);

  if (payload.logoUrl !== undefined) {
    assertOwnedCompanyLogo({
      vendorUserId,
      url: payload.logoUrl,
      publicId: payload.logoPublicId,
    });
  }

  let primaryCity = current.primaryCity;
  if (payload.primaryCityId !== undefined) {
    primaryCity = payload.primaryCityId
      ? await profileRepo.findActiveCityById(payload.primaryCityId)
      : null;
    if (payload.primaryCityId && !primaryCity) {
      throw ApiError.badRequest('Select an active city.');
    }
  }

  const businessName = payload.businessName ?? current.businessName;
  const about = payload.about !== undefined ? payload.about : current.about;
  const slug = current.slug ?? (businessName
    ? buildVendorProfileSlug({ businessName, vendorUserId })
    : null);

  const nextProfileStatus = payload.profileStatus ?? current.profileStatus;
  if (nextProfileStatus === 'ACTIVE') {
    const missingFields = [
      !businessName && 'businessName',
      !about && 'about',
      !primaryCity?.isActive && 'primaryCityId',
      !slug && 'slug',
    ].filter(Boolean);
    if (missingFields.length) {
      throw new ApiError(
        422,
        'Complete the required business profile fields before publishing.',
        { missingFields },
      );
    }
  }

  const data = {
    ...(payload.businessName !== undefined && { businessName: payload.businessName }),
    ...(payload.about !== undefined && { about: payload.about }),
    ...(payload.logoUrl !== undefined && { logoUrl: payload.logoUrl }),
    ...(payload.logoPublicId !== undefined && { logoPublicId: payload.logoPublicId }),
    ...(payload.primaryCityId !== undefined && { primaryCityId: payload.primaryCityId }),
    ...(payload.profileStatus !== undefined && { profileStatus: payload.profileStatus }),
    ...(!current.slug && slug && { slug }),
  };

  const updated = await profileRepo.updateVendorBusinessProfile(vendorUserId, data);
  return serializeSelfProfile(updated);
};

export const getMyCapabilities = async (vendorUserId) => {
  const profile = await requireProfile(vendorUserId);
  assertApproved(profile);
  const capabilities = await profileRepo.listVendorCapabilities(vendorUserId);
  return {
    capabilities: capabilities.map((capability) => ({
      id: capability.id,
      status: capability.status,
      source: capability.source,
      reviewedAt: capability.reviewedAt,
      createdAt: capability.createdAt,
      updatedAt: capability.updatedAt,
      service: serializeService(capability.subcategory),
    })),
    total: capabilities.length,
  };
};

export const getPublicVendorProfile = async (slug) => {
  const profile = await profileRepo.findPublicVendorBySlug(slug);
  if (!profile) throw ApiError.notFound('Vendor profile not found.');
  return serializePublicVendorProfile(profile);
};

export const listPublicVendorProfiles = async (query) => {
  const { vendors, total } = await profileRepo.listPublicVendorProfiles(query);
  const totalPages = Math.ceil(total / query.limit);

  return {
    vendors: vendors.map(serializePublicVendorProfile),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages,
      hasNextPage: query.page < totalPages,
      hasPrevPage: query.page > 1,
    },
  };
};
