import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as kycController from '../../controllers/vendorKyc.controller.js';
import * as profileController from '../../controllers/vendorProfile.controller.js';
import * as listingController from '../../controllers/listing.controller.js';
import * as venuePropertyController from '../../controllers/venueProperty.controller.js';
import * as vendorLeadController from '../../controllers/vendorLead.controller.js';
import * as vendorSubscriptionController from '../../controllers/vendorSubscription.controller.js';
import * as walletController from '../../controllers/wallet.controller.js';
import { requireKycApproved } from '../../middlewares/kyc.middleware.js';
import {
  updateVendorCapabilitiesSchema,
  updateVendorProfileSchema,
  vendorCapabilitiesQuerySchema,
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
import {
  createVenuePropertySchema,
  venuePropertyIdParamsSchema,
  venuePropertyListQuerySchema,
  updateVenuePropertySchema,
} from '../../validators/venueProperty.validator.js';
import { emptyLeadPurchaseSchema, leadIdParamsSchema, vendorLeadListQuerySchema } from '../../validators/lead.validator.js';
import { testPurchaseSubscriptionSchema } from '../../validators/subscriptionPlan.validator.js';
import { walletTransactionListQuerySchema } from '../../validators/wallet.validator.js';

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
  validateRequest(vendorCapabilitiesQuerySchema, 'query'),
  profileController.getMyCapabilities,
);
router.put(
  '/capabilities',
  requireKycApproved,
  validateRequest(updateVendorCapabilitiesSchema),
  profileController.updateMyCapabilities,
);

// ---- Subscription cards and current effective plan ----
router.get('/subscription-plans', requireKycApproved, vendorSubscriptionController.listAvailablePlans);
router.get('/subscription', requireKycApproved, vendorSubscriptionController.getMySubscription);
router.post('/subscriptions/test-purchase', requireKycApproved, validateRequest(testPurchaseSubscriptionSchema), vendorSubscriptionController.testPurchasePlan);

// ---- Wallet balance and immutable ledger ----
router.get('/wallet', requireKycApproved, walletController.getMyWallet);
router.get('/wallet/transactions', requireKycApproved, validateRequest(walletTransactionListQuerySchema, 'query'), walletController.listMyWalletTransactions);

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
router.route('/listings/:listingId/revision')
  .get(
    requireKycApproved,
    validateRequest(listingIdParamsSchema, 'params'),
    listingController.getMyListingRevision,
  )
  .post(
    requireKycApproved,
    validateRequest(listingIdParamsSchema, 'params'),
    listingController.createMyListingRevision,
  )
  .patch(
    requireKycApproved,
    validateRequest(listingIdParamsSchema, 'params'),
    validateRequest(updateServiceListingSchema),
    listingController.updateMyListingRevision,
  )
  .delete(
    requireKycApproved,
    validateRequest(listingIdParamsSchema, 'params'),
    listingController.cancelMyListingRevision,
  );
router.post(
  '/listings/:listingId/revision/submit',
  requireKycApproved,
  validateRequest(listingIdParamsSchema, 'params'),
  listingController.submitMyListingRevision,
);
router.post(
  '/listings/:listingId/submit',
  requireKycApproved,
  validateRequest(listingIdParamsSchema, 'params'),
  listingController.submitMyListing,
);
router.delete(
  '/listings/:listingId',
  requireKycApproved,
  validateRequest(listingIdParamsSchema, 'params'),
  listingController.archiveMyListing,
);
router.post(
  '/listings/:listingId/unarchive',
  requireKycApproved,
  validateRequest(listingIdParamsSchema, 'params'),
  listingController.unarchiveMyListing,
);

// ---- Venue property listings ----
router.route('/venue-properties')
  .get(requireKycApproved, validateRequest(venuePropertyListQuerySchema, 'query'), venuePropertyController.listMine)
  .post(requireKycApproved, validateRequest(createVenuePropertySchema), venuePropertyController.createMine);
router.get('/venue-properties/:venuePropertyId', requireKycApproved, validateRequest(venuePropertyIdParamsSchema, 'params'), venuePropertyController.getMine);
router.patch('/venue-properties/:venuePropertyId', requireKycApproved, validateRequest(venuePropertyIdParamsSchema, 'params'), validateRequest(updateVenuePropertySchema), venuePropertyController.updateMine);
router.post('/venue-properties/:venuePropertyId/submit', requireKycApproved, validateRequest(venuePropertyIdParamsSchema, 'params'), venuePropertyController.submitMine);
router.delete('/venue-properties/:venuePropertyId', requireKycApproved, validateRequest(venuePropertyIdParamsSchema, 'params'), venuePropertyController.archiveMine);
router.post('/venue-properties/:venuePropertyId/unarchive', requireKycApproved, validateRequest(venuePropertyIdParamsSchema, 'params'), venuePropertyController.unarchiveMine);

// ---- Lead inbox and wallet-based lead unlocks ----
router.get('/leads', requireKycApproved, validateRequest(vendorLeadListQuerySchema, 'query'), vendorLeadController.listMyLeads);
router.get('/leads/shared', requireKycApproved, validateRequest(vendorLeadListQuerySchema, 'query'), vendorLeadController.listSharedLeads);
router.get('/leads/:leadId', requireKycApproved, validateRequest(leadIdParamsSchema, 'params'), vendorLeadController.getMyLead);
router.post('/leads/:leadId/purchase', requireKycApproved, validateRequest(leadIdParamsSchema, 'params'), validateRequest(emptyLeadPurchaseSchema), vendorLeadController.purchaseLead);

export default router;
