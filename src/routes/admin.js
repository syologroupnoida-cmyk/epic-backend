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
  adminLogin,
  createAdmin,
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

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Login as Admin
 *     tags: [Admin Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: admin@epic.com
 *               password:
 *                 type: string
 *                 example: Test@123
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post("/login", adminLogin);

/**
 * @swagger
 * /admin/create:
 *   post:
 *     summary: Create a new Admin account (Superadmin Only)
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: Admin User
 *               email:
 *                 type: string
 *                 example: finance@epic.com
 *               password:
 *                 type: string
 *                 example: Test@123
 *               phone:
 *                 type: string
 *                 example: 9876543211
 *               type:
 *                 type: string
 *                 enum: [superadmin, finance, support, editor]
 *                 example: finance
 *     responses:
 *       201:
 *         description: Admin created successfully
 */
router.post("/create", getAdminHeaders, createAdmin);

// System Settings
/**
 * @swagger
 * /admin/settings/{key}:
 *   get:
 *     summary: Get system setting by key
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key (e.g. lead_costs)
 *     responses:
 *       200:
 *         description: Setting value
 *       403:
 *         description: Access denied
 *   put:
 *     summary: Update system setting by key
 *     tags: [Admin System]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
 *         required: true
 *         schema:
 *           type: string
 *         description: Setting key to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - value
 *             properties:
 *               value:
 *                 description: New value for the setting (any type)
 *     responses:
 *       200:
 *         description: Setting updated
 *       403:
 *         description: Access denied
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - credits
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Bundle name
 *               credits:
 *                 type: number
 *                 description: Number of lead credits in the bundle
 *               price:
 *                 type: number
 *                 description: Price of the bundle
 *     responses:
 *       201:
 *         description: Lead bundle created
 *       403:
 *         description: Access denied
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, all]
 *         description: Filter by approval status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by package title
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *     responses:
 *       200:
 *         description: List of venue packages
 *       403:
 *         description: Access denied
 */
router.get("/venue-packages", getAdminHeaders,getAdminVenuePackages);

/**
 * @swagger
 * /admin/venue-packages/{id}/status:
 *   put:
 *     summary: Update venue package approval status
 *     tags: [Admin Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: Approve or reject the package
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 description: Set package visibility
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Package not found
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, all]
 *         description: Filter by approval status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by package title
 *       - in: query
 *         name: vendor
 *         schema:
 *           type: string
 *         description: Filter by vendor ID
 *     responses:
 *       200:
 *         description: List of service packages
 *       403:
 *         description: Access denied
 */
router.get("/service-packages", getAdminHeaders,getAdminServicePackages);

/**
 * @swagger
 * /admin/service-packages/{id}/status:
 *   put:
 *     summary: Update service package approval status
 *     tags: [Admin Packages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *                 description: Approve or reject the package
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *                 description: Set package visibility
 *     responses:
 *       200:
 *         description: Status updated
 *       404:
 *         description: Package not found
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of services
 *   post:
 *     summary: Create a service
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 description: Service name (must be unique)
 *               icon:
 *                 type: string
 *                 description: Icon identifier or URL
 *               type:
 *                 type: string
 *                 description: Service type
 *     responses:
 *       201:
 *         description: Service created
 *       400:
 *         description: Service name is required or already exists
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
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service details
 *       404:
 *         description: Service not found
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
 *         description: Service ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               icon:
 *                 type: string
 *               type:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service updated
 *       404:
 *         description: Service not found
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
 *         description: Service ID
 *     responses:
 *       200:
 *         description: Service deleted
 *       404:
 *         description: Service not found
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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name (must be unique)
 *               description:
 *                 type: string
 *               services:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of service IDs
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image (required)
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Name or image required / name already exists
 *   get:
 *     summary: Get all venue categories
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of venue categories
 */
router.post("/venue-categories", getAdminHeaders,upload.single("image"), createCategory);
router.get("/venue-categories", getAdminHeaders,getCategories);

/**
 * @swagger
 * /admin/venue-categories/{id}:
 *   get:
 *     summary: Get venue category by ID
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Venue category ID
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
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
 *         description: Venue category ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               services:
 *                 type: array
 *                 items:
 *                   type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Category not found
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
 *         description: Venue category ID
 *     responses:
 *       200:
 *         description: Category deleted
 *       404:
 *         description: Category not found
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
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive, pending, rejected, blocked, all]
 *         description: Filter by vendor status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *     responses:
 *       200:
 *         description: List of vendors
 *       400:
 *         description: Invalid vendor status
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               required:
 *                 - vendorName
 *                 - email
 *                 - phone
 *                 - password
 *                 - experience
 *                 - workingSince
 *                 - contactPerson
 *                 - state
 *                 - city
 *                 - locality
 *                 - address
 *               properties:
 *                 vendorName:
 *                   type: string
 *                 email:
 *                   type: string
 *                 phone:
 *                   type: string
 *                 password:
 *                   type: string
 *                 experience:
 *                   type: number
 *                 workingSince:
 *                   type: number
 *                 contactPerson:
 *                   type: string
 *                 state:
 *                   type: string
 *                 city:
 *                   type: string
 *                 locality:
 *                   type: string
 *                 address:
 *                   type: string
 *     responses:
 *       201:
 *         description: Bulk vendor processing complete
 *       400:
 *         description: No vendor data provided or invalid format
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
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor details
 *       404:
 *         description: Vendor not found
 *   put:
 *     summary: Update vendor details (Admin)
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               vendorName:
 *                 type: string
 *               contactPerson:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               experience:
 *                 type: number
 *               workingSince:
 *                 type: number
 *               locality:
 *                 type: string
 *               address:
 *                 type: string
 *               profile:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *               documents[gst]:
 *                 type: string
 *                 format: binary
 *               documents[pan]:
 *                 type: string
 *                 format: binary
 *               documents[idProof]:
 *                 type: string
 *                 format: binary
 *               documents[registrationProof]:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Vendor updated
 *       404:
 *         description: Vendor not found
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
 *         description: Vendor ID
 *     responses:
 *       200:
 *         description: Vendor deleted
 *       404:
 *         description: Vendor not found
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
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, inactive, pending, rejected, blocked]
 *     responses:
 *       200:
 *         description: Status updated
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Vendor not found
 */
router.put("/vendors/:id/status", getAdminHeaders,updateVendorStatus);

/**
 * @swagger
 * /admin/leads:
 *   put:
 *     summary: Toggle lead status (active / stopped)
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - leadId
 *               - status
 *             properties:
 *               leadId:
 *                 type: string
 *                 description: Lead ID
 *               status:
 *                 type: string
 *                 enum: [active, stopped]
 *     responses:
 *       200:
 *         description: Lead status updated
 *       400:
 *         description: Invalid status value
 *       404:
 *         description: Lead not found
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
 *     summary: Update admin notes for a vendor
 *     tags: [Admin Vendors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Vendor ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - adminNotes
 *             properties:
 *               adminNotes:
 *                 type: string
 *                 description: Internal notes visible only to admin
 *     responses:
 *       200:
 *         description: Notes updated
 *       404:
 *         description: Vendor not found
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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Category name (must be unique)
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Category image (required)
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Name or image required / already exists
 *   get:
 *     summary: Get all service categories
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of service categories
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
 *     summary: Get service category by ID
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service category ID
 *     responses:
 *       200:
 *         description: Category details
 *       404:
 *         description: Category not found
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
 *         description: Service category ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Category updated
 *       404:
 *         description: Category not found
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
 *         description: Service category ID
 *     responses:
 *       200:
 *         description: Category deleted
 *       404:
 *         description: Category not found
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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - image
 *             properties:
 *               name:
 *                 type: string
 *                 description: Sub-category name (must be unique)
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Parent service category ID
 *               image:
 *                 type: string
 *                 format: binary
 *                 description: Sub-category image (required)
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Name or image required / already exists
 *   get:
 *     summary: Get all service sub-categories
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: List of sub-categories
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
 *     summary: Get service sub-category by ID
 *     tags: [Admin Services]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Sub-category ID
 *     responses:
 *       200:
 *         description: Sub-category details
 *       404:
 *         description: Sub-category not found
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
 *         description: Sub-category ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *                 description: Parent service category ID
 *               image:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Sub-category updated
 *       404:
 *         description: Sub-category not found
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
 *         description: Sub-category ID
 *     responses:
 *       200:
 *         description: Sub-category deleted
 *       404:
 *         description: Sub-category not found
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
 *     summary: Update user active status
 *     tags: [Admin Auth]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: The unique MongoDB ID of the user to update
 *         schema:
 *           type: string
 *         description: User ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isActive:
 *                 type: boolean
 *                 description: Set user active or inactive
 *     responses:
 *       200:
 *         description: User status updated
 *       400:
 *         description: isActive must be true or false
 *       404:
 *         description: User not found
 */
router.put("/user-status/:id", getAdminHeaders, upload.single("profilePic"), updateUserProfile);

//subscription routes
/**
 * @swagger
 * /admin/subscriptions/create:
 *   post:
 *     summary: Create a subscription plan
 *     tags: [Admin Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - leadCredits
 *               - durationDays
 *               - price
 *             properties:
 *               name:
 *                 type: string
 *                 description: Plan name (must be unique)
 *               leadCredits:
 *                 type: number
 *                 description: Number of lead credits (must be > 0)
 *               durationDays:
 *                 type: number
 *                 description: Plan duration in days (must be > 0)
 *               price:
 *                 type: number
 *                 description: Plan price (must be >= 0)
 *     responses:
 *       201:
 *         description: Subscription plan created
 *       400:
 *         description: Validation error or plan already exists
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
 *     summary: Update subscription plan
 *     tags: [Admin Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               leadCredits:
 *                 type: number
 *               durationDays:
 *                 type: number
 *               price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Subscription updated
 *       404:
 *         description: Subscription not found
 */
router.put("/subscriptions/:id", getAdminHeaders, updateSubscription);

/**
 * @swagger
 * /admin/subscriptions/{id}/toggle-status:
 *   put:
 *     summary: Toggle subscription active status
 *     tags: [Admin Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Status toggled
 *       404:
 *         description: Subscription not found
 */
router.put("/subscriptions/:id/toggle-status", getAdminHeaders, toggleSubscriptionStatus);

/**
 * @swagger
 * /admin/subscriptions/{id}/delete:
 *   delete:
 *     summary: Delete a subscription plan
 *     tags: [Admin Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription deleted
 *       404:
 *         description: Subscription not found
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Results per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Filter by email
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
