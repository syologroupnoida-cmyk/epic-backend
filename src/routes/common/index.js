import { Router } from 'express';
import authRoutes from './auth.routes.js';
import uploadRoutes from './upload.routes.js';
import healthRoutes from './health.routes.js';
import serviceCatalogRoutes from './serviceCatalog.routes.js';
import cityRoutes from './city.routes.js';
import contactMessageRoutes from './contactMessage.routes.js';
import { listPublicPlans } from '../../controllers/vendorSubscription.controller.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/uploads', uploadRoutes);
router.use('/health', healthRoutes);
router.use('/', serviceCatalogRoutes);
router.use('/', cityRoutes);
router.use('/', contactMessageRoutes);
router.get('/subscription-plans', listPublicPlans);
export default router;
