import * as walletRepo from '../../repositories/wallet.repository.js';

const pageInfo = (total, page, limit) => ({
  total,
  page,
  limit,
  totalPages: Math.ceil(total / limit),
  hasNextPage: page * limit < total,
  hasPrevPage: page > 1,
});

export const getMyWallet = async (vendorUserId) => {
  const wallet = await walletRepo.findWallet(vendorUserId);
  return {
    balance: wallet?.balance ?? 0,
    createdAt: wallet?.createdAt ?? null,
    updatedAt: wallet?.updatedAt ?? null,
  };
};

export const listMyWalletTransactions = async ({ vendorUserId, query }) => {
  const { transactions, total } = await walletRepo.listTransactions({ vendorUserId, ...query });
  return { transactions, pagination: pageInfo(total, query.page, query.limit) };
};
