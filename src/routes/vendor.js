import express from "express";
import {
  createVendor,
  updateVendor,
  vendorLogin,
  getVendorProfile,
  googleAuth,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  getVendorWalletBalance,
  getVendorWalletTransactions,
  sendPhoneUpdateOtp,
  verifyPhoneUpdateOtp,
} from "../controllers/vendor.js";
import { createArrayUpload, upload } from "../middlewares/multer.js";
import { getVendorHeaders } from "../middlewares/authMiddleware.js";
import {
  addFaq,
  addNewAlbums,
  addPhotosToAlbum,
  addReviewToPackage,
  addVideo,
  createVenuePackage,
  deleteAlbum,
  deleteAlbumPhoto,
  deleteFaq,
  deleteReviewForPackage,
  deleteVenuePackage,
  deleteVideo,
  getReviewsForPackage,
  getVenuePackage,
  getVenuePackages,
  updateAlbumTitles,
  updateApprovalAndVisibility,
  updateBasicDetails,
  updateFaq,
  updateReviewForPackage,
  updateVideo,
} from "../controllers/venuePackage.js";
import {
  addNewServiceAlbums,
  addPhotosToServiceAlbum,
  addServiceFaq,
  addServiceReviewToPackage,
  addServiceVideo,
  createServicePackage,
  deleteServiceAlbum,
  deleteServiceAlbumPhoto,
  deleteServiceFaq,
  deleteServicePackage,
  deleteServiceReviewForPackage,
  deleteServiceVideo,
  getServicePackage,
  getServicePackages,
  getServiceReviewsForPackage,
  updateServiceAlbumTitles,
  updateServiceApprovalAndVisibility,
  updateServiceBasicDetails,
  updateServiceFaq,
  updateServiceReviewForPackage,
  updateServiceVideo,
} from "../controllers/servicePackage.js";
import { getCategoriesForVenuePackage } from "../controllers/venueCategory.js";
import { getCategoriesForServicePackage } from "../controllers/serviceCategory.js";
import { getServiceSubCategoriesForPackage } from "../controllers/serviceSubCategory.js";
import { refreshAccessToken } from "../controllers/authController.js";
import { buySubscription, getSubscriptions } from "../controllers/subscription.js";
import { importVendors } from "../controllers/import.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Vendor Auth
 *     description: Vendor authentication endpoints
 *   - name: Vendor Profile
 *     description: Vendor profile management
 *   - name: Vendor Wallet
 *     description: Vendor wallet and transactions
 *   - name: Vendor Packages (Venue)
 *     description: Venue package management for vendor
 *   - name: Vendor Packages (Service)
 *     description: Service package management for vendor
 *   - name: Vendor Subscriptions
 *     description: Subscription purchasing
 */

/**
 * @swagger
 * /vendor/refresh:
 *   post:
 *     summary: Refresh vendor access token
 *     tags: [Vendor Auth]
 *     responses:
 *       200:
 *         description: Token refreshed
 */
router.post("/refresh", refreshAccessToken);

/* ============================================================================
    GOOGLE OAUTH ROUTES
============================================================================= */

/**
 * @swagger
 * /vendor/auth/google:
 *   post:
 *     summary: Google OAuth for Vendor
 *     tags: [Vendor Auth]
 *     responses:
 *       200:
 *         description: Logged in via Google
 */
router.post("/auth/google", googleAuth);

/* ============================================================================
    NORMAL LOGIN ROUTE
============================================================================= */

/**
 * @swagger
 * /vendor/login:
 *   post:
 *     summary: Vendor Login
 *     tags: [Vendor Auth]
 *     responses:
 *       200:
 *         description: Logged in
 */
router.post("/login", vendorLogin);

/* ============================================================================
    CREATE VENDOR ROUTE
============================================================================= */

/**
 * @swagger
 * /vendor/create:
 *   post:
 *     summary: Register a new vendor
 *     tags: [Vendor Auth]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: string
 *                 format: binary
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Vendor created
 */
router.post(
  "/create",
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
    { name: "documents[gst]", maxCount: 1 },
    { name: "documents[pan]", maxCount: 1 },
    { name: "documents[idProof]", maxCount: 1 },
    { name: "documents[registrationProof]", maxCount: 1 },
  ]),
  createVendor
);

