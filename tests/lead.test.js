import test from 'node:test';
import assert from 'node:assert/strict';
import {
  directEnquirySchema,
  leadIdParamsSchema,
  activateSharedLeadSchema,
  adminLeadListQuerySchema,
  closeLeadSchema,
  rejectLeadSchema,
  sharedLeadSchema,
  vendorLeadListQuerySchema,
} from '../src/validators/lead.validator.js';

test('direct enquiry accepts the short public customer form', () => {
  const parsed = directEnquirySchema.parse({
    customerName: '  Rahul Sharma  ',
    customerPhone: '9876543210',
    eventDate: '2027-02-10',
    guestCount: '250',
    message: '  Need wedding planning support.  ',
  });
  assert.equal(parsed.customerName, 'Rahul Sharma');
  assert.equal(parsed.customerPhone, '9876543210');
  assert.equal(parsed.guestCount, 250);
  assert.ok(parsed.eventDate instanceof Date);
});

test('direct enquiry rejects invalid phone numbers and unknown writable fields', () => {
  assert.equal(directEnquirySchema.safeParse({ customerName: 'Rahul', customerPhone: '123' }).success, false);
  assert.equal(directEnquirySchema.safeParse({ customerName: 'Rahul', customerPhone: '9876543210', targetVendorUserId: 'VEND-1' }).success, false);
});

test('shared lead requires city and selected service, and validates budget range', () => {
  const parsed = sharedLeadSchema.parse({
    customerName: 'Rahul Sharma',
    customerPhone: '9876543210',
    cityId: ' city-mumbai ',
    serviceSubcategoryId: ' sub-wedding-planning ',
    budgetMin: '100000',
    budgetMax: '500000',
  });
  assert.equal(parsed.cityId, 'city-mumbai');
  assert.equal(parsed.serviceSubcategoryId, 'sub-wedding-planning');
  assert.equal(parsed.budgetMin, 100000);
  assert.equal(sharedLeadSchema.safeParse({ ...parsed, budgetMin: 500000, budgetMax: 100000 }).success, false);
});

test('vendor lead inbox query and lead ID validation use safe pagination', () => {
  assert.deepEqual(vendorLeadListQuerySchema.parse({}), { page: 1, limit: 20 });
  assert.deepEqual(vendorLeadListQuerySchema.parse({ page: '2', limit: '10' }), { page: 2, limit: 10 });
  assert.equal(vendorLeadListQuerySchema.safeParse({ limit: 101 }).success, false);
  assert.equal(leadIdParamsSchema.parse({ leadId: ' lead-123 ' }).leadId, 'lead-123');
});

test('admin lead review validates price, buyer slots, filters, and reasons', () => {
  assert.deepEqual(adminLeadListQuerySchema.parse({ status: 'PENDING_REVIEW', leadType: 'SHARED' }), {
    page: 1,
    limit: 20,
    status: 'PENDING_REVIEW',
    leadType: 'SHARED',
  });
  assert.deepEqual(activateSharedLeadSchema.parse({ basePrice: '100', maxBuyerCount: '5' }), {
    basePrice: 100,
    maxBuyerCount: 5,
  });
  assert.equal(activateSharedLeadSchema.safeParse({ basePrice: 100, maxBuyerCount: 0 }).success, false);
  assert.equal(rejectLeadSchema.safeParse({ reason: 'bad' }).success, false);
  assert.equal(closeLeadSchema.safeParse({ reason: 'Customer cancelled the requirement.' }).success, true);
});
