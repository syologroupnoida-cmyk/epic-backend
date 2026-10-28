import test from 'node:test';
import assert from 'node:assert/strict';
import { walletTransactionListQuerySchema } from '../src/validators/wallet.validator.js';
import { testPurchaseSubscriptionSchema } from '../src/validators/subscriptionPlan.validator.js';

test('wallet history and test purchase payload validate safely', () => {
  assert.deepEqual(walletTransactionListQuerySchema.parse({}), { page: 1, limit: 20 });
  assert.deepEqual(walletTransactionListQuerySchema.parse({ page: '2', limit: '10' }), { page: 2, limit: 10 });
  assert.equal(walletTransactionListQuerySchema.safeParse({ limit: 101 }).success, false);
  assert.equal(testPurchaseSubscriptionSchema.parse({ planId: ' plan-basic ' }).planId, 'plan-basic');
});
