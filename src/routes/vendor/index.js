import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../../middlewares/auth.middleware.js';
import vendorRoutes from './vendor.routes.js';

const router = Router();
router.use(authenticateUser, authorizeRoles(['VENDOR']));
router.use('/', vendorRoutes);
export default router;
