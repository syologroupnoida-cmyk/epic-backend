import test from 'node:test';
import assert from 'node:assert/strict';
import {
  publicVendorListQuerySchema,
  publicVendorSlugSchema,
  updateVendorProfileSchema,
} from '../src/validators/vendorProfile.validator.js';
import {
  buildVendorProfileSlug,
  serializePublicVendorProfile,
} from '../src/services/vendorProfile/index.js';

test('vendor profile patch accepts only editable public fields', () => {
  const result = updateVendorProfileSchema.safeParse({
    businessName: 'Royal Events',
    about: 'Wedding planning across Delhi NCR.',
    primaryCityId: 'city-delhi',
    profileStatus: 'ACTIVE',
  });
  assert.equal(result.success, true);
  assert.equal(updateVendorProfileSchema.safeParse({}).success, false);
  assert.equal(updateVendorProfileSchema.safeParse({ primaryCityId: '' }).success, false);
  assert.equal(updateVendorProfileSchema.safeParse({ kycStatus: 'APPROVED' }).success, false);
  assert.equal(updateVendorProfileSchema.safeParse({ profileStatus: 'SUSPENDED' }).success, false);
});

test('vendor profile patch supports clearing optional public fields', () => {
  const parsed = updateVendorProfileSchema.parse({
    about: null,
    logoUrl: null,
    logoPublicId: null,
    primaryCityId: null,
  });
  assert.equal(parsed.about, null);
  assert.equal(parsed.primaryCityId, null);
});

test('vendor profile logo URL and public ID must be updated together', () => {
  assert.equal(updateVendorProfileSchema.safeParse({
    logoUrl: 'https://res.cloudinary.com/demo/image/upload/logo.png',
  }).success, false);
  assert.equal(updateVendorProfileSchema.safeParse({
    logoPublicId: 'epic-wedplanner/company-logo/VEND-123456/company-logo',
  }).success, false);
  assert.equal(updateVendorProfileSchema.safeParse({
    logoUrl: null,
    logoPublicId: null,
  }).success, true);
});

test('public vendor slug validation rejects non-canonical paths', () => {
  assert.equal(publicVendorSlugSchema.safeParse({ slug: 'royal-events-delhi' }).success, true);
  assert.equal(publicVendorSlugSchema.safeParse({ slug: 'Royal Events' }).success, false);
  assert.equal(publicVendorSlugSchema.safeParse({ slug: '../vendor' }).success, false);
});

test('public vendor list query applies pagination defaults', () => {
  const parsed = publicVendorListQuerySchema.parse({});

  assert.equal(parsed.page, 1);
  assert.equal(parsed.limit, 20);
  assert.deepEqual(Object.keys(parsed).sort(), ['limit', 'page']);
});

test('public vendor list query parses pagination and supported filters', () => {
  const parsed = publicVendorListQuerySchema.parse({
    page: '3',
    limit: '25',
    search: '  royal events  ',
    cityId: '  city-delhi  ',
    serviceCategoryId: '  cat-planning  ',
    serviceSubcategoryId: '  sub-full-planning  ',
    offeringKind: 'VENUE_PROPERTY',
  });

  assert.deepEqual(parsed, {
    page: 3,
    limit: 25,
    search: 'royal events',
    cityId: 'city-delhi',
    serviceCategoryId: 'cat-planning',
    serviceSubcategoryId: 'sub-full-planning',
    offeringKind: 'VENUE_PROPERTY',
  });
});

test('public vendor list query rejects invalid pagination and filters', () => {
  const invalidQueries = [
    { page: '0' },
    { page: '1.5' },
    { limit: '0' },
    { limit: '101' },
    { search: '   ' },
    { cityId: '   ' },
    { serviceCategoryId: '' },
    { serviceSubcategoryId: '' },
    { offeringKind: 'PACKAGE' },
    { unknownFilter: 'value' },
  ];

  for (const query of invalidQueries) {
    assert.equal(
      publicVendorListQuerySchema.safeParse(query).success,
      false,
      `Expected query to be rejected: ${JSON.stringify(query)}`,
    );
  }
});

test('vendor profile slug is deterministic and vendor-specific', () => {
  assert.equal(
    buildVendorProfileSlug({ businessName: 'Royal Events!', vendorUserId: 'VEND-123456' }),
    'royal-events-vend-123456',
  );
});

test('public vendor serializer explicitly omits private KYC and contact data', () => {
  const serialized = serializePublicVendorProfile({
    userId: 'VEND-123456',
    businessName: 'Royal Events',
    slug: 'royal-events-vend-123456',
    about: 'Full-service wedding planning.',
    logoUrl: 'https://example.com/logo.png',
    logoPublicId: 'private-management-id',
    kyc: { pan: 'ABCDE1234F' },
    documents: [{ documentUrl: 'https://example.com/private-pan.png' }],
    user: { email: 'vendor@example.com', phone: '9999999999' },
    primaryCity: {
      id: 'city-delhi',
      name: 'Delhi',
      slug: 'delhi',
      stateName: 'Delhi',
      countryCode: 'IN',
      isActive: true,
    },
    capabilities: [{
      reviewedByAdminId: 'ADMIN-000001',
      subcategory: {
        id: 'sub-planning',
        name: 'Full Wedding Planning',
        slug: 'full-wedding-planning',
        description: 'End-to-end planning.',
        serviceCategory: {
          id: 'cat-planning',
          name: 'Wedding Planning',
          slug: 'wedding-planning',
          description: 'Planning services.',
          offeringKind: 'SERVICE',
        },
      },
    }],
  });

  assert.deepEqual(Object.keys(serialized), [
    'vendorId',
    'businessName',
    'slug',
    'about',
    'logoUrl',
    'primaryCity',
    'services',
  ]);
  assert.equal(JSON.stringify(serialized).includes('ABCDE1234F'), false);
  assert.equal(JSON.stringify(serialized).includes('vendor@example.com'), false);
  assert.equal(JSON.stringify(serialized).includes('private-management-id'), false);
  assert.equal(JSON.stringify(serialized).includes('ADMIN-000001'), false);
  assert.equal(serialized.vendorId, 'VEND-123456');
  assert.equal(serialized.services[0].category.name, 'Wedding Planning');
});
