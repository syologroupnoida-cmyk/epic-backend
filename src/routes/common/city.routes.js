import { Router } from 'express';
import * as cityController from '../../controllers/city.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { listCitiesSchema } from '../../validators/city.validator.js';

const router = Router();

router.get('/cities', validateRequest(listCitiesSchema, 'query'), cityController.listPublicCities);
router.get('/cities/:id', cityController.getPublicCity);

export default router;
