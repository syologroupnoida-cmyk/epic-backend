import { ApiError } from '../../utils/ApiError.js';
import { env } from '../../config/env.js';
import * as subscriptionRepo from '../../repositories/vendorSubscription.repository.js';

const serializePlan = (plan) => ({
  id: plan.id,
  code: plan.code,
  kind: plan.kind,
  displayName: plan.displayName,
  shortDescription: plan.shortDescription,
  monthlyPrice: plan.monthlyPrice,
  directLeadPrice: plan.directLeadPrice,
  walletCreditPerBillingCycle: plan.walletCreditPerBillingCycle,
  limits: {
    maxActiveServiceListings: plan.maxActiveServiceListings,
    maxActiveVenueProperties: plan.maxActiveVenueProperties,
    maxDirectLeadPurchasesPerMonth: plan.maxDirectLeadPurchasesPerMonth,
    maxSharedLeadPurchasesPerMonth: plan.maxSharedLeadPurchasesPerMonth,
    maxMediaPerListing: plan.maxMediaPerListing,
    featuredListingSlots: plan.featuredListingSlots,
  },
  benefits: plan.benefits,
  badgeText: plan.badgeText,
  theme: plan.theme,
  ctaText: plan.ctaText,
  sortOrder: plan.sortOrder,
  isFeatured: plan.isFeatured,
  isDefault: plan.isDefault,
  isPurchasable: plan.isPurchasable,
});

export const getCardAction = ({ cardPlan, currentPlan }) => {
  if (cardPlan.id === currentPlan.id) return 'CURRENT_PLAN';
  if (cardPlan.kind === 'FREE') return 'DOWNGRADE_UNAVAILABLE';
  if (cardPlan.monthlyPrice > currentPlan.monthlyPrice) return 'UPGRADE';
  return 'DOWNGRADE_UNAVAILABLE';
};

export const getEffectiveSubscription = async (vendorUserId) => {
  const paidSubscription = await subscriptionRepo.findActivePaidSubscription(vendorUserId);
  if (paidSubscription) {
    return {
      source: 'PAID_SUBSCRIPTION',
      subscription: {
        id: paidSubscription.id,
        status: paidSubscription.status,
        amount: paidSubscription.amount,
        startedAt: paidSubscription.startedAt,
        endsAt: paidSubscription.endsAt,
        createdAt: paidSubscription.createdAt,
      },
      plan: paidSubscription.plan,
    };
  }

  const freePlan = await subscriptionRepo.findActiveDefaultPlan();
  if (!freePlan) {
    throw ApiError.conflict('No active default Free subscription plan is configured. Ask an administrator to activate one.');
  }
  return { source: 'DEFAULT_FREE_PLAN', subscription: null, plan: freePlan };
};

export const getMySubscription = async (vendorUserId) => {
  const effective = await getEffectiveSubscription(vendorUserId);
  return {
    source: effective.source,
    subscription: effective.subscription,
    plan: serializePlan(effective.plan),
  };
};

export const listAvailablePlans = async (vendorUserId) => {
  const [effective, activePlans] = await Promise.all([
    getEffectiveSubscription(vendorUserId),
    subscriptionRepo.listActivePlans(),
  ]);

  return {
    currentPlanId: effective.plan.id,
    currentPlanSource: effective.source,
    plans: activePlans.map((plan) => ({
      plan: serializePlan(plan),
      cardAction: getCardAction({ cardPlan: plan, currentPlan: effective.plan }),
      isCurrentPlan: plan.id === effective.plan.id,
    })),
  };
};

export const testPurchasePlan = async ({ vendorUserId, planId }) => {
  if (env.PAYMENTS_MODE !== 'TEST') {
    throw ApiError.forbidden('Test subscription purchase is disabled. Use the payment gateway checkout flow.');
  }

  const plan = await subscriptionRepo.findActivePurchasablePaidPlan(planId);
  if (!plan) throw ApiError.notFound('Active purchasable paid subscription plan not found.');

  const { subscription, wallet } = await subscriptionRepo.activateTestSubscription({ vendorUserId, plan });
  return {
    paymentMode: 'TEST',
    subscription: {
      id: subscription.id,
      status: subscription.status,
      amount: subscription.amount,
      startedAt: subscription.startedAt,
      endsAt: subscription.endsAt,
      plan: serializePlan(subscription.plan),
    },
    wallet: {
      balance: wallet.balance,
      creditedAmount: plan.walletCreditPerBillingCycle,
    },
  };
};
