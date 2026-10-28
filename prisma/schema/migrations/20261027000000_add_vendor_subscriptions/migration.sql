CREATE TYPE "VendorSubscriptionStatus" AS ENUM ('PENDING_PAYMENT', 'ACTIVE', 'EXPIRED', 'CANCELLED');

CREATE TABLE "vendor_subscriptions" (
  "id" TEXT NOT NULL,
  "vendorUserId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" "VendorSubscriptionStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
  "amount" INTEGER NOT NULL,
  "startedAt" TIMESTAMP(3),
  "endsAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vendor_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vendor_subscriptions_vendorUserId_status_endsAt_idx" ON "vendor_subscriptions"("vendorUserId", "status", "endsAt");
CREATE INDEX "vendor_subscriptions_planId_status_idx" ON "vendor_subscriptions"("planId", "status");

ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_subscriptions" ADD CONSTRAINT "vendor_subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "subscription_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
