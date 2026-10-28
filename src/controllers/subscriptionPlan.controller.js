import * as subscriptionPlanService from '../services/subscriptionPlan/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const createPlan = asyncHandler(async (req, res) => sendSuccess(res, {
  statusCode: 201,
  message: 'Subscription plan created.',
  data: await subscriptionPlanService.createPlan(req.body),
}));

export const listPlans = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Subscription plans retrieved.',
  data: { plans: await subscriptionPlanService.listPlans(req.query) },
}));

export const getPlan = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Subscription plan retrieved.',
  data: await subscriptionPlanService.getPlan(req.params.planId),
}));

export const updatePlan = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Subscription plan updated.',
  data: await subscriptionPlanService.updatePlan({ planId: req.params.planId, payload: req.body }),
}));

export const activatePlan = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Subscription plan activated.',
  data: await subscriptionPlanService.activatePlan(req.params.planId),
}));

export const deactivatePlan = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Subscription plan deactivated.',
  data: await subscriptionPlanService.deactivatePlan(req.params.planId),
}));

export const deletePlan = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Subscription plan deleted.',
  data: await subscriptionPlanService.deletePlan(req.params.planId),
}));
