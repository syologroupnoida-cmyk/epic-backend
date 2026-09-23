import test from 'node:test';
import assert from 'node:assert/strict';
import { submitKycSchema, documentNumberSchemas } from '../src/validators/vendorKyc.validator.js';

const form = {
  businessName: 'Asha Events', whatsappNumber: '919876543210', primaryOperatingCity: 'Mumbai',
  businessAddress: { street: '123 Main Street', locality: 'Andheri West', state: 'Maharashtra', pincode: '400053' },
};

test('final KYC form contains only details missing from registration', () => {
  assert.equal(submitKycSchema.safeParse(form).success, true);
  assert.equal(submitKycSchema.safeParse({ ...form, email: 'vendor@example.com' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, password: 'Secret123' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, panNumber: 'ABCDE1234F' }).success, false);
});

test('document number endpoints validate each number independently', () => {
  assert.equal(documentNumberSchemas.PAN.safeParse({ number: 'abcde1234f' }).data.number, 'ABCDE1234F');
  assert.equal(documentNumberSchemas.PAN.safeParse({ number: 'BAD' }).success, false);
  assert.equal(documentNumberSchemas.AADHAR.safeParse({ number: '123456789012' }).success, true);
  assert.equal(documentNumberSchemas.AADHAR.safeParse({ number: '123' }).success, false);
  assert.equal(documentNumberSchemas.GSTIN.safeParse({ number: '27ABCDE1234F1Z5' }).success, true);
});
