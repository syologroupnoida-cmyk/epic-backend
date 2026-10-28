import prisma from '../config/db.js';

const CARD_SELECT = {
  id: true,
  code: true,
  kind: true,
  displayName: true,
  shortDescription: true,
  monthlyPrice: true,
  directLeadPrice: true,
  walletCreditPerBillingCycle: true,
  maxActiveServiceListings: true,
  maxActiveVenueProperties: true,
  maxDirectLeadPurchasesPerMonth: true,
  maxSharedLeadPurchasesPerMonth: true,
  maxMediaPerListing: true,
  featuredListingSlots: true,
  benefits: true,
  badgeText: true,
  theme: true,
  ctaText: true,
  sortOrder: true,
  isFeatured: true,
  isDefault: true,
  isPurchasable: true,
};

const ACTIVE_SUBSCRIPTION_SELECT = {
  id: true,
  status: true,
  amount: true,
  startedAt: true,
  endsAt: true,
  createdAt: true,
  plan: { select: CARD_SELECT },
};

export const listActivePlans = () => prisma.subscriptionPlan.findMany({
  where: { isActive: true },
  orderBy: [{ sortOrder: 'asc' }, { monthlyPrice: 'asc' }, { createdAt: 'asc' }],
  select: CARD_SELECT,
});

export const findActiveDefaultPlan = () => prisma.subscriptionPlan.findFirst({
  where: { isActive: true, kind: 'FREE', isDefault: true },
  select: CARD_SELECT,
});

export const findActivePaidSubscription = (vendorUserId, now = new Date()) => prisma.vendorSubscription.findFirst({
  where: {
    vendorUserId,
    status: 'ACTIVE',
    plan: { is: { isActive: true, kind: 'PAID' } },
    OR: [{ endsAt: null }, { endsAt: { gt: now } }],
  },
  orderBy: [{ endsAt: 'desc' }, { startedAt: 'desc' }, { createdAt: 'desc' }],
  select: ACTIVE_SUBSCRIPTION_SELECT,
});

export const findActivePurchasablePaidPlan = (id) => prisma.subscriptionPlan.findFirst({
  where: { id, isActive: true, kind: 'PAID', isPurchasable: true },
  select: CARD_SELECT,
});

export const activateTestSubscription = async ({ vendorUserId, plan }) => prisma.$transaction(async (tx) => {
  const now = new Date();
  const endsAt = new Date(now);
  endsAt.setDate(endsAt.getDate() + 30);

  await tx.vendorSubscription.updateMany({
    where: { vendorUserId, status: 'ACTIVE' },
    data: { status: 'CANCELLED', endsAt: now },
  });

  const subscription = await tx.vendorSubscription.create({
    data: {
      vendorUserId,
      planId: plan.id,
      status: 'ACTIVE',
      amount: plan.monthlyPrice,
      startedAt: now,
      endsAt,
    },
    select: ACTIVE_SUBSCRIPTION_SELECT,
  });

  const wallet = await tx.vendorWallet.upsert({
    where: { vendorUserId },
    create: { vendorUserId, balance: plan.walletCreditPerBillingCycle },
    update: { balance: { increment: plan.walletCreditPerBillingCycle } },
    select: { balance: true },
  });

  if (plan.walletCreditPerBillingCycle > 0) {
    await tx.walletTransaction.create({
      data: {
        vendorUserId,
        amount: plan.walletCreditPerBillingCycle,
        balanceAfter: wallet.balance,
        type: 'SUBSCRIPTION_CREDIT',
        description: `${plan.displayName} subscription wallet credit.`,
        referenceType: 'VENDOR_SUBSCRIPTION',
        referenceId: subscription.id,
      },
    });
  }

  return { subscription, wallet };
});