/* ============================================================================
    FORGOT PASSWORD ROUTES
============================================================================= */

/**
 * @swagger
 * /vendor/send-forget-otp:
 *   post:
 *     summary: Send forgot password OTP
 *     tags: [Vendor Auth]
 *     responses:
 *       200:
 *         description: OTP sent
 */
router.post("/send-forget-otp", sendForgotPasswordOtp);

/**
 * @swagger
 * /vendor/verify-forget-otp:
 *   post:
 *     summary: Verify forgot password OTP
 *     tags: [Vendor Auth]
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post("/verify-forget-otp", verifyForgotPasswordOtp);

/**
 * @swagger
 * /vendor/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Vendor Auth]
 *     responses:
 *       200:
 *         description: Password reset
 */
router.post("/reset-password", resetPassword);

/* ============================================================================
    PROTECTED ROUTES BELOW
============================================================================= */

/**
 * @swagger
 * /vendor/profile:
 *   get:
 *     summary: Get vendor profile
 *     tags: [Vendor Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile details
 *   put:
 *     summary: Update vendor profile
 *     tags: [Vendor Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated
 */
router
  .route("/profile")
  .get(getVendorHeaders, getVendorProfile)
  .put(
    getVendorHeaders,
    upload.fields([
      { name: "profile", maxCount: 1 },
      { name: "coverImage", maxCount: 1 },
      { name: "documents[gst]", maxCount: 1 },
      { name: "documents[pan]", maxCount: 1 },
      { name: "documents[idProof]", maxCount: 1 },
      { name: "documents[registrationProof]", maxCount: 1 },
    ]),
    updateVendor
  );

/**
 * @swagger
 * /vendor/balance:
 *   get:
 *     summary: Get vendor wallet balance
 *     tags: [Vendor Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 */
router.get("/balance", getVendorHeaders, getVendorWalletBalance);

/**
 * @swagger
 * /vendor/transactions:
 *   get:
 *     summary: Get vendor wallet transactions
 *     tags: [Vendor Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Transactions list
 */
router.get("/transactions", getVendorHeaders, getVendorWalletTransactions);

// Phone Update OTP Flow
/**
 * @swagger
 * /vendor/send-phone-update-otp:
 *   post:
 *     summary: Send OTP for phone update
 *     tags: [Vendor Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: OTP Sent
 */
router.post("/send-phone-update-otp", getVendorHeaders, sendPhoneUpdateOtp);

/**
 * @swagger
 * /vendor/verify-phone-update-otp:
 *   post:
 *     summary: Verify OTP for phone update
 *     tags: [Vendor Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Phone updated
 */
router.post("/verify-phone-update-otp", getVendorHeaders, verifyPhoneUpdateOtp);

/*============================================================================
    VENUE PACKAGE ROUTES
=============================================================================*/
//#region VENUE PACKAGE MANAGEMENT ROUTES

/**
 * @swagger
 * /vendor/venue-categories:
 *   get:
 *     summary: Get categories for venue package
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of categories
 */
router.get("/venue-categories", getVendorHeaders, getCategoriesForVenuePackage);

/**
 * @swagger
 * /vendor/venue-packages:
 *   get:
 *     summary: Get vendor's venue packages
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List
 *   post:
 *     summary: Create venue package
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               featuredImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 */
router.get("/venue-packages", getVendorHeaders, getVenuePackages);
router.post(
  "/venue-packages",
  getVendorHeaders,
  upload.single("featuredImage"),
  createVenuePackage
);

/**
 * @swagger
 * /vendor/venue-packages/{id}:
 *   get:
 *     summary: Get specific venue package
 *     tags: [Vendor Packages (Venue)]
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
 *         description: Package detail
 *   delete:
 *     summary: Delete venue package
 *     tags: [Vendor Packages (Venue)]
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
router.get("/venue-packages/:id", getVendorHeaders, getVenuePackage);
router.delete("/venue-packages/:id", getVendorHeaders, deleteVenuePackage);

/**
 * @swagger
 * /vendor/venue-packages/{id}/basic:
 *   put:
 *     summary: Update basic details
 *     tags: [Vendor Packages (Venue)]
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
router.put(
  "/venue-packages/:id/basic",
  getVendorHeaders,
  upload.single("featuredImage"),
  updateBasicDetails
);

// FAQs for venue package
/**
 * @swagger
 * /vendor/venue-packages/{id}/faqs:
 *   post:
 *     summary: Add FAQ
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: FAQ added
 *   put:
 *     summary: Update FAQ
 *     tags: [Vendor Packages (Venue)]
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
 *         description: FAQ updated
 */
