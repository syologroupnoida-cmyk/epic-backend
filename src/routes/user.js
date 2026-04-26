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

//access token refresh route
router.post("/refresh", refreshAccessTokenUser);

// Public
router.post("/register", upload.single("profile"), registerUser);
router.post("/login", loginUser);
router.post("/google-auth", googleAuth);


/* ============================================================================
    FORGOT PASSWORD ROUTES
============================================================================= */
router.post("/send-forget-otp", sendForgotPasswordOtp); // tested
router.post("/verify-forget-otp", verifyForgotPasswordOtp); // tested
router.post("/reset-password", resetPassword); // tested



// Private
router.get("/profile", getUserHeaders, getUserProfile);
router.put(
  "/profile/:id",
  getUserHeaders,
  upload.single("profile"),
  updateUserProfile
);

router.get("/near-me-vendor",getUserHeaders,searchNearMe);
router.get("/near-me-venue",getUserHeaders,searchNearMeVenue);
router.get("/search-venues",getUserHeaders,trackSearch("venue"),searchVenues);

router.post("/saveplanner",getUserHeaders,savePlanner);

router.post("/contact", getUserHeaders, createContact);

router.get("/premium/venues",trackSearch("venue"), getPremiumVenuePackages);
router.get("/premium/services", trackSearch("service"),getPremiumServicePackages);

router.post("/real-stories", getUserHeaders, upload.array("images", 5), createRealStory);
router.get("/real-stories", getRealStories);
router.get("/real-stories/:id", getSingleStory);

router.get("/popular-searches",getPopularSearches);

export default router;
