import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adminListingListQuerySchema,
  adminListingRevisionListQuerySchema,
  createServiceListingSchema,
  pauseListingSchema,
  publicListingListQuerySchema,
  updateServiceListingSchema,
  vendorListingListQuerySchema,
} from '../src/validators/listing.validator.js';

const listing = {
  title: '  Complete Wedding Planning Package  ',
  description: 'Planning, coordination, and guest support for a complete wedding celebration.',
  startingPrice: '150000',
  priceType: 'STARTING_FROM',
  cityId: ' city-delhi ',
  serviceAreaCityIds: [' city-delhi ', ' city-noida '],
  metadata: { teamSize: 5 },
  services: [{ serviceSubcategoryId: ' sub-planning ', price: '150000' }],
  media: [],
};

test('service listing creation accepts a structured multi-service payload', () => {
  const parsed = createServiceListingSchema.parse({
    ...listing,
    services: [
      { serviceSubcategoryId: 'sub-planning', price: 150000 },
      { serviceSubcategoryId: 'sub-coordination', metadata: { durationDays: 2 } },
    ],
  });

  assert.equal(parsed.title, 'Complete Wedding Planning Package');
  assert.equal(parsed.startingPrice, 150000);
  assert.equal(parsed.cityId, 'city-delhi');
  assert.deepEqual(parsed.serviceAreaCityIds, ['city-delhi', 'city-noida']);
  assert.equal(parsed.services.length, 2);
  assert.equal(parsed.submitForReview, false);
  assert.equal(createServiceListingSchema.parse({ ...listing, submitForReview: true }).submitForReview, true);
});

test('service listing service areas must be unique and include the primary city', () => {
  assert.equal(createServiceListingSchema.safeParse({
    ...listing,
    serviceAreaCityIds: ['city-noida'],
  }).success, false);
  assert.equal(createServiceListingSchema.safeParse({
    ...listing,
    serviceAreaCityIds: ['city-delhi', 'city-delhi'],
  }).success, false);
});

test('service listing creation rejects duplicate or missing service components', () => {
  assert.equal(createServiceListingSchema.safeParse({
    ...listing,
    services: [
      { serviceSubcategoryId: 'sub-planning' },
      { serviceSubcategoryId: 'sub-planning' },
    ],
  }).success, false);
  assert.equal(createServiceListingSchema.safeParse({ ...listing, services: [] }).success, false);
});

test('service listing patch requires at least one writable field', () => {
  assert.equal(updateServiceListingSchema.safeParse({}).success, false);
  assert.equal(updateServiceListingSchema.safeParse({ startingPrice: '180000' }).data.startingPrice, 180000);
});

test('public listing query validates pagination and filters', () => {
  assert.deepEqual(publicListingListQuerySchema.parse({}), { page: 1, limit: 20 });
  assert.deepEqual(publicListingListQuerySchema.parse({
    page: '2', limit: '10', search: '  planning ', cityId: ' city-delhi ', serviceSubcategoryId: ' sub-planning ',
  }), {
    page: 2,
    limit: 10,
    search: 'planning',
    cityId: 'city-delhi',
    serviceSubcategoryId: 'sub-planning',
  });
});

test('vendor and admin listing filters accept archived status', () => {
  assert.equal(vendorListingListQuerySchema.parse({ status: 'ARCHIVED' }).status, 'ARCHIVED');
  assert.equal(adminListingListQuerySchema.parse({ status: 'ARCHIVED' }).status, 'ARCHIVED');
});

test('admin listing revision filters parse status and identifiers', () => {
  assert.deepEqual(adminListingRevisionListQuerySchema.parse({
    status: 'PENDING_REVIEW',
    listingId: ' listing-1 ',
    vendorUserId: ' vendor-1 ',
  }), {
    page: 1,
    limit: 20,
    status: 'PENDING_REVIEW',
    listingId: 'listing-1',
    vendorUserId: 'vendor-1',
  });
});

test('listing pause requires a clear reason', () => {
  assert.equal(pauseListingSchema.safeParse({ reason: 'bad' }).success, false);
  assert.equal(
    pauseListingSchema.parse({ reason: '  The vendor needs to correct the price information.  ' }).reason,
    'The vendor needs to correct the price information.',
  );
});
