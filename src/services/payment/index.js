import crypto from 'node:crypto';
import prisma from '../../config/db.js';
import { env } from '../../config/env.js';
import { ApiError } from '../../utils/ApiError.js';
import { activatePendingSubscription } from '../../repositories/vendorSubscription.repository.js';

const BASE_URL = 'https://api.razorpay.com/v1';

function configured() {
  if (!env.RAZORPAY_KEY_ID || !env.RAZORPAY_KEY_SECRET) throw ApiError.badRequest('Razorpay is not configured on the server.');
}
function basicAuth() { return `Basic ${Buffer.from(`${env.RAZORPAY_KEY_ID}:${env.RAZORPAY_KEY_SECRET}`).toString('base64')}`; }
async function gateway(path, options = {}) {
  configured();
  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers: { Authorization: basicAuth(), 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw ApiError.badRequest(body?.error?.description || 'Razorpay request failed.');
  return body;
}
function signatureValid(orderId, paymentId, signature) {
  const expected = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET).update(`${orderId}|${paymentId}`).digest('hex');
  const actual = Buffer.from(signature, 'utf8'); const expectedBuffer = Buffer.from(expected, 'utf8');
  return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
}

async function markOrderPaid(tx, order) {
  for (const item of order.items) {
    const result = await tx.ecommerceProductVariant.updateMany({ where: { id: item.variantId, onHandQuantity: { gte: item.quantity }, reservedQuantity: { gte: item.quantity } }, data: { onHandQuantity: { decrement: item.quantity }, reservedQuantity: { decrement: item.quantity } } });
    if (!result.count) throw ApiError.conflict(`Unable to confirm stock for ${order.orderNumber}.`);
    await tx.ecommerceInventoryMovement.create({ data: { variantId: item.variantId, type: 'ORDER_SOLD', quantity: item.quantity, note: `Payment confirmed for ${order.orderNumber}` } });
  }
  await tx.ecommerceOrder.update({ where: { id: order.id }, data: { status: 'PAID', reservedUntil: null } });
}

export async function completeCapturedPayment({ gatewayOrderId, gatewayPaymentId, amountPaise }) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { gatewayOrderId } });
    if (!payment) throw ApiError.notFound('Payment record not found.');
    if (payment.amountPaise !== amountPaise) throw ApiError.badRequest('Gateway payment amount does not match the expected amount.');
    if (payment.status === 'PAID') return payment;
    const claimed = await tx.payment.updateMany({ where: { id: payment.id, status: { in: ['CREATED', 'PENDING'] } }, data: { status: 'PAID', gatewayPaymentId, paidAt: new Date(), failureCode: null, failureDescription: null } });
    if (!claimed.count) return tx.payment.findUnique({ where: { id: payment.id } });
    if (payment.purpose === 'ECOMMERCE_ORDER') {
      const order = await tx.ecommerceOrder.findUnique({ where: { id: payment.referenceId }, include: { items: true } });
      if (!order || order.status !== 'PAYMENT_PENDING') throw ApiError.conflict('This e-commerce order cannot be paid.');
      if (order.reservedUntil && order.reservedUntil < new Date()) throw ApiError.conflict('This payment reservation has expired.');
      await markOrderPaid(tx, order);
    } else if (payment.purpose === 'VENDOR_SUBSCRIPTION') {
      try {
        await activatePendingSubscription(tx, payment.referenceId);
      } catch (error) {
        if (error.message === 'SUBSCRIPTION_NOT_FOUND') throw ApiError.notFound('Subscription purchase not found.');
        if (error.message === 'SUBSCRIPTION_NOT_PENDING') throw ApiError.conflict('This subscription purchase cannot be activated.');
        throw error;
      }
    } else {
      throw ApiError.badRequest('Payment purpose is not implemented yet.');
    }
    return tx.payment.findUnique({ where: { id: payment.id } });
  });
}

