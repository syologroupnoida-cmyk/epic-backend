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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Valid vendor refresh token
 *     responses:
 *       200:
 *         description: Token refreshed
 *       401:
 *         description: Refresh token missing or invalid token type
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", refreshAccessToken);

/* ============================================================================
    GOOGLE OAUTH ROUTES
============================================================================= */

// /**
//  * @swagger
//  * /vendor/auth/google:
//  *   post:
//  *     summary: Google OAuth for Vendor
//  *     tags: [Vendor Auth]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             type: object
//  *             required: [code]
//  *             properties:
//  *               code:
//  *                 type: string
//  *                 description: Google authorization code
//  *     responses:
//  *       200:
//  *         description: Logged in via Google or vendor not registered
//  *       400:
//  *         description: Google authorization code missing
//  */
// router.post("/auth/google", googleAuth);

/* ============================================================================
    NORMAL LOGIN ROUTE
============================================================================= */

/**
 * @swagger
 * /vendor/login:
 *   post:
 *     summary: Vendor Login
 *     tags: [Vendor Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [password]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Vendor email (provide email or phone)
 *               phone:
 *                 type: string
 *                 description: Vendor phone number (provide email or phone)
 *               password:
 *                 type: string
 *                 format: password
 *                 description: Vendor account password
 *     responses:
 *       200:
 *         description: Logged in
 *       401:
 *         description: Invalid login details
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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [vendorName, password, email, phone, profile]
 *             properties:
 *               vendorName:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               experience:
 *                 type: number
 *               teamSize:
 *                 type: number
 *               workingSince:
 *                 type: number
 *               state:
 *                 type: string
 *                 description: State id
 *               city:
 *                 type: string
 *                 description: City id
 *               locality:
 *                 type: string
 *               address:
 *                 type: string
 *               pincode:
 *                 type: string
 *               googleMapLink:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               contactPerson:
 *                 type: string
 *               website:
 *                 type: string
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Required profile image
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
 *       201:
 *         description: Vendor created
 *       400:
 *         description: Required fields missing or duplicate email/phone
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 description: 10-digit Indian mobile number
 *     responses:
 *       200:
 *         description: OTP sent
 *       400:
 *         description: Invalid phone number or OTP already sent
 *       404:
 *         description: Vendor not found
 */
router.post("/send-forget-otp", sendForgotPasswordOtp);

/**
 * @swagger
 * /vendor/verify-forget-otp:
 *   post:
 *     summary: Verify forgot password OTP
 *     tags: [Vendor Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, otp]
 *             properties:
 *               phone:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 *       400:
 *         description: OTP expired, invalid, or incorrect
 */
router.post("/verify-forget-otp", verifyForgotPasswordOtp);

