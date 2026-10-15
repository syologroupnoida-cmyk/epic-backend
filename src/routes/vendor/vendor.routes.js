import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as kycController from '../../controllers/vendorKyc.controller.js';
import * as profileController from '../../controllers/vendorProfile.controller.js';
import * as listingController from '../../controllers/listing.controller.js';
import { requireKycApproved } from '../../middlewares/kyc.middleware.js';
import {
  updateVendorCapabilitiesSchema,
  updateVendorProfileSchema,
} from '../../validators/vendorProfile.validator.js';
import {
  submitKycSchema,
  documentNumberSchemas,
} from '../../validators/vendorKyc.validator.js';
import {
  createServiceListingSchema,
  listingIdParamsSchema,
  updateServiceListingSchema,
  vendorListingListQuerySchema,
} from '../../validators/listing.validator.js';

const router = Router();

router.get('/ping', (req, res) =>
  sendSuccess(res, {
    message: 'Vendor panel reachable.',
    data: { user: req.user },
  }),
);

// ---- KYC status + final submission ----
router.get('/kyc', kycController.getMyKycStatus);
for (const [slug, type] of [['pan', 'PAN'], ['aadhaar', 'AADHAR'], ['gstin', 'GSTIN'], ['cin', 'CIN']]) {
  router.post(
    `/kyc/validate/${slug}`,
    validateRequest(documentNumberSchemas[type]),
    kycController.validateDocumentNumber(type),
  );
}
router.post('/kyc', validateRequest(submitKycSchema), kycController.submitMyKyc);

// ---- Business profile + normalized, approved capabilities ----
// A vendor can view the profile shell at any stage. Approval initializes its
// public fields from the verified KYC snapshot; editing starts after approval.
router.get('/profile', profileController.getMyProfile);
router.patch(
  '/profile',
  requireKycApproved,
  validateRequest(updateVendorProfileSchema),
  profileController.updateMyProfile,
);
router.get(
  '/capabilities',
  requireKycApproved,
  profileController.getMyCapabilities,
);
router.put(
  '/capabilities',
  requireKycApproved,
  validateRequest(updateVendorCapabilitiesSchema),
  profileController.updateMyCapabilities,
);

// ---- Service listings ----
router.route('/listings')
  .get(
    requireKycApproved,
    validateRequest(vendorListingListQuerySchema, 'query'),
    listingController.listMyListings,
  )
  .post(
    requireKycApproved,
    validateRequest(createServiceListingSchema),
    listingController.createMyServiceListing,
  );
router.get(
  '/listings/:listingId',
  requireKycApproved,
  validateRequest(listingIdParamsSchema, 'params'),
  listingController.getMyListing,
);
router.patch(
  '/listings/:listingId',
  requireKycApproved,
  validateRequest(listingIdParamsSchema, 'params'),
  validateRequest(updateServiceListingSchema),
  listingController.updateMyListing,
);
router.post(
  '/listings/:listingId/submit',
  requireKycApproved,
  validateRequest(listingIdParamsSchema, 'params'),
  listingController.submitMyListing,
);

export default router;
