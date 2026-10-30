import prisma from '../config/db.js';

const CONTACT_MESSAGE_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  userType: true,
  subject: true,
  message: true,
  status: true,
  adminNote: true,
  handledByAdminId: true,
  handledAt: true,
  createdAt: true,
  updatedAt: true,
};

export const create = (data) => prisma.contactMessage.create({ data, select: CONTACT_MESSAGE_SELECT });

export const findById = (id) => prisma.contactMessage.findUnique({ where: { id }, select: CONTACT_MESSAGE_SELECT });

export const listForAdmin = async ({ page, limit, status, userType, search }) => {
  const where = {
    ...(status && { status }),
    ...(userType && { userType }),
    ...(search && {
      OR: [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { subject: { contains: search, mode: 'insensitive' } },
      ],
    }),
  };
  const [messages, total] = await Promise.all([
    prisma.contactMessage.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { createdAt: 'desc' }, select: CONTACT_MESSAGE_SELECT }),
    prisma.contactMessage.count({ where }),
  ]);
  return { messages, total };
};

export const update = ({ id, data }) => prisma.contactMessage.update({ where: { id }, data, select: CONTACT_MESSAGE_SELECT });
