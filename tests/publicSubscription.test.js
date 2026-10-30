import test from 'node:test';
import assert from 'node:assert/strict';
import { serializePlan } from '../src/services/vendorSubscription/index.js';

test('public subscription card serializer returns pricing and limits without vendor state', () => {
  const plan = serializePlan({
    id: 'plan-basic', code: 'BASIC', kind: 'PAID', displayName: 'Basic', shortDescription: 'Start growing',
    monthlyPrice: 200, directLeadPrice: 100, walletCreditPerBillingCycle: 0,
    maxActiveServiceListings: 10, maxActiveVenueProperties: 10, maxDirectLeadPurchasesPerMonth: 20,
    maxSharedLeadPurchasesPerMonth: 10, maxMediaPerListing: 10, featuredListingSlots: 5,
    benefits: ['More listings'], badgeText: 'Popular', theme: 'PURPLE', ctaText: 'Buy Now',
    sortOrder: 1, isFeatured: true, isDefault: false, isPurchasable: true,
  });
  assert.equal(plan.monthlyPrice, 200);
  assert.equal(plan.limits.maxActiveServiceListings, 10);
  assert.equal('currentPlanId' in plan, false);
});
