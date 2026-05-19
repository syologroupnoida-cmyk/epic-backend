import express from "express";
import {
  sendVendorRegisterOtp,
  vendorRegister,
  sendVendorLoginOtp,
  vendorOtpLogin,
  vendorAuthRefresh,
} from "../controllers/vendorAuthController.js";
import { requireVendorRole } from "../middleware/vendorRoleMiddleware.js";

const router = express.Router();

router.post("/send-register-otp", sendVendorRegisterOtp);
router.post("/register", vendorRegister);
router.post("/send-login-otp", sendVendorLoginOtp);
router.post("/verify-login-otp", vendorOtpLogin);
router.post("/refresh", vendorAuthRefresh);
router.get("/me", requireVendorRole, (req, res) => {
  res.json({
    statusCode: 200,
    success: true,
    message: "Vendor profile fetched",
    data: { vendor: req.vendorAuth },
  });
});

export default router;
