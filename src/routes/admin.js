import { Router } from "express";
import {
  bulkCreateVendors,
  checkAdmin,
  getSystemSettings,
  updateSystemSettings,
  getAdminVenuePackages,
  getAdminServicePackages,
  updateVenuePackageStatus,
  updateServicePackageStatus,
  toggleLeadStatus,
  getAllContacts,
  toggleFeaturedStory,
} from "../controllers/admin.js";
import {
  createService,
  deleteService,
  getAllServices,
  getServiceById,
  updateService,
} from "../controllers/service.js";
import {
  createServiceCategory,
  deleteServiceCategory,
  getAllServiceCategories,
  getServiceCategory,
  updateServiceCategory,
} from "../controllers/serviceCategory.js";
import {
  createServiceSubCategory,
  deleteServiceSubCategory,
  getAllServiceSubCategories,
  getServiceSubCategory,
  updateServiceSubCategory,
} from "../controllers/serviceSubCategory.js";
import {
  deleteVendor,
  getAllVendors,
  getVendorById,
  toggleAutoApprovePackages,
  toggleFeaturedVendor,
  toggleVerifyBadge,
  updateAdminNotesForVendor,
  updateVendorStatus,
  updateVendorDetailsByAdmin,
} from "../controllers/vendor.js";
import {
  createCategory,
  deleteCategory,
  getCategories,
  getCategory,
  updateCategory,
} from "../controllers/venueCategory.js";
import { getAdminHeaders } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";
import { updateUserProfile } from "../controllers/user.js";
import { createLeadBundle } from "../controllers/lead.js";
import { migrateVendorCredits } from "../controllers/migration.js";
import { refreshAccessToken } from "../controllers/authController.js";
import {
  createSubscription,
  getSubscriptions,
  updateSubscription,
  toggleSubscriptionStatus,
  deleteSubscription
} from "../controllers/subscription.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Admin Auth
 *     description: Admin authentication and status
 *   - name: Admin System
 *     description: Admin system settings
 *   - name: Admin Packages
 *     description: Admin package approvals and listings
 *   - name: Admin Services
 *     description: Core service and category management
 *   - name: Admin Vendors
 *     description: Vendor and lead management
 *   - name: Admin Subscriptions
 *     description: Subscription management
 */

/**
 * @swagger
 * /admin/check:
 *   get:
 *     summary: Check if user is admin
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User is admin
 */
router.get("/check", getAdminHeaders, checkAdmin);

/**
 * @swagger
 * /admin/refresh:
 *   post:
 *     summary: Refresh admin access token
 *     tags: [Admin Auth]
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post("/refresh", refreshAccessToken);

// System Settings
/**
 * @swagger
 * /admin/settings/{key}:
 *   get:
 *     summary: Get system setting
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting value
 *   put:
 *     summary: Update system setting
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Setting updated
 */
router.get("/settings/:key",getAdminHeaders, getSystemSettings);
router.put("/settings/:key", getAdminHeaders,updateSystemSettings);

/**
 * @swagger
 * /admin/migrate-credits:
 *   post:
 *     summary: Migrate vendor credits
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Migration successful
 */
router.post("/migrate-credits",getAdminHeaders, migrateVendorCredits);

/**
 * @swagger
 * /admin/lead-bundles:
 *   post:
 *     summary: Create a lead bundle
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Lead bundle created
 */
router.post("/lead-bundles",getAdminHeaders, createLeadBundle);

// --- ADMIN PACKAGE MANAGEMENT ---

/**
 * @swagger
 * /admin/venue-packages:
 *   get:
 *     summary: Get all venue packages (Admin view)
 *     tags: [Admin Packages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of venue packages
 */
router.get("/venue-packages", getAdminHeaders,getAdminVenuePackages);

/**
 * @swagger
 * /admin/venue-packages/{id}/status:
 *   put:
 *     summary: Update venue package status
 *     tags: [Admin Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put("/venue-packages/:id/status", getAdminHeaders,updateVenuePackageStatus);

/**
 * @swagger
 * /admin/service-packages:
 *   get:
 *     summary: Get all service packages (Admin view)
 *     tags: [Admin Packages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of service packages
 */