export async function createEcommercePayment({ userId, orderId }) {
  const order = await prisma.ecommerceOrder.findFirst({ where: { id: orderId, userId } });
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.status !== 'PAYMENT_PENDING') throw ApiError.conflict('Only payment-pending orders can be paid.');
  if (order.reservedUntil && order.reservedUntil < new Date()) throw ApiError.conflict('The payment reservation has expired. Create a new checkout order.');
  const existing = await prisma.payment.findFirst({ where: { userId, purpose: 'ECOMMERCE_ORDER', referenceId: orderId, status: 'PENDING', gatewayOrderId: { not: null } }, orderBy: { createdAt: 'desc' } });
  if (existing) return { paymentId: existing.id, razorpayOrderId: existing.gatewayOrderId, amountPaise: existing.amountPaise, currency: existing.currency, keyId: env.RAZORPAY_KEY_ID };
  const payment = await prisma.payment.create({ data: { userId, purpose: 'ECOMMERCE_ORDER', referenceId: orderId, amountPaise: order.totalAmountPaise } });
  try {
    const rpOrder = await gateway('/orders', { method: 'POST', body: JSON.stringify({ amount: payment.amountPaise, currency: payment.currency, receipt: `pay_${payment.id}`, notes: { paymentId: payment.id, purpose: payment.purpose, referenceId: orderId } }) });
    const updated = await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PENDING', gatewayOrderId: rpOrder.id } });
    return { paymentId: updated.id, razorpayOrderId: updated.gatewayOrderId, amountPaise: updated.amountPaise, currency: updated.currency, keyId: env.RAZORPAY_KEY_ID };
  } catch (error) { await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED', failureDescription: error.message } }); throw error; }
};

export async function verifyEcommercePayment({ userId, localPaymentId, body }) {
  const payment = await prisma.payment.findFirst({ where: { id: localPaymentId, userId, purpose: 'ECOMMERCE_ORDER' } });
  if (!payment) throw ApiError.notFound('Payment not found.');
  if (payment.gatewayOrderId !== body.razorpay_order_id) throw ApiError.badRequest('Razorpay order does not match this payment.');
  if (!signatureValid(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) throw ApiError.badRequest('Invalid Razorpay payment signature.');
  const rpPayment = await gateway(`/payments/${body.razorpay_payment_id}`);
  if (rpPayment.order_id !== payment.gatewayOrderId || rpPayment.amount !== payment.amountPaise) throw ApiError.badRequest('Razorpay payment details do not match this payment.');
  if (rpPayment.status === 'captured') return { payment: await completeCapturedPayment({ gatewayOrderId: payment.gatewayOrderId, gatewayPaymentId: rpPayment.id, amountPaise: rpPayment.amount }), orderStatus: 'PAID' };
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PENDING', gatewayPaymentId: rpPayment.id } });
  return { payment: await prisma.payment.findUnique({ where: { id: payment.id } }), orderStatus: 'PAYMENT_PENDING', message: 'Payment is awaiting Razorpay capture confirmation.' };
}

function paymentCheckoutResponse(payment) {
  return {
    paymentId: payment.id,
    razorpayOrderId: payment.gatewayOrderId,
    amountPaise: payment.amountPaise,
    currency: payment.currency,
    keyId: env.RAZORPAY_KEY_ID,
  };
}

async function createRazorpayOrderForPayment(payment, notes) {
  try {
    const rpOrder = await gateway('/orders', {
      method: 'POST',
      body: JSON.stringify({
        amount: payment.amountPaise,
        currency: payment.currency,
        receipt: `pay_${payment.id}`,
        notes,
      }),
    });
    return prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'PENDING', gatewayOrderId: rpOrder.id },
    });
  } catch (error) {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: 'FAILED', failureDescription: error.message },
    });
    throw error;
  }
}

export async function createVendorSubscriptionPayment({ userId, planId }) {
  const plan = await prisma.subscriptionPlan.findFirst({
    where: { id: planId, isActive: true, kind: 'PAID', isPurchasable: true },
  });
  if (!plan) throw ApiError.notFound('Active purchasable paid subscription plan not found.');

  const activeSamePlan = await prisma.vendorSubscription.findFirst({
    where: { vendorUserId: userId, planId, status: 'ACTIVE', OR: [{ endsAt: null }, { endsAt: { gt: new Date() } }] },
  });
  if (activeSamePlan) throw ApiError.conflict('This subscription plan is already active.');

  let subscription = await prisma.vendorSubscription.findFirst({
    where: { vendorUserId: userId, planId, status: 'PENDING_PAYMENT' },
    orderBy: { createdAt: 'desc' },
  });
  if (!subscription) {
    await prisma.vendorSubscription.updateMany({
      where: { vendorUserId: userId, status: 'PENDING_PAYMENT' },
      data: { status: 'CANCELLED' },
    });
    subscription = await prisma.vendorSubscription.create({
      data: { vendorUserId: userId, planId: plan.id, status: 'PENDING_PAYMENT', amount: plan.monthlyPrice },
    });
  }

  const existing = await prisma.payment.findFirst({
    where: { userId, purpose: 'VENDOR_SUBSCRIPTION', referenceId: subscription.id, status: 'PENDING', gatewayOrderId: { not: null } },
    orderBy: { createdAt: 'desc' },
  });
  if (existing) return paymentCheckoutResponse(existing);

  // SubscriptionPlan.monthlyPrice and VendorSubscription.amount are stored in
  // whole INR, unlike e-commerce prices which are explicitly stored in paise.
  const payment = await prisma.payment.create({
    data: { userId, purpose: 'VENDOR_SUBSCRIPTION', referenceId: subscription.id, amountPaise: subscription.amount * 100 },
  });
  const updated = await createRazorpayOrderForPayment(payment, {
    paymentId: payment.id,
    purpose: payment.purpose,
    subscriptionId: subscription.id,
    planId: plan.id,
  });
  return paymentCheckoutResponse(updated);
}

