import prisma from '../../config/db.js';
import { ApiError } from '../../utils/ApiError.js';

const RESERVATION_MINUTES = 15;
const orderInclude = {
  items: { include: { variant: { select: { id: true, sku: true, optionValues: true, imageUrl: true } } } },
  user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
};
const customerInclude = { items: { include: { variant: { select: { id: true, sku: true, optionValues: true, imageUrl: true } } } } };
const publicOrder = ({ user, ...order }) => order;
const orderNumber = () => `EWP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

async function releaseReservation(tx, order, nextStatus, reason) {
  for (const item of order.items) {
    await tx.ecommerceProductVariant.update({ where: { id: item.variantId }, data: { reservedQuantity: { decrement: item.quantity } } });
    await tx.ecommerceInventoryMovement.create({ data: { variantId: item.variantId, type: 'ORDER_RELEASED', quantity: item.quantity, note: `Reservation released for ${order.orderNumber}` } });
  }
  return tx.ecommerceOrder.update({ where: { id: order.id }, data: { status: nextStatus, cancellationReason: reason || null, reservedUntil: null }, include: customerInclude });
}

export async function checkout({ userId, addressId }) {
  return prisma.$transaction(async (tx) => {
    const address = await tx.ecommerceAddress.findFirst({ where: { id: addressId, userId } });
    if (!address) throw ApiError.notFound('Shipping address not found.');
    const cart = await tx.ecommerceCart.findUnique({
      where: { userId },
      include: { items: { include: { variant: { include: { product: { include: { category: true } } } } } } },
    });
    if (!cart?.items.length) throw ApiError.badRequest('Your cart is empty.');
    let subtotal = 0; let tax = 0;
    for (const item of cart.items) {
      const v = item.variant;
      if (!v.isActive || v.product.status !== 'ACTIVE' || !v.product.category.isActive) throw ApiError.conflict(`A cart item is no longer available: ${v.sku}.`);
      const fresh = await tx.ecommerceProductVariant.findUnique({ where: { id: v.id }, select: { onHandQuantity: true, reservedQuantity: true } });
      if (!fresh || fresh.onHandQuantity - fresh.reservedQuantity < item.quantity) throw ApiError.conflict(`Insufficient stock for ${v.sku}.`);
      const line = v.saleAmountPaise * item.quantity;
      subtotal += line; tax += Math.round((line * v.product.gstPercentage) / 100);
    }
    const reservedUntil = new Date(Date.now() + RESERVATION_MINUTES * 60 * 1000);
    const order = await tx.ecommerceOrder.create({ data: {
      orderNumber: orderNumber(), userId, status: 'PAYMENT_PENDING', subtotalAmountPaise: subtotal, taxAmountPaise: tax, shippingAmountPaise: 0, totalAmountPaise: subtotal + tax, reservedUntil,
      addressSnapshot: { fullName: address.fullName, phone: address.phone, line1: address.line1, line2: address.line2, locality: address.locality, city: address.city, state: address.state, pincode: address.pincode, countryCode: address.countryCode },
      items: { create: cart.items.map(({ variant, quantity }) => ({ variantId: variant.id, quantity, unitAmountPaise: variant.saleAmountPaise, totalAmountPaise: variant.saleAmountPaise * quantity, productSnapshot: { productId: variant.product.id, title: variant.product.title, slug: variant.product.slug, sku: variant.sku, optionValues: variant.optionValues, imageUrl: variant.imageUrl } })) },
    }, include: customerInclude });
    for (const item of cart.items) {
      await tx.ecommerceProductVariant.update({ where: { id: item.variantId }, data: { reservedQuantity: { increment: item.quantity } } });
      await tx.ecommerceInventoryMovement.create({ data: { variantId: item.variantId, type: 'ORDER_RESERVED', quantity: item.quantity, note: `Reserved for ${order.orderNumber}` } });
    }
    await tx.ecommerceCartItem.deleteMany({ where: { cartId: cart.id } });
    return { ...order, paymentReservationExpiresAt: reservedUntil };
  });
}

export async function listCustomerOrders({ userId, query }) {
  const { page, limit, status } = query; const where = { userId, ...(status ? { status } : {}) };
  const [items, total] = await prisma.$transaction([prisma.ecommerceOrder.findMany({ where, include: customerInclude, orderBy: { createdAt: 'desc' }, skip: (page - 1) * limit, take: limit }), prisma.ecommerceOrder.count({ where })]);
  return { items, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}
export async function getCustomerOrder({ userId, orderId }) { const value = await prisma.ecommerceOrder.findFirst({ where: { id: orderId, userId }, include: customerInclude }); if (!value) throw ApiError.notFound('Order not found.'); return value; }
export async function cancelCustomerOrder({ userId, orderId, reason }) {
  return prisma.$transaction(async tx => { const order = await tx.ecommerceOrder.findFirst({ where: { id: orderId, userId }, include: { items: true } }); if (!order) throw ApiError.notFound('Order not found.'); if (order.status !== 'PAYMENT_PENDING') throw ApiError.conflict('Only payment-pending orders can be cancelled by the customer.'); return releaseReservation(tx, order, 'CANCELLED', reason || 'Cancelled by customer'); });
}
export async function requestReturn({ userId, orderId, reason }) { const result = await prisma.ecommerceOrder.updateMany({ where: { id: orderId, userId, status: 'DELIVERED' }, data: { status: 'RETURN_REQUESTED', returnReason: reason } }); if (!result.count) throw ApiError.conflict('Only delivered orders can have a return requested.'); return getCustomerOrder({ userId, orderId }); }
export async function listAdminOrders(query) { const { page, limit, status, userId } = query; const where = { ...(status ? { status } : {}), ...(userId ? { userId } : {}) }; const [items,total] = await prisma.$transaction([prisma.ecommerceOrder.findMany({ where, include: orderInclude, orderBy:{createdAt:'desc'},skip:(page-1)*limit,take:limit }), prisma.ecommerceOrder.count({where})]); return { items: items.map(publicOrder), pagination:{page,limit,total,totalPages:Math.ceil(total/limit)} }; }
export async function getAdminOrder(orderId) { const value = await prisma.ecommerceOrder.findUnique({ where:{id:orderId}, include:orderInclude }); if(!value) throw ApiError.notFound('Order not found.'); return publicOrder(value); }
export async function cancelAdminOrder({ orderId, reason }) { return prisma.$transaction(async tx=>{ const order=await tx.ecommerceOrder.findUnique({where:{id:orderId},include:{items:true}});if(!order)throw ApiError.notFound('Order not found.');if(order.status!=='PAYMENT_PENDING')throw ApiError.conflict('Only payment-pending orders can be cancelled before gateway integration.');return releaseReservation(tx,order,'CANCELLED',reason||'Cancelled by administrator'); }); }
export async function fulfilOrder({ orderId, body }) { return prisma.$transaction(async tx=>{ const order=await tx.ecommerceOrder.findUnique({where:{id:orderId},include:{items:true}});if(!order)throw ApiError.notFound('Order not found.'); const allowed={PAID:['PROCESSING'],PROCESSING:['PACKED'],PACKED:['SHIPPED'],SHIPPED:['DELIVERED'],RETURN_REQUESTED:['RETURNED'],RETURNED:['REFUNDED']}; if(!allowed[order.status]?.includes(body.status))throw ApiError.conflict(`Cannot change ${order.status} order to ${body.status}.`); const data={status:body.status}; if(body.status==='SHIPPED')Object.assign(data,{courierName:body.courierName,trackingNumber:body.trackingNumber,trackingUrl:body.trackingUrl||null,shippedAt:new Date()}); if(body.status==='DELIVERED')data.deliveredAt=new Date(); if(body.status==='RETURNED'){for(const item of order.items){await tx.ecommerceProductVariant.update({where:{id:item.variantId},data:{onHandQuantity:{increment:item.quantity}}});await tx.ecommerceInventoryMovement.create({data:{variantId:item.variantId,type:'RETURN_RECEIVED',quantity:item.quantity,note:`Returned for ${order.orderNumber}`}});}} return tx.ecommerceOrder.update({where:{id:order.id},data,include:customerInclude}); }); }
export async function markPaidForTest({ orderId }) { if (process.env.PAYMENTS_MODE !== 'TEST') throw ApiError.forbidden('Test payment confirmation is disabled outside PAYMENTS_MODE=TEST.'); return prisma.$transaction(async tx=>{const order=await tx.ecommerceOrder.findUnique({where:{id:orderId},include:{items:true}});if(!order)throw ApiError.notFound('Order not found.');if(order.status!=='PAYMENT_PENDING')throw ApiError.conflict('Only payment-pending orders can be confirmed.');if(order.reservedUntil&&order.reservedUntil<new Date())throw ApiError.conflict('Reservation expired.');for(const item of order.items){await tx.ecommerceProductVariant.update({where:{id:item.variantId},data:{onHandQuantity:{decrement:item.quantity},reservedQuantity:{decrement:item.quantity}}});await tx.ecommerceInventoryMovement.create({data:{variantId:item.variantId,type:'ORDER_SOLD',quantity:item.quantity,note:`Test payment confirmed for ${order.orderNumber}`}});}return tx.ecommerceOrder.update({where:{id:order.id},data:{status:'PAID',reservedUntil:null},include:customerInclude});}); }
export async function expireReservations() { const expired = await prisma.ecommerceOrder.findMany({where:{status:'PAYMENT_PENDING',reservedUntil:{lt:new Date()}},include:{items:true}}); for(const order of expired) await prisma.$transaction(tx=>releaseReservation(tx,order,'PAYMENT_EXPIRED','Payment reservation expired.')); return { releasedOrders: expired.length }; }
