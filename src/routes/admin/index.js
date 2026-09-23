import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../../middlewares/auth.middleware.js';
import adminRoutes from './admin.routes.js';

const router = Router();
router.use(authenticateUser, authorizeRoles(['ADMIN', 'SUPER_ADMIN']));
router.use('/', adminRoutes);
export default router;