export async function verifyVendorSubscriptionPayment({ userId, localPaymentId, body }) {
  const payment = await prisma.payment.findFirst({
    where: { id: localPaymentId, userId, purpose: 'VENDOR_SUBSCRIPTION' },
  });
  if (!payment) throw ApiError.notFound('Subscription payment not found.');
  if (payment.gatewayOrderId !== body.razorpay_order_id) throw ApiError.badRequest('Razorpay order does not match this subscription payment.');
  if (!signatureValid(body.razorpay_order_id, body.razorpay_payment_id, body.razorpay_signature)) throw ApiError.badRequest('Invalid Razorpay payment signature.');
  const rpPayment = await gateway(`/payments/${body.razorpay_payment_id}`);
  if (rpPayment.order_id !== payment.gatewayOrderId || rpPayment.amount !== payment.amountPaise) throw ApiError.badRequest('Razorpay payment details do not match this subscription payment.');
  if (rpPayment.status === 'captured') {
    const completed = await completeCapturedPayment({ gatewayOrderId: payment.gatewayOrderId, gatewayPaymentId: rpPayment.id, amountPaise: rpPayment.amount });
    const subscription = await prisma.vendorSubscription.findUnique({ where: { id: completed.referenceId }, include: { plan: true } });
    return { payment: completed, subscription };
  }
  await prisma.payment.update({ where: { id: payment.id }, data: { status: 'PENDING', gatewayPaymentId: rpPayment.id } });
  return { payment: await prisma.payment.findUnique({ where: { id: payment.id } }), subscriptionStatus: 'PENDING_PAYMENT', message: 'Payment is awaiting Razorpay capture confirmation.' };
}

async function completeRefund({ gatewayRefundId, gatewayPaymentId, amountPaise }) {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findFirst({
      where: {
        purpose: 'ECOMMERCE_ORDER',
        OR: [
          ...(gatewayRefundId ? [{ gatewayRefundId }] : []),
          ...(gatewayPaymentId ? [{ gatewayPaymentId }] : []),
        ],
      },
    });
    if (!payment) throw ApiError.notFound('Refund payment record not found.');
    if (amountPaise !== undefined && payment.amountPaise !== amountPaise) {
      throw ApiError.badRequest('Gateway refund amount does not match the original payment.');
    }
    if (payment.status === 'REFUNDED') return payment;
    if (payment.status !== 'REFUND_PENDING') throw ApiError.conflict('This payment is not awaiting a refund confirmation.');

    const order = await tx.ecommerceOrder.findUnique({ where: { id: payment.referenceId } });
    if (!order || order.status !== 'RETURNED') {
      throw ApiError.conflict('Only a returned order can be marked refunded.');
    }
    await tx.ecommerceOrder.update({ where: { id: order.id }, data: { status: 'REFUNDED' } });
    return tx.payment.update({
      where: { id: payment.id },
      data: {
        status: 'REFUNDED',
        gatewayRefundId: gatewayRefundId || payment.gatewayRefundId,
        refundAmountPaise: amountPaise ?? payment.refundAmountPaise,
        refundStatus: 'processed',
        refundedAt: new Date(),
        failureCode: null,
        failureDescription: null,
      },
    });
  });
}

