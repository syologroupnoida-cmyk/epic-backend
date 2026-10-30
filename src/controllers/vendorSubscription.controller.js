import * as vendorSubscriptionService from '../services/vendorSubscription/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getMySubscription = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Vendor effective subscription retrieved.',
  data: await vendorSubscriptionService.getMySubscription(req.user.id),
}));

export const listAvailablePlans = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Available subscription plans retrieved.',
  data: await vendorSubscriptionService.listAvailablePlans(req.user.id),
}));

export const listPublicPlans = asyncHandler(async (_req, res) => sendSuccess(res, {
  message: 'Public subscription plans retrieved.',
  data: await vendorSubscriptionService.listPublicPlans(),
}));

export const testPurchasePlan = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Test subscription purchase completed. Your plan is now active.',
  data: await vendorSubscriptionService.testPurchasePlan({ vendorUserId: req.user.id, planId: req.body.planId }),
}));
