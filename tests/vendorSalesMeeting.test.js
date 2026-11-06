import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminSalesMeetingListQuerySchema,
  createVendorSalesMeetingSchema,
  reviewVendorSalesMeetingSchema,
  vendorSalesMeetingListQuerySchema,
} from '../src/validators/vendorSalesMeeting.validator.js';

const futureStart = new Date(Date.now() + 24 * 60 * 60 * 1000);
const futureEnd = new Date(futureStart.getTime() + 30 * 60 * 1000);

test('vendor can request a future sales meeting with preferred time', () => {
  const parsed = createVendorSalesMeetingSchema.parse({
    requestedStartAt: futureStart.toISOString(),
    requestedEndAt: futureEnd.toISOString(),
    vendorNote: 'Please explain the subscription plans.',
  });
  assert.ok(parsed.requestedStartAt instanceof Date);
  assert.ok(parsed.requestedEndAt instanceof Date);
});

test('sales meeting request rejects past or invalid time range', () => {
  assert.equal(createVendorSalesMeetingSchema.safeParse({
    requestedStartAt: futureEnd.toISOString(),
    requestedEndAt: futureStart.toISOString(),
  }).success, false);
  assert.equal(createVendorSalesMeetingSchema.safeParse({
    requestedStartAt: '2020-01-01T10:00:00.000Z',
    requestedEndAt: '2020-01-01T10:30:00.000Z',
  }).success, false);
});

test('admin confirmation requires a schedule while rejection requires a vendor message', () => {
  assert.equal(reviewVendorSalesMeetingSchema.safeParse({ status: 'CONFIRMED' }).success, false);
  assert.equal(reviewVendorSalesMeetingSchema.safeParse({ status: 'REJECTED' }).success, false);
  assert.equal(reviewVendorSalesMeetingSchema.safeParse({
    status: 'CONFIRMED',
    scheduledStartAt: futureStart.toISOString(),
    scheduledEndAt: futureEnd.toISOString(),
  }).success, true);
  assert.equal(reviewVendorSalesMeetingSchema.safeParse({
    status: 'CONFIRMED',
    scheduledStartAt: futureStart.toISOString(),
    scheduledEndAt: futureEnd.toISOString(),
    meetingUrl: 'https://meet.google.com/abc-defg-hij',
  }).success, false);
});

test('sales meeting list queries safely filter by status', () => {
  assert.deepEqual(vendorSalesMeetingListQuerySchema.parse({ status: 'PENDING' }), { page: 1, limit: 20, status: 'PENDING' });
  assert.deepEqual(adminSalesMeetingListQuerySchema.parse({ status: 'CONFIRMED', vendorUserId: 'VEND-123456' }), {
    page: 1, limit: 20, status: 'CONFIRMED', vendorUserId: 'VEND-123456',
  });
});
