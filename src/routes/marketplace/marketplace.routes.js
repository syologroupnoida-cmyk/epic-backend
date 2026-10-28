import { Router } from 'express';
import * as profileController from '../../controllers/vendorProfile.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  publicVendorListQuerySchema,
  publicVendorSlugSchema,
} from '../../validators/vendorProfile.validator.js';
import * as listingController from '../../controllers/listing.controller.js';
import * as venuePropertyController from '../../controllers/venueProperty.controller.js';
import {
  listingSlugParamsSchema,
  publicListingListQuerySchema,
} from '../../validators/listing.validator.js';
import {
  publicVenuePropertyListQuerySchema,
  venuePropertySlugParamsSchema,
} from '../../validators/venueProperty.validator.js';
import * as leadController from '../../controllers/lead.controller.js';
import { directEnquirySchema, sharedLeadSchema } from '../../validators/lead.validator.js';

const router = Router();

router.get(
  '/vendors',
  validateRequest(publicVendorListQuerySchema, 'query'),
  profileController.listPublicVendorProfiles,
);

router.get(
  '/listings',
  validateRequest(publicListingListQuerySchema, 'query'),
  listingController.listPublicListings,
);

router.get(
  '/listings/:slug',
  validateRequest(listingSlugParamsSchema, 'params'),
  listingController.getPublicListing,
);

router.post(
  '/listings/:slug/enquiries',
  validateRequest(listingSlugParamsSchema, 'params'),
  validateRequest(directEnquirySchema),
  leadController.createServiceListingEnquiry,
);

router.get('/venue-properties', validateRequest(publicVenuePropertyListQuerySchema, 'query'), venuePropertyController.listPublic);
router.get('/venue-properties/:slug', validateRequest(venuePropertySlugParamsSchema, 'params'), venuePropertyController.getPublic);
router.post('/venue-properties/:slug/enquiries', validateRequest(venuePropertySlugParamsSchema, 'params'), validateRequest(directEnquirySchema), leadController.createVenuePropertyEnquiry);

router.post('/leads/get-quotes', validateRequest(sharedLeadSchema), leadController.createSharedLead);

router.get(
  '/vendors/:slug',
  validateRequest(publicVendorSlugSchema, 'params'),
  profileController.getPublicVendorProfile,
);

router.post(
  '/vendors/:slug/enquiries',
  validateRequest(publicVendorSlugSchema, 'params'),
  validateRequest(directEnquirySchema),
  leadController.createVendorProfileEnquiry,
);

export default router;
