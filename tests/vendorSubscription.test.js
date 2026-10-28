import test from 'node:test';
import assert from 'node:assert/strict';
import { getCardAction } from '../src/services/vendorSubscription/index.js';

const free = { id: 'free', kind: 'FREE', monthlyPrice: 0 };
const basic = { id: 'basic', kind: 'PAID', monthlyPrice: 999 };
const premium = { id: 'premium', kind: 'PAID', monthlyPrice: 2499 };

test('vendor subscription cards calculate safe current and upgrade actions', () => {
  assert.equal(getCardAction({ cardPlan: free, currentPlan: free }), 'CURRENT_PLAN');
  assert.equal(getCardAction({ cardPlan: basic, currentPlan: free }), 'UPGRADE');
  assert.equal(getCardAction({ cardPlan: premium, currentPlan: basic }), 'UPGRADE');
  assert.equal(getCardAction({ cardPlan: free, currentPlan: basic }), 'DOWNGRADE_UNAVAILABLE');
});
