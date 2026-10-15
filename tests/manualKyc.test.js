import test from 'node:test';
import assert from 'node:assert/strict';
import { submitKycSchema, documentNumberSchemas } from '../src/validators/vendorKyc.validator.js';
import { buildDocumentValidationResult } from '../src/services/vendorKyc/index.js';

const form = {
  servicecategoriesIds: ['category-1', 'category-2'],
  servicesSubCategoryIds: ['subcategory-1', 'subcategory-2'],
  companyName: 'Asha Events',
  contactPerson: 'Asha Sharma',
  primaryCityId: 'city-mumbai',
  businessAddress: {
    street: '123 Main Street',
    locality: 'Andheri West',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400053',
    countryCode: 'IN',
  },
  description: 'Wedding services vendor',
  socialLinks: { facebook: '#', instagram: 'E' },
  verified: { aadhaar: true, pan: true, cin: true, gst: true },
  documents: {
    pan: {
      number: 'ABCDE1234F',
      url: 'https://res.cloudinary.com/demo/image/upload/pan.jpg',
      publicId: 'epic-wedplanner/kyc-pan/vendor-1/pan-card',
    },
    aadhaar: {
      number: '123456789012',
      url: 'https://res.cloudinary.com/demo/image/upload/aadhaar.jpg',
      publicId: 'epic-wedplanner/kyc-aadhaar/vendor-1/aadhaar-card',
    },
  },
  source: ['Epic Wedz Team'],
  sourceNote: '',
};

test('final KYC form accepts the expanded company profile', () => {
  assert.equal(submitKycSchema.safeParse(form).success, true);
  assert.equal(submitKycSchema.safeParse({ ...form, email: 'vendor@example.com' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, password: 'Secret123' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, panNumber: 'ABCDE1234F' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, logoName: 'old-logo.png' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, servicecategoriesIds: [] }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, servicesSubCategoryIds: [] }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, servicecategoriesIds: ['category-1', 'category-1'] }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, primaryCityId: undefined }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, primaryCityId: '   ' }).success, false);
  assert.equal(submitKycSchema.safeParse({ ...form, primaryOperatingCity: 'Mumbai' }).success, false);
  assert.equal(submitKycSchema.safeParse({
    ...form,
    businessAddress: { ...form.businessAddress, city: undefined },
  }).success, false);
  assert.equal(submitKycSchema.safeParse({
    ...form,
    businessAddress: { ...form.businessAddress, city: '   ' },
  }).success, false);
  assert.equal(submitKycSchema.safeParse({
    ...form,
    businessAddress: { ...form.businessAddress, countryCode: undefined },
  }).success, false);
  assert.equal(submitKycSchema.safeParse({
    ...form,
    businessAddress: { ...form.businessAddress, countryCode: 'IND' },
  }).success, false);
  assert.equal(submitKycSchema.safeParse({
    ...form,
    businessAddress: { ...form.businessAddress, countryCode: 'US' },
  }).success, false);
});

test('KYC form normalizes public category field names', () => {
  const parsed = submitKycSchema.parse(form);
  assert.deepEqual(parsed.serviceCategoryIds, form.servicecategoriesIds);
  assert.deepEqual(parsed.serviceSubcategoryIds, form.servicesSubCategoryIds);
  assert.equal(parsed.primaryCityId, form.primaryCityId);
  assert.equal(parsed.businessAddress.city, form.businessAddress.city);
  assert.equal(parsed.businessAddress.countryCode, 'IN');
  assert.equal('servicecategoriesIds' in parsed, false);
  assert.equal('servicesSubCategoryIds' in parsed, false);
});

test('KYC form normalizes the supported country code', () => {
  const parsed = submitKycSchema.parse({
    ...form,
    businessAddress: { ...form.businessAddress, countryCode: ' in ' },
  });

  assert.equal(parsed.businessAddress.countryCode, 'IN');
});

test('final KYC submission requires valid PAN and Aadhaar document data', () => {
  assert.equal(submitKycSchema.safeParse({ ...form, documents: undefined }).success, false);
  assert.equal(submitKycSchema.safeParse({
    ...form,
    documents: { ...form.documents, pan: { ...form.documents.pan, number: 'BAD' } },
  }).success, false);
  assert.equal(submitKycSchema.safeParse({
    ...form,
    documents: { pan: form.documents.pan },
  }).success, false);
});

test('final KYC document numbers validate independently', () => {
  assert.equal(documentNumberSchemas.PAN.safeParse({ number: 'abcde1234f' }).data.number, 'ABCDE1234F');
  assert.equal(documentNumberSchemas.PAN.safeParse({ number: 'BAD' }).success, false);
  assert.equal(documentNumberSchemas.AADHAR.safeParse({ number: '123456789012' }).success, true);
  assert.equal(documentNumberSchemas.AADHAR.safeParse({ number: '123' }).success, false);
  assert.equal(documentNumberSchemas.GSTIN.safeParse({ number: '27ABCDE1234F1Z5' }).success, true);
});

test('document validation result masks Aadhaar and does not represent persistence', () => {
  assert.deepEqual(buildDocumentValidationResult({ type: 'PAN', number: 'ABCDE1234F' }), {
    type: 'PAN', valid: true, normalizedNumber: 'ABCDE1234F',
  });
  assert.deepEqual(buildDocumentValidationResult({ type: 'AADHAR', number: '123456789012' }), {
    type: 'AADHAR', valid: true, normalizedNumber: 'XXXXXXXX9012',
  });
});
