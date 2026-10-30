import { Router } from 'express';
import * as contactMessageController from '../../controllers/contactMessage.controller.js';
import { limitPublicContactSubmissions } from '../../middlewares/publicContactRateLimit.middleware.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { createContactMessageSchema } from '../../validators/contactMessage.validator.js';

const router = Router();

router.post('/contact-us', limitPublicContactSubmissions, validateRequest(createContactMessageSchema), contactMessageController.submit);

export default router;
