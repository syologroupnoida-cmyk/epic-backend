import { Router } from 'express';
import * as controller from '../../controllers/city.controller.js';
import { validateRequest } from '../../middlewares/validation.middleware.js';
import { createCitySchema, updateCitySchema, listCitiesSchema } from '../../validators/city.validator.js';
const router = Router();
router.route('/cities').get(validateRequest(listCitiesSchema, 'query'), controller.listCities).post(validateRequest(createCitySchema), controller.createCity);
router.route('/cities/:id').get(controller.getCity).patch(validateRequest(updateCitySchema), controller.updateCity).put(validateRequest(updateCitySchema), controller.updateCity);
export default router;
