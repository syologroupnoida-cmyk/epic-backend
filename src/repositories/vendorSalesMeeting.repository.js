import prisma from '../config/db.js';

const VENDOR_SELECT = {
  userId: true,
  businessName: true,
  slug: true,
  logoUrl: true,
  primaryCity: { select: { id: true, name: true, stateName: true } },
  user: { select: { firstName: true, lastName: true, email: true, phone: true } },
};

const MEETING_SELECT = {
  id: true,
  vendorUserId: true,
  requestedStartAt: true,
  requestedEndAt: true,
  scheduledStartAt: true,
  scheduledEndAt: true,
  meetingUrl: true,
  vendorNote: true,
  vendorMessage: true,
  adminNote: true,
  status: true,
  reviewedByAdminId: true,
  reviewedAt: true,
  createdAt: true,
  updatedAt: true,
  vendor: { select: VENDOR_SELECT },
};

export const create = ({ vendorUserId, payload }) => prisma.vendorSalesMeeting.create({
  data: { vendorUserId, ...payload },
  select: MEETING_SELECT,
});

export const findById = (id) => prisma.vendorSalesMeeting.findUnique({ where: { id }, select: MEETING_SELECT });

export const findForVendor = (id, vendorUserId) => prisma.vendorSalesMeeting.findFirst({
  where: { id, vendorUserId },
  select: MEETING_SELECT,
});

export const listForVendor = async ({ vendorUserId, page, limit, status }) => {
  const where = { vendorUserId, ...(status && { status }) };
  const [meetings, total] = await Promise.all([
    prisma.vendorSalesMeeting.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { requestedStartAt: 'desc' }, select: MEETING_SELECT }),
    prisma.vendorSalesMeeting.count({ where }),
  ]);
  return { meetings, total };
};

export const listForAdmin = async ({ page, limit, status, vendorUserId }) => {
  const where = { ...(status && { status }), ...(vendorUserId && { vendorUserId }) };
  const [meetings, total] = await Promise.all([
    prisma.vendorSalesMeeting.findMany({ where, skip: (page - 1) * limit, take: limit, orderBy: { requestedStartAt: 'asc' }, select: MEETING_SELECT }),
    prisma.vendorSalesMeeting.count({ where }),
  ]);
  return { meetings, total };
};

export const findConfirmedOverlap = ({ startAt, endAt, excludeId }) => prisma.vendorSalesMeeting.findFirst({
  where: {
    status: 'CONFIRMED',
    ...(excludeId && { id: { not: excludeId } }),
    scheduledStartAt: { lt: endAt },
    scheduledEndAt: { gt: startAt },
  },
  select: { id: true },
});

export const update = ({ id, data }) => prisma.vendorSalesMeeting.update({
  where: { id },
  data,
  select: MEETING_SELECT,
});
