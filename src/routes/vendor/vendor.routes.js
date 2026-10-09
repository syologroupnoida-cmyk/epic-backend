import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as kycController from '../../controllers/vendorKyc.controller.js';
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

export default router;