router.post("/venue-packages/:id/faqs", getVendorHeaders, addFaq);
router.put("/venue-packages/:id/faqs", getVendorHeaders, updateFaq);

/**
 * @swagger
 * /vendor/venue-packages/{id}/faqs/{index}:
 *   delete:
 *     summary: Delete FAQ
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: FAQ deleted
 */
router.delete("/venue-packages/:id/faqs/:index", getVendorHeaders, deleteFaq);

// Videos for venue package
/**
 * @swagger
 * /vendor/venue-packages/{id}/videos:
 *   post:
 *     summary: Add Video
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Video added
 *   put:
 *     summary: Update Video
 *     tags: [Vendor Packages (Venue)]
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
 *         description: Video updated
 */
router.post("/venue-packages/:id/videos", getVendorHeaders, addVideo);
router.put("/venue-packages/:id/videos", getVendorHeaders, updateVideo);

/**
 * @swagger
 * /vendor/venue-packages/{id}/videos/{index}:
 *   delete:
 *     summary: Delete Video
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: index
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Video deleted
 */
router.delete(
  "/venue-packages/:id/videos/:index",
  getVendorHeaders,
  deleteVideo
);

// Albums logic... omitted extensive swagger for brevity but keeping routes
router.patch("/venue-packages/:id/albums", getVendorHeaders, upload.any(), addNewAlbums);
router.patch("/venue-packages/:id/albums/:albumIndex/titles", getVendorHeaders, updateAlbumTitles);
router.patch("/venue-packages/:id/albums/:albumIndex/photos", getVendorHeaders, createArrayUpload("photos", 5, 20), addPhotosToAlbum);
router.delete("/venue-packages/:id/albums/:albumIndex", getVendorHeaders, deleteAlbum);
router.delete("/venue-packages/:id/albums/:albumIndex/photos/:photoIndex", getVendorHeaders, deleteAlbumPhoto);

/*============================================================================
    VENUE PACKAGE REVIEWS ROUTES
=============================================================================*/
/**
 * @swagger
 * /vendor/venue-packages/{id}/reviews:
 *   get:
 *     summary: Get reviews
 *     tags: [Vendor Packages (Venue)]
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
 *         description: Reviews list
 */
router.get("/venue-packages/:id/reviews", getVendorHeaders, getReviewsForPackage);
router.post("/venue-packages/:id/reviews", getVendorHeaders, addReviewToPackage);
router.put("/venue-packages/:id/reviews/:reviewId", getVendorHeaders, updateReviewForPackage);
router.delete("/venue-packages/:id/reviews/:reviewId", getVendorHeaders, deleteReviewForPackage);

/**
 * @swagger
 * /vendor/venue-packages/{id}/status:
 *   put:
 *     summary: Update package status/visibility
 *     tags: [Vendor Packages (Venue)]
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
router.put("/venue-packages/:id/status", getVendorHeaders, updateApprovalAndVisibility);

//#endregion VENUE PACKAGE MANAGEMENT ROUTES

/*============================================================================
    SERVICE PACKAGE ROUTES
=============================================================================*/
//#region SERVICE PACKAGE MANAGEMENT ROUTES

/**
 * @swagger
 * /vendor/service-categories:
 *   get:
 *     summary: Get categories for service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List
 */
router.get("/service-categories", getVendorHeaders, getCategoriesForServicePackage);

/**
 * @swagger
 * /vendor/service-categories/{serviceCategory}/service-sub-categories:
 *   get:
 *     summary: Get sub-categories for service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceCategory
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sub-categories list
 */
router.get("/service-categories/:serviceCategory/service-sub-categories", getVendorHeaders, getServiceSubCategoriesForPackage);

