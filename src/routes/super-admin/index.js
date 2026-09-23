import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../../middlewares/auth.middleware.js';
import superAdminRoutes from './superAdmin.routes.js';

const router = Router();
router.use(authenticateUser, authorizeRoles(['SUPER_ADMIN']));
router.use('/', superAdminRoutes);
export default router;
