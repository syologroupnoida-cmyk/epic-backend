ALTER TABLE "subscription_plans" ADD COLUMN "walletCreditPerBillingCycle" INTEGER NOT NULL DEFAULT 0;

CREATE TYPE "WalletTransactionType" AS ENUM ('SIGNUP_BONUS', 'SUBSCRIPTION_CREDIT', 'WALLET_TOPUP', 'LEAD_PURCHASE', 'REFUND', 'ADMIN_ADJUSTMENT');

CREATE TABLE "vendor_wallets" (
  "vendorUserId" TEXT NOT NULL,
  "balance" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vendor_wallets_pkey" PRIMARY KEY ("vendorUserId")
);

CREATE TABLE "wallet_transactions" (
  "id" TEXT NOT NULL,
  "vendorUserId" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "type" "WalletTransactionType" NOT NULL,
  "description" TEXT NOT NULL,
  "referenceType" TEXT,
  "referenceId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wallet_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wallet_transactions_vendorUserId_createdAt_idx" ON "wallet_transactions"("vendorUserId", "createdAt");
CREATE INDEX "wallet_transactions_referenceType_referenceId_idx" ON "wallet_transactions"("referenceType", "referenceId");

ALTER TABLE "vendor_wallets" ADD CONSTRAINT "vendor_wallets_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "wallet_transactions" ADD CONSTRAINT "wallet_transactions_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_wallets"("vendorUserId") ON DELETE CASCADE ON UPDATE CASCADE;
