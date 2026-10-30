import { ApiError } from '../../utils/ApiError.js';
import * as contactMessageRepo from '../../repositories/contactMessage.repository.js';

const pageInfo = (total, page, limit) => ({
  total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1,
});

export const submitContactMessage = async (payload) => {
  const { website, ...message } = payload;
  // Honeypot is validated as empty and intentionally never persisted.
  return contactMessageRepo.create(message);
};

export const listContactMessages = async (query) => {
  const { messages, total } = await contactMessageRepo.listForAdmin(query);
  return { messages, pagination: pageInfo(total, query.page, query.limit) };
};

export const getContactMessage = async (messageId) => {
  const message = await contactMessageRepo.findById(messageId);
  if (!message) throw ApiError.notFound('Contact message not found.');
  return message;
};

export const updateContactMessage = async ({ messageId, adminId, payload }) => {
  await getContactMessage(messageId);
  const data = { ...payload, handledByAdminId: adminId, handledAt: new Date() };
  return contactMessageRepo.update({ id: messageId, data });
};