/**
 * @swagger
 * /vendor/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Vendor Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone, newPassword]
 *             properties:
 *               phone:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 format: password
 *     responses:
 *       200:
 *         description: Password reset
 *       403:
 *         description: Session expired, OTP verification required
 *       404:
 *         description: Vendor not found
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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               vendorName:
 *                 type: string
 *               experience:
 *                 type: number
 *               teamSize:
 *                 type: number
 *               workingSince:
 *                 type: number
 *               state:
 *                 type: string
 *               city:
 *                 type: string
 *               locality:
 *                 type: string
 *               address:
 *                 type: string
 *               pincode:
 *                 type: string
 *               googleMapLink:
 *                 type: string
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               contactPerson:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               website:
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
 *         description: Profile updated
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
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
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Vendor not found
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phone]
 *             properties:
 *               phone:
 *                 type: string
 *                 description: New phone number to verify
 *     responses:
 *       200:
 *         description: OTP Sent
 *       400:
 *         description: Invalid phone, already used, or OTP already sent
 *       401:
 *         description: Unauthorized
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [otp]
 *             properties:
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone updated
 *       400:
 *         description: OTP expired/invalid or incorrect OTP
 *       401:
 *         description: Unauthorized
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city id
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by venue category id
 *     responses:
 *       200:
 *         description: List
 *   post:
 *     summary: Create venue package
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [venueCategory, title, description, startingPrice]
 *             properties:
 *               venueCategory:
 *                 type: string
 *                 description: Venue category id
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startingPrice:
 *                 type: number
 *               location:
 *                 type: string
 *                 description: JSON string with locality, fullAddress, city, state, country, pincode, googleMapsLink
 *               services:
 *                 type: string
 *                 description: JSON array of selected services
 *               latitude:
 *                 type: number
 *               longitude:
 *                 type: number
 *               isPremium:
 *                 type: boolean
 *               featuredImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Missing fields or invalid location/category
 *       403:
 *         description: Active subscription required for premium package
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
 *       404:
 *         description: Package not found
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
 *       403:
 *         description: Not allowed to delete this package
 *       404:
 *         description: Package not found
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startingPrice:
 *                 type: number
 *               location:
 *                 type: string
 *                 description: JSON string/object with locality, fullAddress, city, state, country, pincode
 *               services:
 *                 type: string
 *                 description: JSON array of service entries
 *               featuredImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated
 *       400:
 *         description: Invalid payload
 *       403:
 *         description: Not allowed to update this package
 *       404:
 *         description: Package not found
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *     responses:
 *       201:
 *         description: FAQ added
 *       400:
 *         description: Question and answer are required
 *       404:
 *         description: Package not found
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [faqs]
 *             properties:
 *               faqs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     answer:
 *                       type: string
 *     responses:
 *       200:
 *         description: FAQ updated
 *       400:
 *         description: FAQs must be an array
 *       404:
 *         description: Package not found
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
 *       404:
 *         description: Package or FAQ not found
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Video added
 *       400:
 *         description: Video URL is required
 *       404:
 *         description: Package not found
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [videos]
 *             properties:
 *               videos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     url:
 *                       type: string
 *     responses:
 *       200:
 *         description: Video updated
 *       400:
 *         description: Videos must be an array
 *       404:
 *         description: Package not found
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
 *       404:
 *         description: Package or video not found
 */
router.delete(
  "/venue-packages/:id/videos/:index",
  getVendorHeaders,
  deleteVideo
);

/**
 * @swagger
 * /vendor/venue-packages/{id}/albums:
 *   patch:
 *     summary: Add new photo albums to venue package
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               albums[0][title]:
 *                 type: string
 *               albums[0][photos]:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Albums added
 */
router.patch("/venue-packages/:id/albums", getVendorHeaders, upload.any(), addNewAlbums);

/**
 * @swagger
 * /vendor/venue-packages/{id}/albums/{albumIndex}/titles:
 *   patch:
 *     summary: Update title of a venue package album
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
 *         name: albumIndex
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Album title updated
 */
router.patch("/venue-packages/:id/albums/:albumIndex/titles", getVendorHeaders, updateAlbumTitles);

/**
 * @swagger
 * /vendor/venue-packages/{id}/albums/{albumIndex}/photos:
 *   patch:
 *     summary: Add photos to a venue package album
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
 *         name: albumIndex
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos added
 */
router.patch("/venue-packages/:id/albums/:albumIndex/photos", getVendorHeaders, createArrayUpload("photos", 5, 20), addPhotosToAlbum);

/**
 * @swagger
 * /vendor/venue-packages/{id}/albums/{albumIndex}:
 *   delete:
 *     summary: Delete a venue package album
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
 *         name: albumIndex
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Album deleted
 */
router.delete("/venue-packages/:id/albums/:albumIndex", getVendorHeaders, deleteAlbum);

/**
 * @swagger
 * /vendor/venue-packages/{id}/albums/{albumIndex}/photos/{photoIndex}:
 *   delete:
 *     summary: Delete a photo from venue package album
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
 *         name: albumIndex
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: photoIndex
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo deleted
 */
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
 *       404:
 *         description: Package not found
 *   post:
 *     summary: Add review to venue package
 *     tags: [Vendor Packages (Venue)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, rating, comment]
 *             properties:
 *               name:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review added
 *       404:
 *         description: Package not found
 */
