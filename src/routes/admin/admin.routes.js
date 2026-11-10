import { Router } from "express";
import { sendSuccess } from "../../utils/response.js";
import { validateRequest } from "../../middlewares/validation.middleware.js";
import * as kycController from "../../controllers/vendorKyc.controller.js";
import {
  adminVendorKycParamsSchema,
  listKycQuerySchema,
  rejectKycSchema,
} from "../../validators/vendorKyc.validator.js";
import * as catalogController from "../../controllers/serviceCatalog.controller.js";
import { uploadSingleFile } from "../../middlewares/upload.middleware.js";
import {
  createCategoryPayloadSchema,
  updateCategorySchema,
  createSubcategoryPayloadSchema,
  updateSubcategorySchema,
  listCatalogSchema,
  listSubcategoriesSchema,
} from "../../validators/serviceCatalog.validator.js";
import * as cityController from "../../controllers/city.controller.js";
import {
  createCitySchema,
  updateCitySchema,
  listCitiesSchema,
} from "../../validators/city.validator.js";
import * as listingController from "../../controllers/listing.controller.js";
import * as venuePropertyController from "../../controllers/venueProperty.controller.js";
import {
  adminListingRevisionListQuerySchema,
  adminListingListQuerySchema,
  listingIdParamsSchema,
  listingRevisionIdParamsSchema,
  pauseListingSchema,
  rejectListingSchema,
} from "../../validators/listing.validator.js";
import {
  adminVenuePropertyListQuerySchema,
  pauseVenuePropertySchema,
  rejectVenuePropertySchema,
  venuePropertyIdParamsSchema,
} from "../../validators/venueProperty.validator.js";
import * as adminLeadController from "../../controllers/adminLead.controller.js";
import {
  activateSharedLeadSchema,
  adminLeadListQuerySchema,
  closeLeadSchema,
  leadIdParamsSchema,
  rejectLeadSchema,
} from "../../validators/lead.validator.js";
import * as subscriptionPlanController from "../../controllers/subscriptionPlan.controller.js";
import {
  adminSubscriptionPlanListQuerySchema,
  createSubscriptionPlanSchema,
  subscriptionPlanIdParamsSchema,
  updateSubscriptionPlanSchema,
} from "../../validators/subscriptionPlan.validator.js";
import * as contactMessageController from "../../controllers/contactMessage.controller.js";
import {
  adminContactMessageListQuerySchema,
  contactMessageIdParamsSchema,
  updateContactMessageSchema,
} from "../../validators/contactMessage.validator.js";
import * as importedBusinessController from "../../controllers/importedBusiness.controller.js";
import { uploadBusinessCsv } from "../../middlewares/csvUpload.middleware.js";
import {
  adminImportedBusinessListQuerySchema,
  businessImportBatchListQuerySchema,
  importedBusinessIdParamsSchema,
  updateImportedBusinessSchema,
} from "../../validators/importedBusiness.validator.js";
import * as vendorSalesMeetingController from "../../controllers/vendorSalesMeeting.controller.js";
import {
  adminSalesMeetingListQuerySchema,
  reviewVendorSalesMeetingSchema,
  vendorSalesMeetingIdParamsSchema,
} from "../../validators/vendorSalesMeeting.validator.js";
import * as ecommerceController from "../../controllers/ecommerce.controller.js";
import * as ecommerceOrderController from "../../controllers/ecommerceOrder.controller.js";
import { cancelOrderSchema, fulfilmentSchema, orderIdParamsSchema, orderListQuerySchema } from "../../validators/ecommerceOrder.validator.js";
import {
  adjustEcommerceInventorySchema,
  ecommerceInventoryListQuerySchema,
  ecommerceInventoryMovementQuerySchema,
  createEcommerceCategorySchema,
  createEcommerceProductImageSchema,
  createEcommerceVariantSchema,
  createEcommerceProductSchema,
  ecommerceCategoryIdParamsSchema,
  ecommerceSubcategoryIdParamsSchema,
  ecommerceProductIdParamsSchema,
  ecommerceImageIdParamsSchema,
  ecommerceProductListQuerySchema,
  ecommerceVariantIdParamsSchema,
  updateEcommerceCategorySchema,
  createEcommerceSubcategorySchema,
  updateEcommerceSubcategorySchema,
  updateEcommerceProductSchema,
  updateEcommerceInventorySettingsSchema,
  updateEcommerceVariantSchema,
} from "../../validators/ecommerce.validator.js";

const router = Router();

router.get("/ping", (req, res) =>
  sendSuccess(res, {
    message: "Admin panel reachable.",
    data: { user: req.user },
  }),
);

