import { Router } from 'express';
import authRoutes from './auth.routes.js';
import uploadRoutes from './upload.routes.js';
import healthRoutes from './health.routes.js';

const router = Router();
router.use('/auth', authRoutes);
router.use('/uploads', uploadRoutes);
router.use('/health', healthRoutes);
export default router;
