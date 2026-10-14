import { Router } from 'express';
import * as catalogController from '../../controllers/serviceCatalog.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listCatalogSchema, listSubcategoriesSchema } from '../../validators/serviceCatalog.validator.js';

const router = Router();

// Public, read-only catalog. Admin routes remain responsible for all mutations.
router.get(
  '/service-categories',
  validateRequest(listCatalogSchema, 'query'),
  catalogController.listPublicCategories,
);
router.get('/service-categories/:id', catalogController.getPublicCategory);
router.get(
  '/service-subcategories',
  validateRequest(listSubcategoriesSchema, 'query'),
  catalogController.listPublicSubcategories,
);
router.get('/service-subcategories/:id', catalogController.getPublicSubcategory);

export default router;
