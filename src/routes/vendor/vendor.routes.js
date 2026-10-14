import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as kycController from '../../controllers/vendorKyc.controller.js';
import * as profileController from '../../controllers/vendorProfile.controller.js';
import { requireKycApproved } from '../../middlewares/kyc.middleware.js';
import { updateVendorProfileSchema } from '../../validators/vendorProfile.validator.js';
import {
  submitKycSchema,
  documentNumberSchemas,
} from '../../validators/vendorKyc.validator.js';

const router = Router();

router.get('/ping', (req, res) =>
  sendSuccess(res, {
    message: 'Vendor panel reachable.',
    data: { user: req.user },
  }),
);

// ---- KYC status + final submission ----
router.get('/kyc', kycController.getMyKycStatus);
for (const [slug, type] of [['pan', 'PAN'], ['aadhaar', 'AADHAR'], ['gstin', 'GSTIN'], ['cin', 'CIN']]) {
  router.post(
    `/kyc/validate/${slug}`,
    validateRequest(documentNumberSchemas[type]),
    kycController.validateDocumentNumber(type),
  );
}
router.post('/kyc', validateRequest(submitKycSchema), kycController.submitMyKyc);

// ---- Business profile + normalized, approved capabilities ----
// A vendor can view the profile shell at any stage. Approval initializes its
// public fields from the verified KYC snapshot; editing starts after approval.
router.get('/profile', profileController.getMyProfile);
router.patch(
  '/profile',
  requireKycApproved,
  validateRequest(updateVendorProfileSchema),
  profileController.updateMyProfile,
);
router.get(
  '/capabilities',
  requireKycApproved,
  profileController.getMyCapabilities,
);

export default router;
