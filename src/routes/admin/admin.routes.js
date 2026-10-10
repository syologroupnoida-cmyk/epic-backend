import { Router } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import * as kycController from '../../controllers/vendorKyc.controller.js';
import {
  listKycQuerySchema,
  rejectKycSchema,
} from '../../validators/vendorKyc.validator.js';
import * as catalogController from '../../controllers/serviceCatalog.controller.js';
import { uploadSingleFile } from '../../middlewares/upload.middleware.js';
import { createCategoryPayloadSchema, updateCategorySchema, createSubcategoryPayloadSchema, updateSubcategorySchema, listCatalogSchema, listSubcategoriesSchema } from '../../validators/serviceCatalog.validator.js';

const router = Router();

router.get('/ping', (req, res) =>
  sendSuccess(res, {
    message: 'Admin panel reachable.',
    data: { user: req.user },
  }),
);

// --- Vendor KYC review ---
router.get(
  '/vendor-kyc',
  validateRequest(listKycQuerySchema, 'query'),
  kycController.listKycForAdmin,
);

router.post('/vendor-kyc/:userId/approve', kycController.approveVendorKyc);

router.post(
  '/vendor-kyc/:userId/reject',
  validateRequest(rejectKycSchema),
  kycController.rejectVendorKyc,
);

router.route('/service-categories')
  .get(validateRequest(listCatalogSchema, 'query'), catalogController.listCategories)
  .post(uploadSingleFile, validateRequest(createCategoryPayloadSchema), catalogController.createCategory);
router.route('/service-categories/:id')
  .get(catalogController.getCategory)
  .patch(uploadSingleFile, validateRequest(updateCategorySchema), catalogController.updateCategory)
  .put(uploadSingleFile, validateRequest(updateCategorySchema), catalogController.updateCategory)
  .delete(catalogController.deleteCategory);
router.route('/service-subcategories')
  .get(validateRequest(listSubcategoriesSchema, 'query'), catalogController.listSubcategories)
  .post(uploadSingleFile, validateRequest(createSubcategoryPayloadSchema), catalogController.createSubcategory);
router.route('/service-subcategories/:id')
  .get(catalogController.getSubcategory)
  .patch(uploadSingleFile, validateRequest(updateSubcategorySchema), catalogController.updateSubcategory)
  .put(uploadSingleFile, validateRequest(updateSubcategorySchema), catalogController.updateSubcategory)
  .delete(catalogController.deleteSubcategory);

export default router;
