import { Router } from 'express';
import authRoutes from './auth.routes.js';
import uploadRoutes from './upload.routes.js';
import healthRoutes from './health.routes.js';
import serviceCatalogRoutes from './serviceCatalog.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/uploads', uploadRoutes);
router.use('/health', healthRoutes);
router.use('/', serviceCatalogRoutes);
export default router;
