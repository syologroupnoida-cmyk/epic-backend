import test from 'node:test';
import assert from 'node:assert/strict';
import { createCategoryPayloadSchema, updateCategoriesPayloadSchema } from '../src/validators/serviceCatalog.validator.js';

test('category creation accepts one category without subcategories', () => {
  const result = createCategoryPayloadSchema.safeParse({
    name: 'Photography',
  });
  assert.equal(result.success, true);
});

test('category creation accepts multiple categories', () => {
  const result = createCategoryPayloadSchema.safeParse([
    { name: 'Photography' },
    { name: 'Transport' },
  ]);
  assert.equal(result.success, true);
  assert.equal(result.data.length, 2);
});

test('category creation rejects nested subcategories', () => {
  const result = createCategoryPayloadSchema.safeParse([
    { name: 'Photography', subcategories: [{ name: 'Candid Photography' }] },
  ]);
  assert.equal(result.success, false);
});

test('category creation rejects duplicate names within a bulk request', () => {
  const result = createCategoryPayloadSchema.safeParse([
    { name: 'Photography' },
    { name: 'photography' },
  ]);
  assert.equal(result.success, false);
});

test('category update accepts one or many categories', () => {
  const result = updateCategoriesPayloadSchema.safeParse([
    {
      id: 'category-1',
      name: 'Photography and Films',
    },
    { id: 'category-2', description: 'Updated transport services' },
  ]);
  assert.equal(result.success, true);
  assert.equal(result.data.length, 2);
});

test('category update rejects nested subcategories', () => {
  assert.equal(updateCategoriesPayloadSchema.safeParse([{
    id: 'category-1',
    subcategories: [{ id: 'subcategory-1', name: 'Candid Photography' }],
  }]).success, false);
});

test('category update rejects an empty update item', () => {
  assert.equal(updateCategoriesPayloadSchema.safeParse([{ id: 'category-1' }]).success, false);
});
