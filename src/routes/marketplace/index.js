import { Router } from 'express';
import marketplaceRoutes from './marketplace.routes.js';

const router = Router();
router.use('/', marketplaceRoutes);

export default router;
