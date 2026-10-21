import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createVenuePropertySchema,
  publicVenuePropertyListQuerySchema,
} from '../src/validators/venueProperty.validator.js';

const property = {
  title: 'Royal Palace Banquet and Lawn',
  description: 'A banquet hall and landscaped wedding lawn for celebrations of all sizes.',
  startingPrice: '250000',
  cityId: 'city-delhi',
  address: { street: '12 Palace Road', locality: 'Civil Lines', state: 'Delhi', pincode: '110054' },
  capacityMin: '100',
  capacityMax: '1200',
  rooms: 18,
  parkingCapacity: 200,
  amenities: ['Parking', 'Bridal room'],
  venueTypes: ['sub-banquet-hall', 'sub-wedding-lawn'],
  media: [],
};

test('venue property accepts multiple venue subcategories for one physical property', () => {
  const parsed = createVenuePropertySchema.parse(property);
  assert.deepEqual(parsed.venueTypes, ['sub-banquet-hall', 'sub-wedding-lawn']);
  assert.equal(parsed.capacityMax, 1200);
  assert.equal(parsed.submitForReview, false);
});

test('venue property rejects an invalid capacity range or duplicate venue type', () => {
  assert.equal(createVenuePropertySchema.safeParse({ ...property, capacityMax: 50 }).success, false);
  assert.equal(createVenuePropertySchema.safeParse({ ...property, venueTypes: ['sub-banquet-hall', 'sub-banquet-hall'] }).success, false);
});

test('public venue property filters validate supported fields', () => {
  assert.deepEqual(publicVenuePropertyListQuerySchema.parse({ cityId: 'city-delhi', serviceSubcategoryId: 'sub-banquet-hall' }), {
    page: 1, limit: 20, cityId: 'city-delhi', serviceSubcategoryId: 'sub-banquet-hall',
  });
});
