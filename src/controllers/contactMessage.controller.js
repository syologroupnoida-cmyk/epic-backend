import * as contactMessageService from '../services/contactMessage/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const submit = asyncHandler(async (req, res) => sendSuccess(res, {
  statusCode: 201,
  message: 'Your message has been submitted. Our team will contact you soon.',
  data: await contactMessageService.submitContactMessage(req.body),
}));

export const listForAdmin = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Contact messages retrieved.',
  data: await contactMessageService.listContactMessages(req.query),
}));

export const getForAdmin = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Contact message retrieved.',
  data: await contactMessageService.getContactMessage(req.params.messageId),
}));

export const updateForAdmin = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Contact message updated.',
  data: await contactMessageService.updateContactMessage({ messageId: req.params.messageId, adminId: req.user.id, payload: req.body }),
}));
