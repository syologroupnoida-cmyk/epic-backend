import { ApiError } from '../../utils/ApiError.js';
import * as meetingRepo from '../../repositories/vendorSalesMeeting.repository.js';
import { createVendorSalesMeetingEvent } from '../googleCalendar/index.js';
import { sendVendorSalesMeetingNotice } from '../mail/index.js';

const pageInfo = (total, page, limit) => ({
  total, page, limit, totalPages: Math.ceil(total / limit), hasNextPage: page * limit < total, hasPrevPage: page > 1,
});

const serializeVendorMeeting = (meeting) => ({
  id: meeting.id,
  requestedStartAt: meeting.requestedStartAt,
  requestedEndAt: meeting.requestedEndAt,
  scheduledStartAt: meeting.scheduledStartAt,
  scheduledEndAt: meeting.scheduledEndAt,
  status: meeting.status,
  vendorNote: meeting.vendorNote,
  // This is explicitly vendor-facing. Internal adminNote is never exposed.
  vendorMessage: meeting.vendorMessage,
  meetingUrl: meeting.status === 'CONFIRMED' ? meeting.meetingUrl : null,
  canJoin: meeting.status === 'CONFIRMED' && Boolean(meeting.meetingUrl),
  createdAt: meeting.createdAt,
  updatedAt: meeting.updatedAt,
});

const serializeAdminMeeting = (meeting) => ({
  ...meeting,
  vendor: meeting.vendor && {
    userId: meeting.vendor.userId,
    businessName: meeting.vendor.businessName,
    slug: meeting.vendor.slug,
    logoUrl: meeting.vendor.logoUrl,
    primaryCity: meeting.vendor.primaryCity,
    contact: {
      name: `${meeting.vendor.user.firstName} ${meeting.vendor.user.lastName}`.trim(),
      email: meeting.vendor.user.email,
      phone: meeting.vendor.user.phone,
    },
  },
});

const requireMeeting = async (meetingId) => {
  const meeting = await meetingRepo.findById(meetingId);
  if (!meeting) throw ApiError.notFound('Sales meeting request not found.');
  return meeting;
};

export const requestMeeting = async ({ vendorUserId, payload }) => serializeVendorMeeting(
  await meetingRepo.create({ vendorUserId, payload }),
);

export const listMyMeetings = async ({ vendorUserId, query }) => {
  const { meetings, total } = await meetingRepo.listForVendor({ vendorUserId, ...query });
  return { meetings: meetings.map(serializeVendorMeeting), pagination: pageInfo(total, query.page, query.limit) };
};

export const getMyMeeting = async ({ vendorUserId, meetingId }) => {
  const meeting = await meetingRepo.findForVendor(meetingId, vendorUserId);
  if (!meeting) throw ApiError.notFound('Sales meeting request not found.');
  return serializeVendorMeeting(meeting);
};

export const listMeetingsForAdmin = async (query) => {
  const { meetings, total } = await meetingRepo.listForAdmin(query);
  return { meetings: meetings.map(serializeAdminMeeting), pagination: pageInfo(total, query.page, query.limit) };
};

export const getMeetingForAdmin = async (meetingId) => serializeAdminMeeting(await requireMeeting(meetingId));

const allowedNextStatuses = {
  PENDING: new Set(['CONFIRMED', 'REJECTED', 'CANCELLED']),
  CONFIRMED: new Set(['CANCELLED', 'COMPLETED', 'NO_SHOW']),
};

export const reviewMeeting = async ({ meetingId, adminId, payload }) => {
  const meeting = await requireMeeting(meetingId);
  if (!allowedNextStatuses[meeting.status]?.has(payload.status)) {
    throw ApiError.conflict(`A ${meeting.status} meeting cannot be changed to ${payload.status}.`);
  }

  const data = {
    status: payload.status,
    reviewedByAdminId: adminId,
    reviewedAt: new Date(),
    ...(payload.adminNote !== undefined && { adminNote: payload.adminNote }),
    ...(payload.vendorMessage !== undefined && { vendorMessage: payload.vendorMessage }),
  };

  if (payload.status === 'CONFIRMED') {
    if (payload.scheduledStartAt <= new Date()) throw ApiError.badRequest('scheduledStartAt must be in the future.');
    const overlap = await meetingRepo.findConfirmedOverlap({
      startAt: payload.scheduledStartAt,
      endAt: payload.scheduledEndAt,
      excludeId: meeting.id,
    });
    if (overlap) throw ApiError.conflict('Another sales meeting is already confirmed for this time.');
    // The Calendar call must succeed before changing the database status. This
    // avoids a CONFIRMED meeting that has no join link.
    const { meetingUrl } = await createVendorSalesMeetingEvent({
      meetingId: meeting.id,
      scheduledStartAt: payload.scheduledStartAt,
      scheduledEndAt: payload.scheduledEndAt,
    });
    Object.assign(data, {
      scheduledStartAt: payload.scheduledStartAt,
      scheduledEndAt: payload.scheduledEndAt,
      meetingUrl,
    });
  }

  const updatedMeeting = await meetingRepo.update({ id: meetingId, data });

  // Queue only vendor-facing meeting-state changes. Delivery failure is logged
  // and retried by RabbitMQ; it must not roll back an already approved/rejected
  // admin decision.
  if (['CONFIRMED', 'REJECTED', 'CANCELLED', 'NO_SHOW'].includes(updatedMeeting.status)) {
    const vendor = updatedMeeting.vendor;
    sendVendorSalesMeetingNotice({
      to: vendor.user.email,
      firstName: vendor.user.firstName || 'there',
      status: updatedMeeting.status,
      requestedStartAt: updatedMeeting.requestedStartAt,
      requestedEndAt: updatedMeeting.requestedEndAt,
      scheduledStartAt: updatedMeeting.scheduledStartAt,
      scheduledEndAt: updatedMeeting.scheduledEndAt,
      vendorMessage: updatedMeeting.vendorMessage,
      meetingUrl: updatedMeeting.status === 'CONFIRMED' ? updatedMeeting.meetingUrl : null,
    }).catch((error) => console.error('[sales-meeting] Could not queue vendor email:', error?.message));
  }

  return serializeAdminMeeting(updatedMeeting);
};
