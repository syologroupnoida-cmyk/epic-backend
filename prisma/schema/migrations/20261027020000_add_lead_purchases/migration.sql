CREATE TYPE "LeadPurchaseStatus" AS ENUM ('PAID', 'REFUNDED');

CREATE TABLE "lead_purchases" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "vendorUserId" TEXT NOT NULL,
  "subscriptionPlanId" TEXT,
  "amount" INTEGER NOT NULL,
  "status" "LeadPurchaseStatus" NOT NULL DEFAULT 'PAID',
  "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "lead_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "lead_purchases_leadId_vendorUserId_key" ON "lead_purchases"("leadId", "vendorUserId");
CREATE INDEX "lead_purchases_vendorUserId_purchasedAt_idx" ON "lead_purchases"("vendorUserId", "purchasedAt");
CREATE INDEX "lead_purchases_leadId_status_idx" ON "lead_purchases"("leadId", "status");

ALTER TABLE "lead_purchases" ADD CONSTRAINT "lead_purchases_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_purchases" ADD CONSTRAINT "lead_purchases_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "lead_purchases" ADD CONSTRAINT "lead_purchases_subscriptionPlanId_fkey" FOREIGN KEY ("subscriptionPlanId") REFERENCES "subscription_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;
