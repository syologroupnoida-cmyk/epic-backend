import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminContactMessageListQuerySchema,
  createContactMessageSchema,
  updateContactMessageSchema,
} from '../src/validators/contactMessage.validator.js';

test('public contact form accepts client or vendor message without authentication fields', () => {
  const parsed = createContactMessageSchema.parse({
    name: ' Rahul Sharma ',
    email: 'rahul@example.com',
    userType: 'CLIENT',
    subject: ' Need help ',
    message: ' I need help choosing a wedding photographer. ',
    website: '',
  });
  assert.equal(parsed.name, 'Rahul Sharma');
  assert.equal(parsed.userType, 'CLIENT');
  assert.equal(parsed.website, '');
});

test('public contact form requires email or mobile and rejects filled honeypot', () => {
  const base = { name: 'Rahul Sharma', subject: 'Need help', message: 'Please help me with a vendor enquiry.' };
  assert.equal(createContactMessageSchema.safeParse(base).success, false);
  assert.equal(createContactMessageSchema.safeParse({ ...base, phone: '9876543210', website: 'spam.example' }).success, false);
});

test('admin contact filters and updates validate safely', () => {
  assert.deepEqual(adminContactMessageListQuerySchema.parse({ status: 'NEW', userType: 'VENDOR' }), {
    page: 1, limit: 20, status: 'NEW', userType: 'VENDOR',
  });
  assert.deepEqual(updateContactMessageSchema.parse({ status: 'RESOLVED', adminNote: 'Issue resolved by phone.' }), {
    status: 'RESOLVED', adminNote: 'Issue resolved by phone.',
  });
  assert.equal(updateContactMessageSchema.safeParse({}).success, false);
});
