import * as importedBusinessService from '../services/importedBusiness/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const importCsv = asyncHandler(async (req, res) => sendSuccess(res, {
  statusCode: 201,
  message: 'Business CSV import completed.',
  data: await importedBusinessService.importCsv({ file: req.file, adminId: req.user.id }),
}));
export const listPublic = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Businesses retrieved.', data: await importedBusinessService.listPublic(req.query) }));
export const getPublic = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Business retrieved.', data: await importedBusinessService.getPublic(req.params.slug) }));
export const listAdmin = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Imported businesses retrieved.', data: await importedBusinessService.listAdmin(req.query) }));
export const getAdmin = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Imported business retrieved.', data: await importedBusinessService.getAdmin(req.params.businessId) }));
export const updateAdmin = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Imported business updated.', data: await importedBusinessService.updateAdmin({ id: req.params.businessId, payload: req.body }) }));
export const listImportBatches = asyncHandler(async (req, res) => sendSuccess(res, { message: 'Business import batches retrieved.', data: await importedBusinessService.listImportBatches(req.query) }));
