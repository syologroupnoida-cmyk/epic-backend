import * as cityService from '../services/city/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createCity = asyncHandler(async (req, res) => {
  const data = await cityService.createCity(req.body);
  return sendSuccess(res, { statusCode: 201, message: 'City created.', data });
});

export const listCities = asyncHandler(async (req, res) => {
  const data = await cityService.listCities(req.query);
  return sendSuccess(res, { message: 'Cities retrieved.', data });
});

export const listPublicCities = asyncHandler(async (req, res) => {
  const data = await cityService.listPublicCities(req.query);
  return sendSuccess(res, { message: 'Active cities retrieved.', data });
});

export const getCity = asyncHandler(async (req, res) => {
  const data = await cityService.getCity(req.params.id);
  return sendSuccess(res, { message: 'City retrieved.', data });
});

export const getPublicCity = asyncHandler(async (req, res) => {
  const data = await cityService.getPublicCity(req.params.id);
  return sendSuccess(res, { message: 'City retrieved.', data });
});

export const updateCity = asyncHandler(async (req, res) => {
  const data = await cityService.updateCity({ id: req.params.id, body: req.body });
  return sendSuccess(res, { message: 'City updated.', data });
});