// --- Vendor KYC review ---
router.get(
  "/vendor-kyc",
  validateRequest(listKycQuerySchema, "query"),
  kycController.listKycForAdmin,
);
router.get(
  "/vendor-kyc/:userId",
  validateRequest(adminVendorKycParamsSchema, "params"),
  kycController.getKycForAdmin,
);

router.post(
  "/vendor-kyc/:userId/approve",
  validateRequest(adminVendorKycParamsSchema, "params"),
  kycController.approveVendorKyc,
);

router.post(
  "/vendor-kyc/:userId/reject",
  validateRequest(adminVendorKycParamsSchema, "params"),
  validateRequest(rejectKycSchema),
  kycController.rejectVendorKyc,
);

router
  .route("/service-categories")
  .get(
    validateRequest(listCatalogSchema, "query"),
    catalogController.listCategories,
  )
  .post(
    uploadSingleFile,
    validateRequest(createCategoryPayloadSchema),
    catalogController.createCategory,
  );
router
  .route("/service-categories/:id")
  .get(catalogController.getCategory)
  .patch(
    uploadSingleFile,
    validateRequest(updateCategorySchema),
    catalogController.updateCategory,
  )
  .put(
    uploadSingleFile,
    validateRequest(updateCategorySchema),
    catalogController.updateCategory,
  )
  .delete(catalogController.deleteCategory);
router
  .route("/service-subcategories")
  .get(
    validateRequest(listSubcategoriesSchema, "query"),
    catalogController.listSubcategories,
  )
  .post(
    uploadSingleFile,
    validateRequest(createSubcategoryPayloadSchema),
    catalogController.createSubcategory,
  );
router
  .route("/service-subcategories/:id")
  .get(catalogController.getSubcategory)
  .patch(
    uploadSingleFile,
    validateRequest(updateSubcategorySchema),
    catalogController.updateSubcategory,
  )
  .put(
    uploadSingleFile,
    validateRequest(updateSubcategorySchema),
    catalogController.updateSubcategory,
  )
  .delete(catalogController.deleteSubcategory);

router
  .route("/cities")
  .get(validateRequest(listCitiesSchema, "query"), cityController.listCities)
  .post(validateRequest(createCitySchema), cityController.createCity);
router
  .route("/cities/:id")
  .get(cityController.getCity)
  .patch(validateRequest(updateCitySchema), cityController.updateCity)
  .put(validateRequest(updateCitySchema), cityController.updateCity);

// --- Service listing review ---
router.get(
  "/listing-revisions",
  validateRequest(adminListingRevisionListQuerySchema, "query"),
  listingController.listListingRevisionsForAdmin,
);
router.get(
  "/listing-revisions/:revisionId",
  validateRequest(listingRevisionIdParamsSchema, "params"),
  listingController.getListingRevisionForAdmin,
);
router.post(
  "/listing-revisions/:revisionId/approve",
  validateRequest(listingRevisionIdParamsSchema, "params"),
  listingController.approveListingRevision,
);
router.post(
  "/listing-revisions/:revisionId/reject",
  validateRequest(listingRevisionIdParamsSchema, "params"),
  validateRequest(rejectListingSchema),
  listingController.rejectListingRevision,
);
router.get(
  "/listings",
  validateRequest(adminListingListQuerySchema, "query"),
  listingController.listListingsForAdmin,
);
router.get(
  "/listings/:listingId",
  validateRequest(listingIdParamsSchema, "params"),
  listingController.getListingForAdmin,
);
router.post(
  "/listings/:listingId/approve",
  validateRequest(listingIdParamsSchema, "params"),
  listingController.approveListing,
);
router.post(
  "/listings/:listingId/reject",
  validateRequest(listingIdParamsSchema, "params"),
  validateRequest(rejectListingSchema),
  listingController.rejectListing,
);
router.post(
  "/listings/:listingId/pause",
  validateRequest(listingIdParamsSchema, "params"),
  validateRequest(pauseListingSchema),
  listingController.pauseListing,
);
router.post(
  "/listings/:listingId/resume",
  validateRequest(listingIdParamsSchema, "params"),
  listingController.resumeListing,
);

// --- Venue property review ---
router.get(
  "/venue-properties",
  validateRequest(adminVenuePropertyListQuerySchema, "query"),
  venuePropertyController.listAdmin,
);
router.get(
  "/venue-properties/:venuePropertyId",
  validateRequest(venuePropertyIdParamsSchema, "params"),
  venuePropertyController.getAdmin,
);
router.post(
  "/venue-properties/:venuePropertyId/approve",
  validateRequest(venuePropertyIdParamsSchema, "params"),
  venuePropertyController.approve,
);
router.post(
  "/venue-properties/:venuePropertyId/reject",
  validateRequest(venuePropertyIdParamsSchema, "params"),
  validateRequest(rejectVenuePropertySchema),
  venuePropertyController.reject,
);
router.post(
  "/venue-properties/:venuePropertyId/pause",
  validateRequest(venuePropertyIdParamsSchema, "params"),
  validateRequest(pauseVenuePropertySchema),
  venuePropertyController.pause,
);
router.post(
  "/venue-properties/:venuePropertyId/resume",
  validateRequest(venuePropertyIdParamsSchema, "params"),
  venuePropertyController.resume,
);

