import * as uploadService from '../services/upload/index.js';
import { sendSuccess } from '../utils/response.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import * as kycService from '../services/vendorKyc/index.js';

export const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw ApiError.badRequest(
      'File is required. Send multipart/form-data with a "file" field.',
    );
  }

  const isKycDocument = req.body.purpose.startsWith('kyc-');
  if (isKycDocument) {
    if (req.user.role !== 'VENDOR') throw ApiError.forbidden('Only vendors can upload KYC documents.');
    await kycService.assertKycEditable(req.user.id);
  }

  const result = await uploadService.uploadImage({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    originalname: req.file.originalname,
    purpose: req.body.purpose,
    name: req.body.name, // optional — stored as Cloudinary publicId for easy lookup
    userId: req.user.id,
  });

  if (isKycDocument) {
    result.document = await kycService.saveDocumentImage({ vendorUserId: req.user.id, purpose: req.body.purpose, url: result.url });
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: 'File uploaded successfully.',
    data: result,
  });
});
