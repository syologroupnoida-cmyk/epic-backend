import { Router } from 'express';
import * as profileController from '../../controllers/vendorProfile.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import {
  publicVendorListQuerySchema,
  publicVendorSlugSchema,
} from '../../validators/vendorProfile.validator.js';
import * as listingController from '../../controllers/listing.controller.js';
import {
  listingSlugParamsSchema,
  publicListingListQuerySchema,
} from '../../validators/listing.validator.js';

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

router.get(
  '/vendors/:slug',
  validateRequest(publicVendorSlugSchema, 'params'),
  profileController.getPublicVendorProfile,
);

export default router;