/**
 * @swagger
 * /vendor/service-packages:
 *   get:
 *     summary: Get all service packages
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List
 *   post:
 *     summary: Create service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Created
 */
router.get("/service-packages", getVendorHeaders, getServicePackages);
router.post("/service-packages", getVendorHeaders, upload.single("featuredImage"), createServicePackage);

/**
 * @swagger
 * /vendor/service-packages/{id}:
 *   get:
 *     summary: Get specific service package
 *     tags: [Vendor Packages (Service)]
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
 *         description: Package details
 *   delete:
 *     summary: Delete specific service package
 *     tags: [Vendor Packages (Service)]
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
router.get("/service-packages/:id", getVendorHeaders, getServicePackage);
router.delete("/service-packages/:id", getVendorHeaders, deleteServicePackage);

/**
 * @swagger
 * /vendor/service-packages/{id}/basic:
 *   put:
 *     summary: Update basic details
 *     tags: [Vendor Packages (Service)]
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
router.put("/service-packages/:id/basic", getVendorHeaders, upload.single("featuredImage"), updateServiceBasicDetails);

// FAQs for service package
router.post("/service-packages/:id/faqs", getVendorHeaders, addServiceFaq);
router.put("/service-packages/:id/faqs", getVendorHeaders, updateServiceFaq);
router.delete("/service-packages/:id/faqs/:index", getVendorHeaders, deleteServiceFaq);

// Videos for service package
router.post("/service-packages/:id/videos", getVendorHeaders, addServiceVideo);
router.put("/service-packages/:id/videos", getVendorHeaders, updateServiceVideo);
router.delete("/service-packages/:id/videos/:index", getVendorHeaders, deleteServiceVideo);

// Add new albums to service package
router.patch("/service-packages/:id/albums", getVendorHeaders, upload.any(), addNewServiceAlbums);
router.patch("/service-packages/:id/albums/:albumIndex/titles", getVendorHeaders, updateServiceAlbumTitles);
router.patch("/service-packages/:id/albums/:albumIndex/photos", getVendorHeaders, createArrayUpload("photos", 5, 20), addPhotosToServiceAlbum);
router.delete("/service-packages/:id/albums/:albumIndex", getVendorHeaders, deleteServiceAlbum);
router.delete("/service-packages/:id/albums/:albumIndex/photos/:photoIndex", getVendorHeaders, deleteServiceAlbumPhoto);

/*============================================================================
    SERVICE PACKAGE REVIEWS ROUTES
=============================================================================*/
// Reviews for package
router.get("/service-packages/:id/reviews", getVendorHeaders, getServiceReviewsForPackage);
router.post("/service-packages/:id/reviews", getVendorHeaders, addServiceReviewToPackage);
router.put("/service-packages/:id/reviews/:reviewId", getVendorHeaders, updateServiceReviewForPackage);
router.delete("/service-packages/:id/reviews/:reviewId", getVendorHeaders, deleteServiceReviewForPackage);

/**
 * @swagger
 * /vendor/service-packages/{id}/status:
 *   put:
 *     summary: Update package status/visibility
 *     tags: [Vendor Packages (Service)]
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
router.put("/service-packages/:id/status", getVendorHeaders, updateServiceApprovalAndVisibility);

//#endregion SERVICE PACKAGE MANAGEMENT ROUTES

//subscription routes
/**
 * @swagger
 * /vendor/subscriptions/buy:
 *   post:
 *     summary: Buy a subscription
 *     tags: [Vendor Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subscription bought
 */
router.post("/subscriptions/buy", getVendorHeaders, buySubscription);

/**
 * @swagger
 * /vendor/subscriptions/getall:
 *   get:
 *     summary: Get all subscriptions
 *     tags: [Vendor Subscriptions]
 *     responses:
 *       200:
 *         description: Subscriptions list
 */
router.get("/subscriptions/getall", getSubscriptions);

//importing of vendors from csv route
/**
 * @swagger
 * /vendor/import:
 *   post:
 *     summary: Import vendors via CSV
 *     tags: [Vendor Auth]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Imported
 */
router.post("/import", upload.single("file"), importVendors);

export default router;
