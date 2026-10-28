import { ApiError } from '../../utils/ApiError.js';
import * as planRepo from '../../repositories/subscriptionPlan.repository.js';

const assertPlanRules = (plan) => {
  if (plan.kind === 'FREE') {
    if (plan.monthlyPrice !== 0) throw ApiError.badRequest('A FREE plan must have monthlyPrice set to 0.');
    if (plan.isPurchasable) throw ApiError.badRequest('A FREE plan cannot be purchasable.');
  }
  if (plan.kind === 'PAID') {
    if (plan.monthlyPrice < 1) throw ApiError.badRequest('A PAID plan must have a monthlyPrice greater than 0.');
    if (plan.isDefault) throw ApiError.badRequest('Only a FREE plan can be the default plan.');
    if (!plan.isPurchasable) throw ApiError.badRequest('A PAID plan must be purchasable.');
  }
  if (plan.isDefault && plan.kind !== 'FREE') {
    throw ApiError.badRequest('Only a FREE plan can be the default plan.');
  }
};

const requirePlan = async (planId) => {
  const plan = await planRepo.findById(planId);
  if (!plan) throw ApiError.notFound('Subscription plan not found.');
  return plan;
};

export const createPlan = async (payload) => {
  assertPlanRules(payload);
  try {
    return await planRepo.create(payload);
  } catch (error) {
    if (error.code === 'P2002') throw ApiError.conflict('A subscription plan with this code already exists.');
    throw error;
  }
};

export const listPlans = (query) => planRepo.listForAdmin(query);

export const getPlan = async (planId) => requirePlan(planId);

export const updatePlan = async ({ planId, payload }) => {
  const current = await requirePlan(planId);
  const next = { ...current, ...payload };
  assertPlanRules(next);
  try {
    return await planRepo.update({ id: planId, data: payload, clearOtherDefault: payload.isDefault === true });
  } catch (error) {
    if (error.code === 'P2002') throw ApiError.conflict('A subscription plan with this code already exists.');
    throw error;
  }
};

export const activatePlan = async (planId) => {
  const plan = await requirePlan(planId);
  assertPlanRules(plan);
  return planRepo.activate(planId);
};

export const deactivatePlan = async (planId) => {
  const plan = await requirePlan(planId);
  if (plan.isDefault) throw ApiError.conflict('The default Free plan cannot be deactivated. Select another default Free plan first.');
  return planRepo.deactivate(planId);
};

export const deletePlan = async (planId) => {
  const plan = await requirePlan(planId);
  if (plan.isDefault) throw ApiError.conflict('The default Free plan cannot be deleted.');
  if (plan.isActive) throw ApiError.conflict('Deactivate a subscription plan before deleting it.');
  return planRepo.remove(planId);
};
