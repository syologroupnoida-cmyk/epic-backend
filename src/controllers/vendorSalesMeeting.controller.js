import * as meetingService from '../services/vendorSalesMeeting/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const requestMyMeeting = asyncHandler(async (req, res) => sendSuccess(res, {
  statusCode: 201,
  message: 'Sales meeting request submitted for admin review.',
  data: await meetingService.requestMeeting({ vendorUserId: req.user.id, payload: req.body }),
}));

export const listMyMeetings = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Your sales meeting requests retrieved.',
  data: await meetingService.listMyMeetings({ vendorUserId: req.user.id, query: req.query }),
}));

export const getMyMeeting = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Sales meeting request retrieved.',
  data: await meetingService.getMyMeeting({ vendorUserId: req.user.id, meetingId: req.params.meetingId }),
}));

export const listForAdmin = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Vendor sales meeting requests retrieved.',
  data: await meetingService.listMeetingsForAdmin(req.query),
}));

export const getForAdmin = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Vendor sales meeting request retrieved.',
  data: await meetingService.getMeetingForAdmin(req.params.meetingId),
}));

export const reviewForAdmin = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Vendor sales meeting request updated.',
  data: await meetingService.reviewMeeting({ meetingId: req.params.meetingId, adminId: req.user.id, payload: req.body }),
}));
