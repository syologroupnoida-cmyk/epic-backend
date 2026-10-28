import { ApiError } from '../../utils/ApiError.js';
import * as leadRepo from '../../repositories/lead.repository.js';

const createDirectLead = async ({ sourceType, source, payload }) => leadRepo.createLead({
  leadType: 'DIRECT',
  sourceType,
  targetVendorUserId: source.vendorUserId ?? source.userId,
  ...(sourceType === 'SERVICE_LISTING' && { serviceListingId: source.id }),
  ...(sourceType === 'VENUE_PROPERTY' && { venuePropertyListingId: source.id }),
  cityId: source.cityId ?? source.primaryCityId,
  customerName: payload.customerName,
  customerPhone: payload.customerPhone,
  customerEmail: payload.customerEmail,
  eventDate: payload.eventDate,
  guestCount: payload.guestCount,
  message: payload.message,
  maxBuyerCount: 1,
  status: 'ACTIVE',
});

export const createVendorProfileEnquiry = async ({ slug, payload }) => {
  const vendor = await leadRepo.findPublicVendorBySlug(slug);
  if (!vendor) throw ApiError.notFound('Vendor profile not found.');
  return createDirectLead({ sourceType: 'VENDOR_PROFILE', source: vendor, payload });
};

export const createServiceListingEnquiry = async ({ slug, payload }) => {
  const listing = await leadRepo.findPublicServiceListingBySlug(slug);
  if (!listing) throw ApiError.notFound('Service listing not found.');
  return createDirectLead({ sourceType: 'SERVICE_LISTING', source: listing, payload });
};

export const createVenuePropertyEnquiry = async ({ slug, payload }) => {
  const venueProperty = await leadRepo.findPublicVenuePropertyBySlug(slug);
  if (!venueProperty) throw ApiError.notFound('Venue property not found.');
  return createDirectLead({ sourceType: 'VENUE_PROPERTY', source: venueProperty, payload });
};

export const createSharedLead = async ({ payload }) => {
  const [city, subcategory] = await Promise.all([
    leadRepo.findActiveCityById(payload.cityId),
    leadRepo.findActiveSubcategoryById(payload.serviceSubcategoryId),
  ]);
  if (!city) throw ApiError.badRequest('Select an active city.');
  if (!subcategory) throw ApiError.badRequest('Select an active service subcategory.');

  return leadRepo.createLead({
    leadType: 'SHARED',
    sourceType: 'GET_QUOTES',
    cityId: city.id,
    serviceCategoryId: subcategory.serviceCategoryId,
    serviceSubcategoryId: subcategory.id,
    customerName: payload.customerName,
    customerPhone: payload.customerPhone,
    customerEmail: payload.customerEmail,
    eventDate: payload.eventDate,
    guestCount: payload.guestCount,
    budgetMin: payload.budgetMin,
    budgetMax: payload.budgetMax,
    message: payload.message,
    maxBuyerCount: 0,
    status: 'PENDING_REVIEW',
  });
};
