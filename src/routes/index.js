import { Router } from 'express';
import commonRoutes from './common/index.js';
import vendorRoutes from './vendor/index.js';
import adminRoutes from './admin/index.js';
import superAdminRoutes from './super-admin/index.js';

const router = Router();
router.use('/', commonRoutes);
router.use('/vendor', vendorRoutes);
router.use('/admin', adminRoutes);
router.use('/super-admin', superAdminRoutes);
export default router;
