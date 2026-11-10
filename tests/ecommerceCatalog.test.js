import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adjustEcommerceInventorySchema,
  createEcommerceProductSchema,
  ecommercePublicProductListQuerySchema,
} from '../src/validators/ecommerce.validator.js';

const product = {
  categoryId: 'cat-001', subcategoryId: 'subcat-001', title: 'Royal Bridal Lehenga', description: 'A detailed bridal lehenga product description.',
  optionDefinitions: [{ name: 'Color', values: ['Red', 'Maroon'] }, { name: 'Size', values: ['M', 'L'] }],
  variants: [{ sku: 'LEH-RED-M', optionValues: { Color: 'Red', Size: 'M' }, mrpAmountPaise: 1599000, saleAmountPaise: 1299000, initialStock: 5, isDefault: true }],
};

test('admin product accepts variants, flexible specifications, and paise prices', () => {
  const parsed = createEcommerceProductSchema.parse({ ...product, specifications: { fabric: 'Silk', blouseIncluded: true } });
  assert.equal(parsed.variants[0].initialStock, 5);
  assert.equal(parsed.variants[0].saleAmountPaise, 1299000);
});

test('product rejects an invalid price and duplicate SKU variants', () => {
  assert.equal(createEcommerceProductSchema.safeParse({ ...product, variants: [{ ...product.variants[0], saleAmountPaise: 1600000 }] }).success, false);
  assert.equal(createEcommerceProductSchema.safeParse({ ...product, variants: [product.variants[0], { ...product.variants[0], isDefault: false }] }).success, false);
});

test('inventory adjustment disallows zero and public catalogue query uses safe paging', () => {
  assert.equal(adjustEcommerceInventorySchema.safeParse({ quantity: 0, note: 'No stock change' }).success, false);
  assert.deepEqual(ecommercePublicProductListQuerySchema.parse({ featured: 'true' }), { page: 1, limit: 20, featured: true });
});
