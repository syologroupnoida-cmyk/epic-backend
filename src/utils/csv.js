import { ApiError } from './ApiError.js';

export const parseCsv = (buffer) => {
  const text = buffer.toString('utf8').replace(/^\uFEFF/, '');
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') quoted = false;
      else field += char;
    } else if (char === '"') quoted = true;
    else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      row = [];
      field = '';
    } else field += char;
  }

  if (quoted) throw ApiError.badRequest('CSV contains an unclosed quoted field.');
  if (field.length || row.length) {
    row.push(field.replace(/\r$/, ''));
    if (row.some((value) => value.trim() !== '')) rows.push(row);
  }
  if (rows.length < 2) throw ApiError.badRequest('CSV must contain a header and at least one data row.');

  const headers = rows[0].map((value) => value.trim());
  return rows.slice(1).map((values, rowIndex) => ({
    rowNumber: rowIndex + 2,
    values: Object.fromEntries(headers.map((header, columnIndex) => [header, (values[columnIndex] ?? '').trim()])),
  }));
};