// --- Lead management ---
router.get(
  "/leads",
  validateRequest(adminLeadListQuerySchema, "query"),
  adminLeadController.listLeads,
);
router.get(
  "/leads/:leadId",
  validateRequest(leadIdParamsSchema, "params"),
  adminLeadController.getLead,
);
router.post(
  "/leads/:leadId/activate",
  validateRequest(leadIdParamsSchema, "params"),
  validateRequest(activateSharedLeadSchema),
  adminLeadController.activateSharedLead,
);
router.post(
  "/leads/:leadId/reject",
  validateRequest(leadIdParamsSchema, "params"),
  validateRequest(rejectLeadSchema),
  adminLeadController.rejectSharedLead,
);
router.post(
  "/leads/:leadId/close",
  validateRequest(leadIdParamsSchema, "params"),
  validateRequest(closeLeadSchema),
  adminLeadController.closeLead,
);

// --- Subscription plan cards ---
router
  .route("/subscription-plans")
  .get(
    validateRequest(adminSubscriptionPlanListQuerySchema, "query"),
    subscriptionPlanController.listPlans,
  )
  .post(
    validateRequest(createSubscriptionPlanSchema),
    subscriptionPlanController.createPlan,
  );
router
  .route("/subscription-plans/:planId")
  .get(
    validateRequest(subscriptionPlanIdParamsSchema, "params"),
    subscriptionPlanController.getPlan,
  )
  .patch(
    validateRequest(subscriptionPlanIdParamsSchema, "params"),
    validateRequest(updateSubscriptionPlanSchema),
    subscriptionPlanController.updatePlan,
  )
  .delete(
    validateRequest(subscriptionPlanIdParamsSchema, "params"),
    subscriptionPlanController.deletePlan,
  );
router.post(
  "/subscription-plans/:planId/activate",
  validateRequest(subscriptionPlanIdParamsSchema, "params"),
  subscriptionPlanController.activatePlan,
);
router.post(
  "/subscription-plans/:planId/deactivate",
  validateRequest(subscriptionPlanIdParamsSchema, "params"),
  subscriptionPlanController.deactivatePlan,
);

// --- Public Contact Us inbox ---
router.get(
  "/contact-messages",
  validateRequest(adminContactMessageListQuerySchema, "query"),
  contactMessageController.listForAdmin,
);
router.get(
  "/contact-messages/:messageId",
  validateRequest(contactMessageIdParamsSchema, "params"),
  contactMessageController.getForAdmin,
);
router.patch(
  "/contact-messages/:messageId",
  validateRequest(contactMessageIdParamsSchema, "params"),
  validateRequest(updateContactMessageSchema),
  contactMessageController.updateForAdmin,
);

// --- Imported public business directory / sales outreach ---
router.post(
  "/imported-businesses/import",
  uploadBusinessCsv,
  importedBusinessController.importCsv,
);
router.get(
  "/business-import-batches",
  validateRequest(businessImportBatchListQuerySchema, "query"),
  importedBusinessController.listImportBatches,
);
router.get(
  "/imported-businesses",
  validateRequest(adminImportedBusinessListQuerySchema, "query"),
  importedBusinessController.listAdmin,
);
router.get(
  "/imported-businesses/:businessId",
  validateRequest(importedBusinessIdParamsSchema, "params"),
  importedBusinessController.getAdmin,
);
router.patch(
  "/imported-businesses/:businessId",
  validateRequest(importedBusinessIdParamsSchema, "params"),
  validateRequest(updateImportedBusinessSchema),
  importedBusinessController.updateAdmin,
);

// --- Vendor sales meeting requests ---
router.get(
  "/sales-meetings",
  validateRequest(adminSalesMeetingListQuerySchema, "query"),
  vendorSalesMeetingController.listForAdmin,
);
router.get(
  "/sales-meetings/:meetingId",
  validateRequest(vendorSalesMeetingIdParamsSchema, "params"),
  vendorSalesMeetingController.getForAdmin,
);
router.patch(
  "/sales-meetings/:meetingId",
  validateRequest(vendorSalesMeetingIdParamsSchema, "params"),
  validateRequest(reviewVendorSalesMeetingSchema),
  vendorSalesMeetingController.reviewForAdmin,
);

