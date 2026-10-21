import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as kycController from '../../controllers/vendorKyc.controller.js';
import {
  adminVendorKycParamsSchema,
  listKycQuerySchema,
  rejectKycSchema,
} from '../../validators/vendorKyc.validator.js';
import * as catalogController from '../../controllers/serviceCatalog.controller.js';
import { uploadSingleFile } from '../../middlewares/upload.middleware.js';
import { createCategoryPayloadSchema, updateCategorySchema, createSubcategoryPayloadSchema, updateSubcategorySchema, listCatalogSchema, listSubcategoriesSchema } from '../../validators/serviceCatalog.validator.js';
import * as cityController from '../../controllers/city.controller.js';
import { createCitySchema, updateCitySchema, listCitiesSchema } from '../../validators/city.validator.js';
import * as listingController from '../../controllers/listing.controller.js';
import * as venuePropertyController from '../../controllers/venueProperty.controller.js';
import {
  adminListingListQuerySchema,
  listingIdParamsSchema,
  pauseListingSchema,
  rejectListingSchema,
} from '../../validators/listing.validator.js';
import {
  adminVenuePropertyListQuerySchema,
  pauseVenuePropertySchema,
  rejectVenuePropertySchema,
  venuePropertyIdParamsSchema,
} from '../../validators/venueProperty.validator.js';

const router = Router();

router.get('/ping', (req, res) =>
  sendSuccess(res, {
    message: 'Admin panel reachable.',
    data: { user: req.user },
  }),
);

// --- Vendor KYC review ---
router.get(
  '/vendor-kyc',
  validateRequest(listKycQuerySchema, 'query'),
  kycController.listKycForAdmin,
);
router.get(
  '/vendor-kyc/:userId',
  validateRequest(adminVendorKycParamsSchema, 'params'),
  kycController.getKycForAdmin,
);

router.post(
  '/vendor-kyc/:userId/approve',
  validateRequest(adminVendorKycParamsSchema, 'params'),
  kycController.approveVendorKyc,
);

router.post(
  '/vendor-kyc/:userId/reject',
  validateRequest(adminVendorKycParamsSchema, 'params'),
  validateRequest(rejectKycSchema),
  kycController.rejectVendorKyc,
);

router.route('/service-categories')
  .get(validateRequest(listCatalogSchema, 'query'), catalogController.listCategories)
  .post(uploadSingleFile, validateRequest(createCategoryPayloadSchema), catalogController.createCategory);
router.route('/service-categories/:id')
  .get(catalogController.getCategory)
  .patch(uploadSingleFile, validateRequest(updateCategorySchema), catalogController.updateCategory)
  .put(uploadSingleFile, validateRequest(updateCategorySchema), catalogController.updateCategory)
  .delete(catalogController.deleteCategory);
router.route('/service-subcategories')
  .get(validateRequest(listSubcategoriesSchema, 'query'), catalogController.listSubcategories)
  .post(uploadSingleFile, validateRequest(createSubcategoryPayloadSchema), catalogController.createSubcategory);
router.route('/service-subcategories/:id')
  .get(catalogController.getSubcategory)
  .patch(uploadSingleFile, validateRequest(updateSubcategorySchema), catalogController.updateSubcategory)
  .put(uploadSingleFile, validateRequest(updateSubcategorySchema), catalogController.updateSubcategory)
  .delete(catalogController.deleteSubcategory);

router.route('/cities')
  .get(validateRequest(listCitiesSchema, 'query'), cityController.listCities)
  .post(validateRequest(createCitySchema), cityController.createCity);
router.route('/cities/:id')
  .get(cityController.getCity)
  .patch(validateRequest(updateCitySchema), cityController.updateCity)
  .put(validateRequest(updateCitySchema), cityController.updateCity);

// --- Service listing review ---
router.get(
  '/listings',
  validateRequest(adminListingListQuerySchema, 'query'),
  listingController.listListingsForAdmin,
);
router.get(
  '/listings/:listingId',
  validateRequest(listingIdParamsSchema, 'params'),
  listingController.getListingForAdmin,
);
router.post(
  '/listings/:listingId/approve',
  validateRequest(listingIdParamsSchema, 'params'),
  listingController.approveListing,
);
router.post(
  '/listings/:listingId/reject',
  validateRequest(listingIdParamsSchema, 'params'),
  validateRequest(rejectListingSchema),
  listingController.rejectListing,
);
router.post(
  '/listings/:listingId/pause',
  validateRequest(listingIdParamsSchema, 'params'),
  validateRequest(pauseListingSchema),
  listingController.pauseListing,
);
router.post(
  '/listings/:listingId/resume',
  validateRequest(listingIdParamsSchema, 'params'),
  listingController.resumeListing,
);

// --- Venue property review ---
router.get('/venue-properties', validateRequest(adminVenuePropertyListQuerySchema, 'query'), venuePropertyController.listAdmin);
router.get('/venue-properties/:venuePropertyId', validateRequest(venuePropertyIdParamsSchema, 'params'), venuePropertyController.getAdmin);
router.post('/venue-properties/:venuePropertyId/approve', validateRequest(venuePropertyIdParamsSchema, 'params'), venuePropertyController.approve);
router.post('/venue-properties/:venuePropertyId/reject', validateRequest(venuePropertyIdParamsSchema, 'params'), validateRequest(rejectVenuePropertySchema), venuePropertyController.reject);
router.post('/venue-properties/:venuePropertyId/pause', validateRequest(venuePropertyIdParamsSchema, 'params'), validateRequest(pauseVenuePropertySchema), venuePropertyController.pause);
router.post('/venue-properties/:venuePropertyId/resume', validateRequest(venuePropertyIdParamsSchema, 'params'), venuePropertyController.resume);

export default router;