router.get("/service-packages", getAdminHeaders,getAdminServicePackages);

/**
 * @swagger
 * /admin/service-packages/{id}/status:
 *   put:
 *     summary: Update service package status
 *     tags: [Admin Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put("/service-packages/:id/status",getAdminHeaders, updateServicePackageStatus);

//#region service routes
/**
 * @swagger
 * /admin/services:
 *   get:
 *     summary: Get all services
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of services
 *   post:
 *     summary: Create a service
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Service created
 */
router.get("/services",getAdminHeaders, getAllServices);
router.post("/services", getAdminHeaders,createService);

/**
 * @swagger
 * /admin/services/{id}:
 *   get:
 *     summary: Get a service by ID
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service details
 *   put:
 *     summary: Update a service
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service updated
 *   delete:
 *     summary: Delete a service
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service deleted
 */
router.get("/services/:id",getAdminHeaders, getServiceById);
router.put("/services/:id", getAdminHeaders, updateService);
router.delete("/services/:id", getAdminHeaders, deleteService);
//#endregion service routes

//#region venue category routes
/**
 * @swagger
 * /admin/venue-categories:
 *   post:
 *     summary: Create venue category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     summary: Get venue categories
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List
 */
router.post("/venue-categories", getAdminHeaders,upload.single("image"), createCategory);
router.get("/venue-categories", getAdminHeaders,getCategories);

/**
 * @swagger
 * /admin/venue-categories/{id}:
 *   get:
 *     summary: Get venue category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail
 *   put:
 *     summary: Update venue category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete venue category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get("/venue-categories/:id", getAdminHeaders,getCategory);
router.put("/venue-categories/:id",getAdminHeaders, upload.single("image"), updateCategory);
router.delete("/venue-categories/:id", getAdminHeaders,deleteCategory);
//#endregion venue category routes

//#region vendor management routes
/**
 * @swagger
 * /admin/vendors:
 *   get:
 *     summary: Get all vendors
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of vendors
 */
router.get("/vendors", getAdminHeaders,getAllVendors);

/**
 * @swagger
 * /admin/vendors/bulk-create:
 *   post:
 *     summary: Bulk create vendors
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Vendors created
 */
router.post("/vendors/bulk-create", getAdminHeaders,bulkCreateVendors);

/**
 * @swagger
 * /admin/vendors/{id}:
 *   get:
 *     summary: Get vendor by ID
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor details
 *   put:
 *     summary: Update vendor details
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Vendor updated
 *   delete:
 *     summary: Delete vendor
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor deleted
 */
router.get("/vendors/:id", getAdminHeaders,getVendorById);
router.delete("/vendors/:id", getAdminHeaders, deleteVendor);
router.put(
  "/vendors/:id",getAdminHeaders,
  upload.fields([
    { name: 'profile', maxCount: 1 },
    { name: 'coverImage', maxCount: 1 },
    { name: 'documents[gst]', maxCount: 1 },
    { name: 'documents[pan]', maxCount: 1 },
    { name: 'documents[idProof]', maxCount: 1 },
    { name: 'documents[registrationProof]', maxCount: 1 },
  ]),
  updateVendorDetailsByAdmin
);

/**
 * @swagger
 * /admin/vendors/{id}/status:
 *   put:
 *     summary: Update vendor status
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status updated
 */
router.put("/vendors/:id/status", getAdminHeaders,updateVendorStatus);

/**
 * @swagger
 * /admin/leads:
 *   put:
 *     summary: Toggle lead status
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Toggled
 */
router.put("/leads", getAdminHeaders,toggleLeadStatus);

/**
 * @swagger
 * /admin/vendors/{id}/toggle-featured:
 *   put:
 *     summary: Toggle featured vendor status
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Toggled
 */
router.put("/vendors/:id/toggle-featured", getAdminHeaders,toggleFeaturedVendor);

/**
 * @swagger
 * /admin/vendors/{id}/toggle-verify:
 *   put:
 *     summary: Toggle verify badge
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Toggled
 */
router.put("/vendors/:id/toggle-verify",getAdminHeaders, toggleVerifyBadge);

/**
 * @swagger
 * /admin/vendors/{id}/admin-notes:
 *   put:
 *     summary: Update admin notes for vendor
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Notes updated
 */
