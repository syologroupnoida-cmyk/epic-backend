import prisma from '../config/db.js';

const TRANSACTION_SELECT = {
  id: true,
  amount: true,
  balanceAfter: true,
  type: true,
  description: true,
  referenceType: true,
  referenceId: true,
  createdAt: true,
};

export const findWallet = (vendorUserId) => prisma.vendorWallet.findUnique({
  where: { vendorUserId },
  select: { vendorUserId: true, balance: true, createdAt: true, updatedAt: true },
});

export const listTransactions = async ({ vendorUserId, page, limit }) => {
  const where = { vendorUserId };
  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: TRANSACTION_SELECT,
    }),
    prisma.walletTransaction.count({ where }),
  ]);
  return { transactions, total };
};