router.get("/venue-packages/:id/reviews", getVendorHeaders, getReviewsForPackage);
router.post("/venue-packages/:id/reviews", getVendorHeaders, addReviewToPackage);

/**
 * @swagger
 * /vendor/venue-packages/{id}/reviews/{reviewId}:
 *   put:
 *     summary: Update review for venue package (admin only)
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
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 *       403:
 *         description: Only admins can update reviews
 *       404:
 *         description: Review not found
 *   delete:
 *     summary: Delete review for venue package (admin only)
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
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 *       403:
 *         description: Only admins can delete reviews
 *       404:
 *         description: Review not found
 */
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Not allowed to update this package
 *       404:
 *         description: Package not found
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
 *       404:
 *         description: Service category not found
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
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city id
 *       - in: query
 *         name: subcategory
 *         schema:
 *           type: string
 *         description: Filter by service sub-category id
 *     responses:
 *       200:
 *         description: List
 *   post:
 *     summary: Create service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [serviceSubCategory, title, description, startingPrice]
 *             properties:
 *               serviceSubCategory:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startingPrice:
 *                 type: number
 *               location:
 *                 type: string
 *                 description: JSON string with locality, fullAddress, city, state, country, pincode
 *               services:
 *                 type: string
 *                 description: JSON array of selected services
 *               isPremium:
 *                 type: boolean
 *               featuredImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Missing fields or invalid location payload
 *       403:
 *         description: Active subscription required for premium package
 *       404:
 *         description: Service sub-category not found
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
 *       404:
 *         description: Package not found
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
 *       403:
 *         description: Not allowed to delete this package
 *       404:
 *         description: Package not found
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
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               startingPrice:
 *                 type: number
 *               location:
 *                 type: string
 *                 description: JSON string/object with locality, fullAddress, city, state, country, pincode
 *               services:
 *                 type: string
 *                 description: JSON array of service entries
 *               featuredImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Updated
 *       403:
 *         description: Not allowed
 *       404:
 *         description: Package not found
 */
router.put("/service-packages/:id/basic", getVendorHeaders, upload.single("featuredImage"), updateServiceBasicDetails);

/**
 * @swagger
 * /vendor/service-packages/{id}/faqs:
 *   post:
 *     summary: Add FAQ to service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question, answer]
 *             properties:
 *               question:
 *                 type: string
 *               answer:
 *                 type: string
 *     responses:
 *       201:
 *         description: FAQ added
 *   put:
 *     summary: Replace FAQs for service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [faqs]
 *             properties:
 *               faqs:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     question:
 *                       type: string
 *                     answer:
 *                       type: string
 *     responses:
 *       200:
 *         description: FAQ updated
 */
// FAQs for service package
router.post("/service-packages/:id/faqs", getVendorHeaders, addServiceFaq);
router.put("/service-packages/:id/faqs", getVendorHeaders, updateServiceFaq);

/**
 * @swagger
 * /vendor/service-packages/{id}/faqs/{index}:
 *   delete:
 *     summary: Delete FAQ from service package
 *     tags: [Vendor Packages (Service)]
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
 *           type: integer
 *     responses:
 *       200:
 *         description: FAQ deleted
 */
router.delete("/service-packages/:id/faqs/:index", getVendorHeaders, deleteServiceFaq);

/**
 * @swagger
 * /vendor/service-packages/{id}/videos:
 *   post:
 *     summary: Add video to service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [url]
 *             properties:
 *               title:
 *                 type: string
 *               url:
 *                 type: string
 *     responses:
 *       201:
 *         description: Video added
 *   put:
 *     summary: Replace videos for service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [videos]
 *             properties:
 *               videos:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     title:
 *                       type: string
 *                     url:
 *                       type: string
 *     responses:
 *       200:
 *         description: Video updated
 */
// Videos for service package
router.post("/service-packages/:id/videos", getVendorHeaders, addServiceVideo);
router.put("/service-packages/:id/videos", getVendorHeaders, updateServiceVideo);

