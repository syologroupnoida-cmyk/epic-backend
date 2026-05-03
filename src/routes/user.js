import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  googleAuth,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  searchNearMe,
  searchNearMeVenue,
  savePlanner,
  searchVenues,
  createContact,
  getPremiumVenuePackages,
  getPremiumServicePackages,
  createRealStory,
  getRealStories,
  getSingleStory,
  getPopularSearches,
} from "../controllers/user.js";
import { getUserHeaders } from "../middlewares/authMiddleware.js";
import { upload } from "../middlewares/multer.js";
import { refreshAccessTokenUser} from "../controllers/authController.js";
import { trackSearch } from "../middlewares/trackMiddleware.js";

const router = Router();

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User operations
 */

/**
 * @swagger
 * /user/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 */
router.post("/refresh", refreshAccessTokenUser);

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profile:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post("/register", upload.single("profile"), registerUser);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login user
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               email: temp4risk@gmail.com
 *               password: password
 *     responses:
 *       200:
 *         description: Logged in successfully
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /user/google-auth:
 *   post:
 *     summary: Google Authentication
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Authenticated successfully
 */
router.post("/google-auth", googleAuth);

/* ============================================================================
    FORGOT PASSWORD ROUTES
============================================================================= */

/**
 * @swagger
 * /user/send-forget-otp:
 *   post:
 *     summary: Send forgot password OTP
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post("/send-forget-otp", sendForgotPasswordOtp);

/**
 * @swagger
 * /user/verify-forget-otp:
 *   post:
 *     summary: Verify forgot password OTP
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified successfully
 */
router.post("/verify-forget-otp", verifyForgotPasswordOtp);

/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [User]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 */
router.post("/reset-password", resetPassword);

/* ============================================================================
    PRIVATE ROUTES
============================================================================= */

/**
 * @swagger
 * /user/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile details
 */
router.get("/profile", getUserHeaders, getUserProfile);

/**
 * @swagger
 * /user/profile/{id}:
 *   put:
 *     summary: Update user profile
 *     tags: [User]
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
 *             properties:
 *               profile:
 *                 type: string
 *                 format: binary
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put(
  "/profile/:id",
  getUserHeaders,
  upload.single("profile"),
  updateUserProfile
);

/**
 * @swagger
 * /user/near-me-vendor:
 *   get:
 *     summary: Get nearby vendors
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nearby vendors retrieved
 */
router.get("/near-me-vendor",getUserHeaders,searchNearMe);

/**
 * @swagger
 * /user/near-me-venue:
 *   get:
 *     summary: Get nearby venues
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Nearby venues retrieved
 */
router.get("/near-me-venue",getUserHeaders,searchNearMeVenue);

/**
 * @swagger
 * /user/search-venues:
 *   get:
 *     summary: Search venues
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Venues found
 */
router.get("/search-venues",getUserHeaders,trackSearch("venue"),searchVenues);

/**
 * @swagger
 * /user/saveplanner:
 *   post:
 *     summary: Save an item to the planner
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Planner saved successfully
 */
router.post("/saveplanner",getUserHeaders,savePlanner);

/**
 * @swagger
 * /user/contact:
 *   post:
 *     summary: Create a contact inquiry
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Contact created successfully
 */
router.post("/contact", getUserHeaders, createContact);

/**
 * @swagger
 * /user/premium/venues:
 *   get:
 *     summary: Get premium venue packages
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Premium venue packages
 */
router.get("/premium/venues",trackSearch("venue"), getPremiumVenuePackages);

/**
 * @swagger
 * /user/premium/services:
 *   get:
 *     summary: Get premium service packages
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Premium service packages
 */
router.get("/premium/services", trackSearch("service"),getPremiumServicePackages);

/**
 * @swagger
 * /user/real-stories:
 *   post:
 *     summary: Create a real story
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Real story created
 *   get:
 *     summary: Get real stories
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Real stories list
 */
router.post("/real-stories", getUserHeaders, upload.array("images", 5), createRealStory);
router.get("/real-stories", getRealStories);

/**
 * @swagger
 * /user/real-stories/{id}:
 *   get:
 *     summary: Get a single real story
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Single story details
 */
router.get("/real-stories/:id", getSingleStory);

/**
 * @swagger
 * /user/popular-searches:
 *   get:
 *     summary: Get popular searches
 *     tags: [User]
 *     responses:
 *       200:
 *         description: Popular searches
 */
router.get("/popular-searches",getPopularSearches);

export default router;
