import { Router } from 'express';
import * as controller from '../../controllers/contactMessage.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { adminContactMessageListQuerySchema, contactMessageIdParamsSchema, updateContactMessageSchema } from '../../validators/contactMessage.validator.js';
const router = Router();
router.get('/contact-messages', validateRequest(adminContactMessageListQuerySchema, 'query'), controller.listForAdmin);
router.get('/contact-messages/:messageId', validateRequest(contactMessageIdParamsSchema, 'params'), controller.getForAdmin);
router.patch('/contact-messages/:messageId', validateRequest(contactMessageIdParamsSchema, 'params'), validateRequest(updateContactMessageSchema), controller.updateForAdmin);
export default router;