/**
 * @swagger
 * /vendor/service-packages/{id}/videos/{index}:
 *   delete:
 *     summary: Delete video from service package
 *     tags: [Vendor Packages (Service)]
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
 *           type: integer
 *     responses:
 *       200:
 *         description: Video deleted
 */
router.delete("/service-packages/:id/videos/:index", getVendorHeaders, deleteServiceVideo);

/**
 * @swagger
 * /vendor/service-packages/{id}/albums:
 *   patch:
 *     summary: Add new photo albums to service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               albums[0][title]:
 *                 type: string
 *               albums[0][photos]:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Albums added
 */
// Add new albums to service package
router.patch("/service-packages/:id/albums", getVendorHeaders, upload.any(), addNewServiceAlbums);

/**
 * @swagger
 * /vendor/service-packages/{id}/albums/{albumIndex}/titles:
 *   patch:
 *     summary: Update title of a service package album
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: albumIndex
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [title]
 *             properties:
 *               title:
 *                 type: string
 *     responses:
 *       200:
 *         description: Album title updated
 */
router.patch("/service-packages/:id/albums/:albumIndex/titles", getVendorHeaders, updateServiceAlbumTitles);

/**
 * @swagger
 * /vendor/service-packages/{id}/albums/{albumIndex}/photos:
 *   patch:
 *     summary: Add photos to a service package album
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: albumIndex
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Photos added
 */
router.patch("/service-packages/:id/albums/:albumIndex/photos", getVendorHeaders, createArrayUpload("photos", 5, 20), addPhotosToServiceAlbum);

/**
 * @swagger
 * /vendor/service-packages/{id}/albums/{albumIndex}:
 *   delete:
 *     summary: Delete a service package album
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: albumIndex
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Album deleted
 */
router.delete("/service-packages/:id/albums/:albumIndex", getVendorHeaders, deleteServiceAlbum);

/**
 * @swagger
 * /vendor/service-packages/{id}/albums/{albumIndex}/photos/{photoIndex}:
 *   delete:
 *     summary: Delete a photo from service package album
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: albumIndex
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: photoIndex
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Photo deleted
 */
router.delete("/service-packages/:id/albums/:albumIndex/photos/:photoIndex", getVendorHeaders, deleteServiceAlbumPhoto);

/*============================================================================
    SERVICE PACKAGE REVIEWS ROUTES
=============================================================================*/
/**
 * @swagger
 * /vendor/service-packages/{id}/reviews:
 *   get:
 *     summary: Get reviews for service package
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
 *         description: Reviews list
 *   post:
 *     summary: Add review to service package
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, rating, comment]
 *             properties:
 *               name:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review added
 */
// Reviews for package
router.get("/service-packages/:id/reviews", getVendorHeaders, getServiceReviewsForPackage);
router.post("/service-packages/:id/reviews", getVendorHeaders, addServiceReviewToPackage);

/**
 * @swagger
 * /vendor/service-packages/{id}/reviews/{reviewId}:
 *   put:
 *     summary: Update review for service package (admin only)
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       200:
 *         description: Review updated
 *       403:
 *         description: Only admins can update reviews
 *       404:
 *         description: Review not found
 *   delete:
 *     summary: Delete review for service package (admin only)
 *     tags: [Vendor Packages (Service)]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 *       403:
 *         description: Only admins can delete reviews
 *       404:
 *         description: Review not found
 */
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               approved:
 *                 type: boolean
 *               visibility:
 *                 type: string
 *                 enum: [public, private]
 *     responses:
 *       200:
 *         description: Status updated
 *       403:
 *         description: Not allowed to update this package
 *       404:
 *         description: Package not found
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [subscriptionId]
 *             properties:
 *               subscriptionId:
 *                 type: string
 *                 description: Subscription plan id
 *     responses:
 *       200:
 *         description: Subscription bought
 *       400:
 *         description: Subscription unavailable or already active
 *       404:
 *         description: Vendor or subscription plan not found
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
 *       400:
 *         description: CSV file is required
 */
router.post("/import", upload.single("file"), importVendors);

export default router;
