import express from "express";
import { upload } from "../../../middlewares/multer.js";
import { requireVendorRole } from "../middleware/vendorRoleMiddleware.js";
import {
  getVendorKycStatus,
  saveVendorKycDraft,
  verifyVendorKycDocument,
  submitVendorKyc,
} from "../controllers/vendorKycController.js";

const router = express.Router();

router.use(requireVendorRole);

router.get("/status", getVendorKycStatus);
router.put("/draft", saveVendorKycDraft);
router.post("/verify-document", verifyVendorKycDocument);
router.post(
  "/submit",
  upload.fields([
    { name: "companyLogo", maxCount: 1 },
    { name: "panDocument", maxCount: 1 },
    { name: "gstinDocument", maxCount: 1 },
    { name: "cinDocument", maxCount: 1 },
    { name: "aadharDocument", maxCount: 1 },
  ]),
  submitVendorKyc
);

export default router;
