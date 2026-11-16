ALTER TYPE "PaymentStatus" ADD VALUE IF NOT EXISTS 'REFUND_PENDING';

ALTER TABLE "payments"
  ADD COLUMN IF NOT EXISTS "gatewayRefundId" TEXT,
  ADD COLUMN IF NOT EXISTS "refundAmountPaise" INTEGER,
  ADD COLUMN IF NOT EXISTS "refundStatus" TEXT,
  ADD COLUMN IF NOT EXISTS "refundRequestedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "refundedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_gatewayRefundId_key" ON "payments"("gatewayRefundId");
