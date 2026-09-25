import * as service from '../services/serviceCatalog/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

const handler = (operation, message, statusCode = 200) => asyncHandler(async (req, res) => {
  const data = await operation({ id: req.params.id, body: req.body, file: req.file, ...req.query });
  return sendSuccess(res, { statusCode, message, data });
});
export const createCategory = handler(service.createCategory, 'Service category created.', 201);
export const listCategories = handler(service.listCategories, 'Service categories retrieved.');
export const getCategory = handler(({ id }) => service.getCategory(id), 'Service category retrieved.');
export const updateCategory = handler(service.updateCategory, 'Service category updated.');
export const deleteCategory = handler(({ id }) => service.deleteCategory(id), 'Service category deleted.');
export const createSubcategory = handler(service.createSubcategory, 'Service subcategory created.', 201);
export const listSubcategories = handler(service.listSubcategories, 'Service subcategories retrieved.');
export const getSubcategory = handler(({ id }) => service.getSubcategory(id), 'Service subcategory retrieved.');
export const updateSubcategory = handler(service.updateSubcategory, 'Service subcategory updated.');
export const deleteSubcategory = handler(({ id }) => service.deleteSubcategory(id), 'Service subcategory deleted.');
