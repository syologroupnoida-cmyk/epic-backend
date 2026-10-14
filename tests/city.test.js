import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createCitySchema,
  updateCitySchema,
  listCitiesSchema,
} from '../src/validators/city.validator.js';

test('city creation normalizes the country code', () => {
  const result = createCitySchema.parse({
    name: 'New Delhi',
    stateName: 'Delhi',
    countryCode: 'in',
  });
  assert.equal(result.countryCode, 'IN');
  assert.equal(result.isActive, true);
});

test('city creation rejects a non-alphabetic country code', () => {
  assert.equal(createCitySchema.safeParse({
    name: 'New Delhi',
    stateName: 'Delhi',
    countryCode: '12',
  }).success, false);
});

test('city update requires at least one field', () => {
  assert.equal(updateCitySchema.safeParse({}).success, false);
  assert.equal(updateCitySchema.safeParse({ isActive: false }).success, true);
});

test('city list query parses pagination and active filter', () => {
  const result = listCitiesSchema.parse({ page: '2', limit: '25', isActive: 'false' });
  assert.equal(result.page, 2);
  assert.equal(result.limit, 25);
  assert.equal(result.isActive, false);
});