// --- Admin-owned e-commerce catalogue ---
router.post('/ecommerce/categories', validateRequest(createEcommerceCategorySchema), ecommerceController.createCategory);
router.get('/ecommerce/categories', ecommerceController.listCategories);
router.get('/ecommerce/categories/:categoryId', validateRequest(ecommerceCategoryIdParamsSchema, 'params'), ecommerceController.getCategory);
router.patch('/ecommerce/categories/:categoryId', validateRequest(ecommerceCategoryIdParamsSchema, 'params'), validateRequest(updateEcommerceCategorySchema), ecommerceController.updateCategory);
router.delete('/ecommerce/categories/:categoryId', validateRequest(ecommerceCategoryIdParamsSchema, 'params'), ecommerceController.deleteCategory);
router.post('/ecommerce/subcategories', validateRequest(createEcommerceSubcategorySchema), ecommerceController.createSubcategory);
router.get('/ecommerce/subcategories', ecommerceController.listSubcategories);
router.get('/ecommerce/subcategories/:subcategoryId', validateRequest(ecommerceSubcategoryIdParamsSchema, 'params'), ecommerceController.getSubcategory);
router.patch('/ecommerce/subcategories/:subcategoryId', validateRequest(ecommerceSubcategoryIdParamsSchema, 'params'), validateRequest(updateEcommerceSubcategorySchema), ecommerceController.updateSubcategory);
router.post('/ecommerce/products', validateRequest(createEcommerceProductSchema), ecommerceController.createProduct);
router.get('/ecommerce/products', validateRequest(ecommerceProductListQuerySchema, 'query'), ecommerceController.listProducts);
router.get('/ecommerce/products/:productId', validateRequest(ecommerceProductIdParamsSchema, 'params'), ecommerceController.getProduct);
router.patch('/ecommerce/products/:productId', validateRequest(ecommerceProductIdParamsSchema, 'params'), validateRequest(updateEcommerceProductSchema), ecommerceController.updateProduct);
router.post('/ecommerce/products/:productId/publish', validateRequest(ecommerceProductIdParamsSchema, 'params'), ecommerceController.publishProduct);
router.post('/ecommerce/products/:productId/archive', validateRequest(ecommerceProductIdParamsSchema, 'params'), ecommerceController.archiveProduct);
router.post('/ecommerce/products/:productId/images', validateRequest(ecommerceProductIdParamsSchema, 'params'), validateRequest(createEcommerceProductImageSchema), ecommerceController.addProductImage);
router.delete('/ecommerce/products/:productId/images/:imageId', validateRequest(ecommerceImageIdParamsSchema, 'params'), ecommerceController.removeProductImage);
router.post('/ecommerce/products/:productId/variants', validateRequest(ecommerceProductIdParamsSchema, 'params'), validateRequest(createEcommerceVariantSchema), ecommerceController.addVariant);
router.patch('/ecommerce/variants/:variantId', validateRequest(ecommerceVariantIdParamsSchema, 'params'), validateRequest(updateEcommerceVariantSchema), ecommerceController.updateVariant);
router.post('/ecommerce/variants/:variantId/inventory-adjustments', validateRequest(ecommerceVariantIdParamsSchema, 'params'), validateRequest(adjustEcommerceInventorySchema), ecommerceController.adjustInventory);
router.patch('/ecommerce/variants/:variantId/inventory-settings', validateRequest(ecommerceVariantIdParamsSchema, 'params'), validateRequest(updateEcommerceInventorySettingsSchema), ecommerceController.updateInventorySettings);
router.get('/ecommerce/inventory', validateRequest(ecommerceInventoryListQuerySchema, 'query'), ecommerceController.listInventory);
router.get('/ecommerce/inventory-movements', validateRequest(ecommerceInventoryMovementQuerySchema, 'query'), ecommerceController.listInventoryMovements);

// --- E-commerce orders and fulfilment ---
router.get('/ecommerce/orders', validateRequest(orderListQuerySchema, 'query'), ecommerceOrderController.listAdmin);
router.post('/ecommerce/orders/release-expired-reservations', ecommerceOrderController.expireReservations);
router.get('/ecommerce/orders/:orderId', validateRequest(orderIdParamsSchema, 'params'), ecommerceOrderController.getAdmin);
router.post('/ecommerce/orders/:orderId/cancel', validateRequest(orderIdParamsSchema, 'params'), validateRequest(cancelOrderSchema), ecommerceOrderController.cancelAdmin);
router.patch('/ecommerce/orders/:orderId/fulfilment', validateRequest(orderIdParamsSchema, 'params'), validateRequest(fulfilmentSchema), ecommerceOrderController.fulfil);
router.post('/ecommerce/orders/:orderId/mark-paid-for-test', validateRequest(orderIdParamsSchema, 'params'), ecommerceOrderController.markPaidForTest);

export default router;
