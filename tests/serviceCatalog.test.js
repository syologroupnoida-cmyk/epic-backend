import test from 'node:test';
import assert from 'node:assert/strict';
import { createCategoryPayloadSchema, createSubcategoryPayloadSchema, updateCategorySchema, listCatalogSchema, listSubcategoriesSchema } from '../src/validators/serviceCatalog.validator.js';

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

test('category update accepts one category body without an id', () => {
  const result = updateCategorySchema.safeParse({
    name: 'Photography and Films',
    description: 'Updated photography services',
  });
  assert.equal(result.success, true);
});

test('category update rejects nested subcategories', () => {
  assert.equal(updateCategorySchema.safeParse({
    subcategories: [{ id: 'subcategory-1', name: 'Candid Photography' }],
  }).success, false);
});

test('catalog GET queries accept search and exact filters', () => {
  const categories = listCatalogSchema.parse({ page: '1', limit: '20', search: 'photo', slug: 'photography' });
  assert.equal(categories.page, 1);
  assert.equal(categories.search, 'photo');
  assert.equal(categories.slug, 'photography');

  const subcategories = listSubcategoriesSchema.parse({
    serviceCategoryId: 'category-1',
    search: 'candid',
    id: 'subcategory-1',
  });
  assert.equal(subcategories.serviceCategoryId, 'category-1');
  assert.equal(subcategories.id, 'subcategory-1');
});

test('subcategory creation accepts multiple items for one category', () => {
  const result = createSubcategoryPayloadSchema.safeParse({
    serviceCategoryId: 'category-1',
    subcategories: [
      { name: 'Candid Photography' },
      { name: 'Traditional Photography' },
    ],
  });
  assert.equal(result.success, true);
  assert.equal(result.data.subcategories.length, 2);
});

test('subcategory creation rejects duplicate names in one request', () => {
  const result = createSubcategoryPayloadSchema.safeParse({
    serviceCategoryId: 'category-1',
    subcategories: [{ name: 'Candid' }, { name: 'candid' }],
  });
  assert.equal(result.success, false);
});
