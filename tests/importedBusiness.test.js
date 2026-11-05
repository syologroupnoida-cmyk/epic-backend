import test from 'node:test';
import assert from 'node:assert/strict';
import { parseCsv } from '../src/utils/csv.js';
import { mapCsvRow } from '../src/services/importedBusiness/index.js';
import { PUBLIC_SELECT } from '../src/repositories/importedBusiness.repository.js';
import {
  adminImportedBusinessListQuerySchema,
  publicImportedBusinessListQuerySchema,
  updateImportedBusinessSchema,
} from '../src/validators/importedBusiness.validator.js';

test('CSV parser handles quoted commas and escaped quotes', () => {
  const rows = parseCsv(Buffer.from('Company name,Phone,Email 1,Address\r\n"Royal ""Grand""",9876543210,,"Sector 1, Noida"\r\n'));
  assert.equal(rows.length, 1);
  assert.equal(rows[0].values['Company name'], 'Royal "Grand"');
  assert.equal(rows[0].values.Address, 'Sector 1, Noida');
});

test('CSV row mapping normalizes phone, emails, rating, reviews, and CID', () => {
  const mapped = mapCsvRow({ rowNumber: 2, values: {
    'Company name': ' Kiran Decorators ', Phone: '09001495099', 'Email 1': 'HELLO@EXAMPLE.COM',
    'Email 2': '', 'Email 3': '', 'Rating count': '4.6', Review: '10',
    Cid: 'https://maps.google.com/?cid=10148625059575674202', Keyword: 'wedding decorator',
  } });
  assert.equal(mapped.businessName, 'Kiran Decorators');
  assert.equal(mapped.phone, '9001495099');
  assert.deepEqual(mapped.emails, ['hello@example.com']);
  assert.equal(mapped.rating, 4.6);
  assert.equal(mapped.reviewCount, 10);
  assert.equal(mapped.googleCid, '10148625059575674202');
});

test('CSV row requires a company name and at least one valid contact', () => {
  assert.throws(() => mapCsvRow({ rowNumber: 2, values: { 'Company name': 'No Contact', Phone: '', 'Email 1': '' } }), /valid phone or email/);
});

test('public database projection never selects private contact or sales fields', () => {
  assert.equal(PUBLIC_SELECT.phone, undefined);
  assert.equal(PUBLIC_SELECT.emails, undefined);
  assert.equal(PUBLIC_SELECT.salesNote, undefined);
  assert.equal(PUBLIC_SELECT.registeredVendorUserId, undefined);
});

test('business list and admin update validation is strict', () => {
  assert.deepEqual(publicImportedBusinessListQuerySchema.parse({ page: '2', city: 'Noida' }), { page: 2, limit: 20, city: 'Noida' });
  assert.equal(adminImportedBusinessListQuerySchema.parse({ isPublished: 'false' }).isPublished, false);
  assert.equal(updateImportedBusinessSchema.safeParse({ status: 'CONTACTED', unknown: true }).success, false);
  assert.equal(updateImportedBusinessSchema.safeParse({}).success, false);
});
