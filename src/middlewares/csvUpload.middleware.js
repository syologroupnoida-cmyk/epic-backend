import multer from 'multer';
import { ApiError } from '../utils/ApiError.js';

const MAX_CSV_BYTES = 5 * 1024 * 1024;
const CSV_MIMES = new Set(['text/csv', 'application/csv', 'application/vnd.ms-excel', 'text/plain']);

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CSV_BYTES, files: 1 },
  fileFilter: (_req, file, callback) => {
    const hasCsvExtension = file.originalname.toLowerCase().endsWith('.csv');
    if (hasCsvExtension && CSV_MIMES.has(file.mimetype)) return callback(null, true);
    return callback(ApiError.badRequest('Only CSV files are allowed.'));
  },
});

export const uploadBusinessCsv = (req, res, next) => {
  csvUpload.single('file')(req, res, (error) => {
    if (!error) {
      if (!req.file) return next(ApiError.badRequest('CSV file is required in the "file" field.'));
      return next();
    }
    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      return next(new ApiError(413, 'CSV file must not exceed 5 MB.'));
    }
    return next(error);
  });
};
