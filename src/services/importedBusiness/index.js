import crypto from 'node:crypto';
import { ApiError } from '../../utils/ApiError.js';
import { parseCsv } from '../../utils/csv.js';
import { toSlug } from '../../utils/slug.js';
import * as businessRepo from '../../repositories/importedBusiness.repository.js';

const REQUIRED_HEADERS = ['Company name', 'Phone', 'Email 1'];
const MAX_ROWS = 10000;
const pageInfo = (total, page, limit) => ({ total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1 });
const clean = (value, max = 500) => value?.trim().slice(0, max) || null;
const email = (value) => {
  const normalized = clean(value, 254)?.toLowerCase();
  return normalized && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized) ? normalized : null;
};
const phone = (value) => {
  const digits = value?.replace(/\D/g, '') ?? '';
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  return null;
};
const number = (value) => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const integer = (value) => {
  const parsed = number(value);
  return parsed === null ? null : Math.max(0, Math.round(parsed));
};
const googleCid = (value) => {
  if (!value) return null;
  const match = value.match(/[?&]cid=(\d+)/i);
  return match?.[1] ?? (/^\d+$/.test(value) ? value : null);
};
const uniqueSlug = (name, cid, row) => {
  const suffix = cid?.slice(-10) ?? crypto.createHash('sha256').update(JSON.stringify(row)).digest('hex').slice(0, 10);
  return `${toSlug(name) || 'business'}-${suffix}`.slice(0, 180);
};

export const mapCsvRow = ({ rowNumber, values }) => {
  const businessName = clean(values['Company name'], 200);
  const normalizedPhone = phone(values.Phone);
  const emails = [...new Set(['Email 1', 'Email 2', 'Email 3'].map((key) => email(values[key])).filter(Boolean))];
  if (!businessName) throw ApiError.badRequest(`Row ${rowNumber}: Company name is required.`);
  if (!normalizedPhone && emails.length === 0) throw ApiError.badRequest(`Row ${rowNumber}: a valid phone or email is required.`);
  const cid = googleCid(values.Cid);
  const rating = number(values['Rating count']);
  if (rating !== null && (rating < 0 || rating > 5)) throw ApiError.badRequest(`Row ${rowNumber}: rating must be between 0 and 5.`);

  return {
    keyword: clean(values.Keyword, 160),
    location: clean(values.Location, 160),
    businessName,
    slug: uniqueSlug(businessName, cid, values),
    category: clean(values.Category, 160),
    website: clean(values.Website, 1000),
    phone: normalizedPhone,
    emails,
    address: clean(values.Address, 1000),
    city: clean(values.City, 120),
    state: clean(values.State, 120),
    pincode: clean(values.Pincode, 20),
    rating,
    reviewCount: integer(values.Review),
    googleCid: cid,
  };
};

export const importCsv = async ({ file, adminId }) => {
  const rows = parseCsv(file.buffer);
  const headers = Object.keys(rows[0].values);
  const missing = REQUIRED_HEADERS.filter((header) => !headers.includes(header));
  if (missing.length) throw ApiError.badRequest(`CSV is missing required column(s): ${missing.join(', ')}.`);
  if (rows.length > MAX_ROWS) throw ApiError.badRequest(`CSV cannot contain more than ${MAX_ROWS} data rows.`);

  let importedRows = 0;
  let duplicateRows = 0;
  const errors = [];
  for (const row of rows) {
    try {
      const data = mapCsvRow(row);
      const duplicate = await businessRepo.findDuplicate(data);
      if (duplicate) {
        duplicateRows += 1;
        continue;
      }
      await businessRepo.create(data);
      importedRows += 1;
    } catch (error) {
      errors.push({ row: row.rowNumber, message: error.message });
    }
  }

  const batch = await businessRepo.createBatch({
    fileName: file.originalname.slice(0, 255),
    totalRows: rows.length,
    importedRows,
    duplicateRows,
    failedRows: errors.length,
    errorSummary: errors.slice(0, 100),
    uploadedById: adminId,
  });
  return { batchId: batch.id, totalRows: rows.length, importedRows, duplicateRows, failedRows: errors.length, errors: errors.slice(0, 100) };
};

export const listPublic = async (query) => {
  const { businesses, total } = await businessRepo.listPublic(query);
  return { businesses, pagination: pageInfo(total, query.page, query.limit) };
};
export const getPublic = async (slug) => {
  const business = await businessRepo.findPublicBySlug(slug);
  if (!business) throw ApiError.notFound('Business not found.');
  return business;
};
export const listAdmin = async (query) => {
  const { businesses, total } = await businessRepo.listAdmin(query);
  return { businesses, pagination: pageInfo(total, query.page, query.limit) };
};
export const getAdmin = async (id) => {
  const business = await businessRepo.findAdminById(id);
  if (!business) throw ApiError.notFound('Imported business not found.');
  return business;
};
export const updateAdmin = async ({ id, payload }) => {
  await getAdmin(id);
  if (payload.registeredVendorUserId && !await businessRepo.vendorExists(payload.registeredVendorUserId)) {
    throw ApiError.badRequest('The registered vendor profile does not exist.');
  }
  const data = {
    ...payload,
    ...(payload.status === 'CONTACTED' && { lastContactedAt: new Date() }),
    ...(payload.registeredVendorUserId && { status: 'REGISTERED' }),
  };
  return businessRepo.update({ id, data });
};
export const listImportBatches = async (query) => {
  const { batches, total } = await businessRepo.listBatches(query);
  return { batches, pagination: pageInfo(total, query.page, query.limit) };
};