router.put("/vendors/:id/admin-notes", getAdminHeaders, updateAdminNotesForVendor);

/**
 * @swagger
 * /admin/vendors/{id}/toggle-auto-approve:
 *   put:
 *     summary: Toggle auto-approve packages
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Toggled
 */
router.put("/vendors/:id/toggle-auto-approve", getAdminHeaders,toggleAutoApprovePackages);
//#endregion VENDOR MANAGEMENT ROUTES

//#region service category routes
/**
 * @swagger
 * /admin/service-categories:
 *   post:
 *     summary: Create service category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     summary: Get all service categories
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List
 */
router.post(
  "/service-categories",getAdminHeaders,
  upload.single("image"),
  createServiceCategory
);
router.get("/service-categories",getAdminHeaders, getAllServiceCategories);

/**
 * @swagger
 * /admin/service-categories/{id}:
 *   get:
 *     summary: Get service category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail
 *   put:
 *     summary: Update service category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete service category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get("/service-categories/:id", getAdminHeaders,getServiceCategory);
router.put(
  "/service-categories/:id",
  getAdminHeaders,
  upload.single("image"),
  updateServiceCategory
);
router.delete("/service-categories/:id",getAdminHeaders, deleteServiceCategory);
//#endregion service category routes

//#region service sub-category routes
/**
 * @swagger
 * /admin/service-sub-categories:
 *   post:
 *     summary: Create service sub-category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 *   get:
 *     summary: Get all service sub-categories
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List
 */
router.post(
  "/service-sub-categories",getAdminHeaders,
  upload.single("image"),
  createServiceSubCategory
);
router.get("/service-sub-categories",getAdminHeaders, getAllServiceSubCategories);

/**
 * @swagger
 * /admin/service-sub-categories/{id}:
 *   get:
 *     summary: Get service sub-category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detail
 *   put:
 *     summary: Update service sub-category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Updated
 *   delete:
 *     summary: Delete service sub-category
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.get("/service-sub-categories/:id", getAdminHeaders,getServiceSubCategory);
router.put(
  "/service-sub-categories/:id",getAdminHeaders,
  upload.single("image"),
  updateServiceSubCategory
);
router.delete("/service-sub-categories/:id",getAdminHeaders, deleteServiceSubCategory);
//#endregion service sub-category routes

/**
 * @swagger
 * /admin/user-status/{id}:
 *   put:
 *     summary: Update user status
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put("/user-status/:id", getAdminHeaders,updateUserProfile);

//subscription routes
/**
 * @swagger
 * /admin/subscriptions/create:
 *   post:
 *     summary: Create a subscription
 *     tags: [Admin Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */
router.post("/subscriptions/create", getAdminHeaders, createSubscription);

/**
 * @swagger
 * /admin/subscriptions/getall:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Admin Subscriptions]
 *     responses:
 *       200:
 *         description: List
 */
router.get("/subscriptions/getall", getSubscriptions);

/**
 * @swagger
 * /admin/subscriptions/{id}:
 *   put:
 *     summary: Update subscription
 *     tags: [Admin Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Updated
 */
router.put("/subscriptions/:id", getAdminHeaders, updateSubscription);

/**
 * @swagger
 * /admin/subscriptions/{id}/toggle-status:
 *   put:
 *     summary: Toggle subscription status
 *     tags: [Admin Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Toggled
 */
router.put("/subscriptions/:id/toggle-status", getAdminHeaders, toggleSubscriptionStatus);

/**
 * @swagger
 * /admin/subscriptions/{id}/delete:
 *   delete:
 *     summary: Delete subscription
 *     tags: [Admin Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 */
router.delete("/subscriptions/:id/delete", getAdminHeaders, deleteSubscription);

/**
 * @swagger
 * /admin/contacts:
 *   get:
 *     summary: Get all contact form submissions
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of contacts
 */
router.get("/contacts", getAdminHeaders, getAllContacts);

/**
 * @swagger
 * /admin/real-stories/{id}/feature:
 *   put:
 *     summary: Toggle featured real story
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Toggled
 */
router.put("/real-stories/:id/feature",getAdminHeaders, toggleFeaturedStory);

export default router;
