import { Router } from 'express';
import * as controller from '../../controllers/vendorSalesMeeting.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { adminSalesMeetingListQuerySchema, reviewVendorSalesMeetingSchema, vendorSalesMeetingIdParamsSchema } from '../../validators/vendorSalesMeeting.validator.js';
const router = Router();
router.get('/sales-meetings', validateRequest(adminSalesMeetingListQuerySchema, 'query'), controller.listForAdmin);
router.get('/sales-meetings/:meetingId', validateRequest(vendorSalesMeetingIdParamsSchema, 'params'), controller.getForAdmin);
router.patch('/sales-meetings/:meetingId', validateRequest(vendorSalesMeetingIdParamsSchema, 'params'), validateRequest(reviewVendorSalesMeetingSchema), controller.reviewForAdmin);
export default router;
