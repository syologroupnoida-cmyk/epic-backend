import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminSubscriptionPlanListQuerySchema,
  createSubscriptionPlanSchema,
  updateSubscriptionPlanSchema,
} from '../src/validators/subscriptionPlan.validator.js';

const freePlan = {
  code: 'FREE',
  kind: 'FREE',
  displayName: 'Free',
  shortDescription: 'For vendors starting their marketplace journey.',
  monthlyPrice: 0,
  directLeadPrice: 100,
  walletCreditPerBillingCycle: 0,
  maxActiveServiceListings: 1,
  maxActiveVenueProperties: 0,
  maxDirectLeadPurchasesPerMonth: 5,
  maxSharedLeadPurchasesPerMonth: 2,
  maxMediaPerListing: 5,
  featuredListingSlots: 0,
  benefits: ['One active service listing', 'Direct leads at standard price'],
  ctaText: 'Current Plan',
  isDefault: true,
  isPurchasable: false,
};

test('subscription plan creation normalizes card configuration', () => {
  const parsed = createSubscriptionPlanSchema.parse(freePlan);
  assert.equal(parsed.code, 'FREE');
  assert.equal(parsed.theme, 'BLUE');
  assert.equal(parsed.isActive, false);
  assert.equal(parsed.isPurchasable, false);
});

test('subscription plan validation rejects invalid card codes and duplicate benefits', () => {
  assert.equal(createSubscriptionPlanSchema.safeParse({ ...freePlan, code: 'free plan' }).success, false);
  assert.equal(createSubscriptionPlanSchema.safeParse({ ...freePlan, benefits: ['Lead price', 'lead price'] }).success, false);
});

test('subscription plan patch and list filters validate correctly', () => {
  assert.deepEqual(updateSubscriptionPlanSchema.parse({ monthlyPrice: '999', theme: 'PURPLE' }), {
    monthlyPrice: 999,
    theme: 'PURPLE',
  });
  assert.equal(updateSubscriptionPlanSchema.safeParse({}).success, false);
  assert.deepEqual(adminSubscriptionPlanListQuerySchema.parse({ isActive: 'true', kind: 'PAID' }), {
    isActive: true,
    kind: 'PAID',
  });
  assert.equal(adminSubscriptionPlanListQuerySchema.parse({ isActive: 'false' }).isActive, false);
});
