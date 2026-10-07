import test from 'node:test';
import assert from 'node:assert/strict';
import { createCategoryPayloadSchema, updateCategoriesPayloadSchema } from '../src/validators/serviceCatalog.validator.js';

test('category creation accepts one category with multiple subcategories', () => {
  const result = createCategoryPayloadSchema.safeParse({
    name: 'Photography',
    subcategories: [
      { name: 'Wedding Photography' },
      { name: 'Candid Photography' },
    ],
  });
  assert.equal(result.success, true);
  assert.equal(result.data.subcategories.length, 2);
});

test('category creation accepts multiple categories with nested subcategories', () => {
  const result = createCategoryPayloadSchema.safeParse([
    { name: 'Photography', subcategories: [{ name: 'Candid Photography' }] },
    { name: 'Transport', subcategories: [{ name: 'Wedding Cars' }] },
  ]);
  assert.equal(result.success, true);
  assert.equal(result.data.length, 2);
});

test('category creation rejects duplicate names within a bulk request', () => {
  const result = createCategoryPayloadSchema.safeParse([
    { name: 'Photography' },
    { name: 'photography' },
  ]);
  assert.equal(result.success, false);
});

test('category update accepts one or many categories with nested updates and additions', () => {
  const result = updateCategoriesPayloadSchema.safeParse([
    {
      id: 'category-1',
      name: 'Photography and Films',
      subcategories: [
        { id: 'subcategory-1', name: 'Candid Wedding Photography' },
        { name: 'Drone Photography' },
      ],
    },
    { id: 'category-2', description: 'Updated transport services' },
  ]);
  assert.equal(result.success, true);
  assert.equal(result.data.length, 2);
});

test('category update rejects an empty update item', () => {
  assert.equal(updateCategoriesPayloadSchema.safeParse([{ id: 'category-1' }]).success, false);
});