export async function refundEcommerceOrder({ orderId, adminUserId }) {
  const order = await prisma.ecommerceOrder.findUnique({ where: { id: orderId } });
  if (!order) throw ApiError.notFound('Order not found.');
  if (order.status !== 'RETURNED') throw ApiError.conflict('Refund is allowed only after the order is marked RETURNED.');

  const payment = await prisma.payment.findFirst({
    where: { purpose: 'ECOMMERCE_ORDER', referenceId: orderId },
    orderBy: { paidAt: 'desc' },
  });
  if (!payment?.gatewayPaymentId) throw ApiError.conflict('No captured Razorpay payment was found for this order.');
  if (payment.status === 'REFUNDED') throw ApiError.conflict('This order has already been refunded.');
  if (payment.status === 'REFUND_PENDING') throw ApiError.conflict('A Razorpay refund is already awaiting confirmation for this order.');
  if (payment.status !== 'PAID') throw ApiError.conflict('Only a captured payment can be refunded.');

  const claimed = await prisma.payment.updateMany({
    where: { id: payment.id, status: 'PAID' },
    data: { status: 'REFUND_PENDING', refundRequestedAt: new Date(), refundAmountPaise: payment.amountPaise, refundStatus: 'pending' },
  });
  if (!claimed.count) throw ApiError.conflict('A refund is already being processed for this order.');

  try {
    const refund = await gateway(`/payments/${payment.gatewayPaymentId}/refund`, {
      method: 'POST',
      body: JSON.stringify({
        amount: payment.amountPaise,
        speed: 'normal',
        notes: { paymentId: payment.id, orderId, requestedByAdminId: adminUserId },
      }),
    });
    await prisma.payment.update({
      where: { id: payment.id },
      data: { gatewayRefundId: refund.id, refundStatus: refund.status || 'pending' },
    });
    if (refund.status === 'processed') {
      const completed = await completeRefund({ gatewayRefundId: refund.id, gatewayPaymentId: payment.gatewayPaymentId, amountPaise: refund.amount });
      return { payment: completed, orderStatus: 'REFUNDED', gatewayRefundStatus: refund.status };
    }
    return { payment: await prisma.payment.findUnique({ where: { id: payment.id } }), orderStatus: 'RETURNED', gatewayRefundStatus: refund.status || 'pending' };
  } catch (error) {
    await prisma.payment.updateMany({
      where: { id: payment.id, status: 'REFUND_PENDING', gatewayRefundId: null },
      data: { status: 'PAID', refundStatus: 'failed', failureDescription: error.message },
    });
    throw error;
  }
}

export async function processRazorpayWebhook({ rawBody, signature, eventId }) {
  if (!env.RAZORPAY_WEBHOOK_SECRET) throw ApiError.badRequest('RAZORPAY_WEBHOOK_SECRET is not configured.');
  const expected = crypto.createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET).update(rawBody).digest('hex');
  const actual = Buffer.from(String(signature || ''), 'utf8'); const expectedBuffer = Buffer.from(expected, 'utf8');
  if (!actual.length || actual.length !== expectedBuffer.length || !crypto.timingSafeEqual(actual, expectedBuffer)) throw ApiError.unauthorized('Invalid Razorpay webhook signature.');
  const payload = JSON.parse(rawBody.toString('utf8'));
  let event;
  try { event = await prisma.paymentWebhookEvent.create({ data: { gatewayEventId: eventId || null, eventType: payload.event || 'unknown', payload } }); }
  catch (error) { if (error.code === 'P2002') return { duplicate: true }; throw error; }
  try {
    const entity = payload?.payload?.payment?.entity;
    if (['payment.captured', 'order.paid'].includes(payload.event) && entity?.order_id) await completeCapturedPayment({ gatewayOrderId: entity.order_id, gatewayPaymentId: entity.id, amountPaise: entity.amount });
    if (payload.event === 'payment.failed' && entity?.order_id) await prisma.payment.updateMany({ where: { gatewayOrderId: entity.order_id, status: { in: ['CREATED', 'PENDING'] } }, data: { status: 'FAILED', failureCode: entity.error_code || null, failureDescription: entity.error_description || 'Payment failed.' } });
    const refund = payload?.payload?.refund?.entity;
    if (payload.event === 'refund.processed' && refund?.id) await completeRefund({ gatewayRefundId: refund.id, gatewayPaymentId: refund.payment_id, amountPaise: refund.amount });
    if (payload.event === 'refund.failed' && refund?.id) {
      await prisma.payment.updateMany({
        where: { purpose: 'ECOMMERCE_ORDER', OR: [{ gatewayRefundId: refund.id }, { gatewayPaymentId: refund.payment_id }], status: 'REFUND_PENDING' },
        data: { status: 'PAID', refundStatus: 'failed', failureCode: refund.error_code || null, failureDescription: refund.error_description || 'Razorpay refund failed.' },
      });
    }
    await prisma.paymentWebhookEvent.update({ where: { id: event.id }, data: { processedAt: new Date() } });
    return { duplicate: false };
  } catch (error) { await prisma.paymentWebhookEvent.delete({ where: { id: event.id } }).catch(() => {}); throw error; }
}
