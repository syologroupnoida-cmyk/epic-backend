import { Router } from "express";
import {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  getGoogleAuthUrl,
  googleAuth,
  sendForgotPasswordOtp,
  verifyForgotPasswordOtp,
  resetPassword,
  sendRegisterOTP,
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
  storeUserInterest,
  getUserInterests,
  removeUserInterest,
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The refresh token issued at login
 *     responses:
 *       200:
 *         description: New access token returned
 *       401:
 *         description: Refresh token required or invalid
 *       403:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", refreshAccessTokenUser);

/**
 * @swagger
 * /user/send-register-otp:
 *   post:
 *     summary: Send registration OTP to email
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address to send OTP to (must not already be registered)
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Email not provided or user already exists
 */
router.post("/send-register-otp", sendRegisterOTP);

/**
 * @swagger
 * /user/register:
 *   post:
 *     summary: Register a new user (verify OTP then create account)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - otp
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: User's full name
 *               email:
 *                 type: string
 *                 description: Email address (must match OTP request)
 *               password:
 *                 type: string
 *                 description: Account password
 *               phone:
 *                 type: string
 *                 description: Phone number (optional)
 *               otp:
 *                 type: string
 *                 description: OTP received via email
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Profile picture (optional)
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Required fields missing, OTP invalid/expired, or user already exists
 */
router.post("/register", upload.single("profile"), registerUser);

/**
 * @swagger
 * /user/login:
 *   post:
 *     summary: Login user
 *     tags: [User]
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
 *               password:
 *                 type: string
 *             example:
 *               email: temp4risk@gmail.com
 *               password: password
 *     responses:
 *       200:
 *         description: Logged in successfully
 *       401:
 *         description: Invalid credentials
 *       403:
 *         description: Account is inactive
 */
router.post("/login", loginUser);

/**
 * @swagger
 * /user/google-auth-url:
 *   get:
 *     summary: Generate Google OAuth URL for frontend redirection
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: redirect_uri
 *         schema:
 *           type: string
 *         description: Redirect URI to return to after user authenticates (defaults to "postmessage")
 *     responses:
 *       200:
 *         description: Google Auth URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Google Auth URL generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     authUrl:
 *                       type: string
 *                       example: https://accounts.google.com/o/oauth2/v2/auth?...
 */
router.get("/google-auth-url", getGoogleAuthUrl);

/**
 * @swagger
 * /user/google-auth:
 *   post:
 *     summary: Google OAuth login / signup
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Google OAuth authorization code (optional if idToken or credential is provided)
 *               idToken:
 *                 type: string
 *                 description: Google raw ID Token / JWT (optional if code or credential is provided)
 *               credential:
 *                 type: string
 *                 description: Google One-Tap/GIS JWT credential (optional if code or idToken is provided)
 *               redirect_uri:
 *                 type: string
 *                 description: Redirect URI used during OAuth flow (defaults to "postmessage")
 *     responses:
 *       200:
 *         description: Authenticated successfully
 *       400:
 *         description: Credentials/Tokens missing or Google authentication failed
 *       403:
 *         description: Account is inactive
 */
router.post("/google-auth", googleAuth);

/* ============================================================================
    FORGOT PASSWORD ROUTES
============================================================================= */

/**
 * @swagger
 * /user/send-forget-otp:
 *   post:
 *     summary: Send forgot password OTP via SMS
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Registered phone number (Indian format, e.g. 9876543210)
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *       400:
 *         description: Invalid phone number or OTP already sent
 *       404:
 *         description: User not found
 */
router.post("/send-forget-otp", sendForgotPasswordOtp);

/**
 * @swagger
 * /user/verify-forget-otp:
 *   post:
 *     summary: Verify forgot password OTP
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - otp
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number the OTP was sent to
 *               otp:
 *                 type: string
 *                 description: OTP received via SMS
 *     responses:
 *       200:
 *         description: OTP verified, password reset session started (valid 10 min)
 *       400:
 *         description: OTP expired or invalid
 */
router.post("/verify-forget-otp", verifyForgotPasswordOtp);

/**
 * @swagger
 * /user/reset-password:
 *   post:
 *     summary: Reset password (after OTP verification)
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phone
 *               - newPassword
 *             properties:
 *               phone:
 *                 type: string
 *                 description: Phone number used during OTP verification
 *               newPassword:
 *                 type: string
 *                 description: New password to set
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       403:
 *         description: Session expired, please re-verify OTP
 *       404:
 *         description: User not found
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
 *         description: User ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               fullName:
 *                 type: string
 *                 description: Updated full name
 *               phone:
 *                 type: string
 *                 description: Updated phone number
 *               isActive:
 *                 type: boolean
 *                 description: Activate or deactivate the account (admin use)
 *               profile:
 *                 type: string
 *                 format: binary
 *                 description: Replacement profile picture (optional)
 *     responses:
 *       200:
 *         description: Profile updated
 *       400:
 *         description: isActive must be true or false
 *       404:
 *         description: User not found
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
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of the user's location
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of the user's location
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometers
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Nearby vendors retrieved
 *       400:
 *         description: Latitude and Longitude are required
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
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude of the user's location
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude of the user's location
 *       - in: query
 *         name: radius
 *         schema:
 *           type: number
 *           default: 10
 *         description: Search radius in kilometers
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
 *         description: Number of results per page
 *     responses:
 *       200:
 *         description: Nearby venues retrieved
 *       400:
 *         description: Latitude and Longitude are required
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
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city name
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum starting price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum starting price
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by venue title (min 3 characters)
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
 *         description: Results per page (max 50)
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - planner
 *             properties:
 *               planner:
 *                 type: object
 *                 description: Planner item data to save
 *     responses:
 *       201:
 *         description: Planner item saved successfully
 *       404:
 *         description: User not found
 */
router.post("/saveplanner",getUserHeaders,savePlanner);

/**
 * @swagger
 * /user/contact:
 *   post:
 *     summary: Register user in contact list
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 description: Email address to register in the contact list
 *     responses:
 *       200:
 *         description: User registered in contact list
 *       400:
 *         description: Email is required
 */
router.post("/contact", getUserHeaders, createContact);

/**
 * @swagger
 * /user/premium/venues:
 *   get:
 *     summary: Get premium venue packages
 *     tags: [User]
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
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city name
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
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by service category ID
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city name
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
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - serviceType
 *               - title
 *               - story
 *               - experience
 *               - rating
 *             properties:
 *               serviceType:
 *                 type: string
 *                 description: Type of service (e.g. venue, photography)
 *               title:
 *                 type: string
 *                 description: Story title
 *               story:
 *                 type: string
 *                 description: Full story text
 *               experience:
 *                 type: string
 *                 description: Overall experience summary
 *               rating:
 *                 type: number
 *                 description: Rating (e.g. 1–5)
 *               vendor:
 *                 type: string
 *                 description: Vendor ID (optional)
 *               location:
 *                 type: string
 *                 description: Event location (optional)
 *               coupleName:
 *                 type: string
 *                 description: Couple or person name (optional)
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Up to 5 story images (optional)
 *     responses:
 *       201:
 *         description: Real story submitted successfully
 *       400:
 *         description: Required fields missing
 *   get:
 *     summary: Get real stories
 *     tags: [User]
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
 *         name: serviceType
 *         schema:
 *           type: string
 *         description: Filter by service type
 *       - in: query
 *         name: featured
 *         schema:
 *           type: string
 *           enum: ["true"]
 *         description: Pass "true" to return only featured stories
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
 *         description: Real story ID
 *     responses:
 *       200:
 *         description: Single story details
 *       404:
 *         description: Story not found
 */
router.get("/real-stories/:id", getSingleStory);

/**
 * @swagger
 * /user/popular-searches:
 *   get:
 *     summary: Get popular searches (last 7 days, ranked by trending score)
 *     tags: [User]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of popular searches to return
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filter by city
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [venue, service, product]
 *         description: Filter by category type
 *     responses:
 *       200:
 *         description: Popular searches returned
 */
router.get("/popular-searches",getPopularSearches);

/**
 * @swagger
 * /user/interest:
 *   post:
 *     summary: Store user interest (Wishlist, Purchase, Inquiry, View)
 *     tags: [User Interest]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - typeOfInterest
 *             properties:
 *               vendorId:
 *                 type: string
 *                 description: ID of the vendor
 *                 example: 69e669800a280e67217f1e29
 *               venueId:
 *                 type: string
 *                 description: ID of the venue package
 *                 example: 69e669800a280e67217f1e31
 *               typeOfInterest:
 *                 type: string
 *                 enum: [purchase, wishlist, inquiry, view]
 *                 description: The type of user interest
 *                 example: wishlist
 *     responses:
 *       200:
 *         description: Interest stored/upserted successfully
 *       400:
 *         description: Missing required fields or invalid parameters
 *       401:
 *         description: Unauthorized
 *       444:
 *         description: Vendor or Venue package not found
 *
 *   get:
 *     summary: Get user interests
 *     tags: [User Interest]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [purchase, wishlist, inquiry, view]
 *         description: Filter interests by type
 *     responses:
 *       200:
 *         description: List of user interests returned successfully
 *       401:
 *         description: Unauthorized
 *
 *   delete:
 *     summary: Remove a user interest
 *     tags: [User Interest]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               vendorId:
 *                 type: string
 *                 description: ID of the vendor
 *               venueId:
 *                 type: string
 *                 description: ID of the venue package
 *               typeOfInterest:
 *                 type: string
 *                 enum: [purchase, wishlist, inquiry, view]
 *                 description: Optional type of interest to remove
 *     responses:
 *       200:
 *         description: User interest removed successfully
 *       400:
 *         description: Missing vendorId or venueId
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: No matching interest found
 */
router.post("/interest", getUserHeaders, storeUserInterest);
router.get("/interest", getUserHeaders, getUserInterests);
router.delete("/interest", getUserHeaders, removeUserInterest);

export default router;
