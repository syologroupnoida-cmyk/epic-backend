import * as walletService from '../services/wallet/index.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { sendSuccess } from '../utils/response.js';

export const getMyWallet = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Vendor wallet retrieved.',
  data: await walletService.getMyWallet(req.user.id),
}));

export const listMyWalletTransactions = asyncHandler(async (req, res) => sendSuccess(res, {
  message: 'Vendor wallet transactions retrieved.',
  data: await walletService.listMyWalletTransactions({ vendorUserId: req.user.id, query: req.query }),
}));
