import { Router } from 'express';
import { authenticateUser, authorizeRoles } from '../../middlewares/auth.middleware.js';
import { sendSuccess } from '../../utils/response.js';
import vendorKycRoutes from './vendorKyc.routes.js';
import catalogueRoutes from './catalogue.routes.js';
import cityRoutes from './city.routes.js';
import listingRoutes from './listing.routes.js';
import venuePropertyRoutes from './venueProperty.routes.js';
import leadRoutes from './lead.routes.js';
import subscriptionPlanRoutes from './subscriptionPlan.routes.js';
import contactMessageRoutes from './contactMessage.routes.js';
import importedBusinessRoutes from './importedBusiness.routes.js';
import salesMeetingRoutes from './salesMeeting.routes.js';
import ecommerceRoutes from './ecommerce.routes.js';

const router = Router();
router.use(authenticateUser, authorizeRoles(['ADMIN', 'SUPER_ADMIN']));
router.get('/ping', (req, res) => sendSuccess(res, {
  message: 'Admin panel reachable.',
  data: { user: req.user },
}));
router.use('/', vendorKycRoutes);
router.use('/', catalogueRoutes);
router.use('/', cityRoutes);
router.use('/', listingRoutes);
router.use('/', venuePropertyRoutes);
router.use('/', leadRoutes);
router.use('/', subscriptionPlanRoutes);
router.use('/', contactMessageRoutes);
router.use('/', importedBusinessRoutes);
router.use('/', salesMeetingRoutes);
router.use('/', ecommerceRoutes);
export default router;
