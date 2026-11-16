import * as service from "../services/payment/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { sendSuccess } from "../utils/response.js";

export const createEcommercePayment = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    statusCode: 201,
    message: "Razorpay checkout order created.",
    data: await service.createEcommercePayment({
      userId: req.user.id,
      orderId: req.params.orderId,
    }),
  }),
);

export const verifyEcommercePayment = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: "Payment verification completed.",
    data: await service.verifyEcommercePayment({
      userId: req.user.id,
      localPaymentId: req.params.paymentId,
      body: req.body,
    }),
  }),
);

export const refundEcommerceOrder = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    statusCode: 202,
    message: "Razorpay refund requested.",
    data: await service.refundEcommerceOrder({
      orderId: req.params.orderId,
      adminUserId: req.user.id,
    }),
  }),
);

export const razorpayWebhook = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: "Webhook received.",
    data: await service.processRazorpayWebhook({
      rawBody: req.body,
      signature: req.headers["x-razorpay-signature"],
      eventId: req.headers["x-razorpay-event-id"],
    }),
  }),
);
