import test from 'node:test';
import assert from 'node:assert/strict';
import { submitKycSchema, documentNumberSchemas } from '../src/validators/vendorKyc.validator.js';

const form = {
  servicecategoriesIds: ['category-1', 'category-2'],
  servicesSubCategoryIds: ['subcategory-1', 'subcategory-2'],
  companyName: 'Asha Events',
  contactPerson: 'Asha Sharma',
  businessAddress: { street: '123 Main Street', locality: 'Andheri West', state: 'Maharashtra', pincode: '400053' },
  logoName: 'EPIC final.jpg.jpeg',
  description: 'Wedding services vendor',
  socialLinks: { facebook: '#', instagram: 'E' },
  verified: { aadhaar: true, pan: true, cin: true, gst: true },
  source: ['Epic Wedz Team'],
  sourceNote: '',
};

test('final KYC form accepts the expanded company profile', () => {
  assert.equal(submitKycSchema.safeParse(form).success, true);
  assert.equal(submitKycSchema.safeParse({ ...form, email: 'vendor@example.com' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, password: 'Secret123' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, panNumber: 'ABCDE1234F' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, servicecategoriesIds: [] }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, servicesSubCategoryIds: [] }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, servicecategoriesIds: ['category-1', 'category-1'] }).success, false);
});

test('KYC form normalizes public category field names', () => {
  const parsed = submitKycSchema.parse(form);
  assert.deepEqual(parsed.serviceCategoryIds, form.servicecategoriesIds);
  assert.deepEqual(parsed.serviceSubcategoryIds, form.servicesSubCategoryIds);
  assert.equal('servicecategoriesIds' in parsed, false);
  assert.equal('servicesSubCategoryIds' in parsed, false);
});

test('document number endpoints validate each number independently', () => {
  assert.equal(documentNumberSchemas.PAN.safeParse({ number: 'abcde1234f' }).data.number, 'ABCDE1234F');
  assert.equal(documentNumberSchemas.PAN.safeParse({ number: 'BAD' }).success, false);
  assert.equal(documentNumberSchemas.AADHAR.safeParse({ number: '123456789012' }).success, true);
  assert.equal(documentNumberSchemas.AADHAR.safeParse({ number: '123' }).success, false);
  assert.equal(documentNumberSchemas.GSTIN.safeParse({ number: '27ABCDE1234F1Z5' }).success, true);
});
