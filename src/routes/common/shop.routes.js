import { Router } from 'express';
import * as ecommerceController from '../../controllers/ecommerce.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { ecommercePublicCategoryListQuerySchema, ecommercePublicProductListQuerySchema } from '../../validators/ecommerce.validator.js';

const router = Router();
router.get('/shop/categories', validateRequest(ecommercePublicCategoryListQuerySchema, 'query'), ecommerceController.listPublicCategories);
router.get('/shop/subcategories', ecommerceController.listPublicSubcategories);
router.get('/shop/products', validateRequest(ecommercePublicProductListQuerySchema, 'query'), ecommerceController.listPublicProducts);
router.get('/shop/products/:slug', ecommerceController.getPublicProduct);
export default router;
