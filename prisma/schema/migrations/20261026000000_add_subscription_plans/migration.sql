CREATE TYPE "SubscriptionPlanKind" AS ENUM ('FREE', 'PAID');
CREATE TYPE "SubscriptionPlanTheme" AS ENUM ('BLUE', 'PURPLE', 'GOLD', 'DARK');

CREATE TABLE "subscription_plans" (
  "id" TEXT NOT NULL,
  "code" TEXT NOT NULL,
  "kind" "SubscriptionPlanKind" NOT NULL,
  "displayName" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "monthlyPrice" INTEGER NOT NULL,
  "directLeadPrice" INTEGER NOT NULL,
  "maxActiveServiceListings" INTEGER NOT NULL,
  "maxActiveVenueProperties" INTEGER NOT NULL,
  "maxDirectLeadPurchasesPerMonth" INTEGER NOT NULL,
  "maxSharedLeadPurchasesPerMonth" INTEGER NOT NULL,
  "maxMediaPerListing" INTEGER NOT NULL,
  "featuredListingSlots" INTEGER NOT NULL,
  "benefits" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "badgeText" TEXT,
  "theme" "SubscriptionPlanTheme" NOT NULL DEFAULT 'BLUE',
  "ctaText" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isFeatured" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT false,
  "isDefault" BOOLEAN NOT NULL DEFAULT false,
  "isPurchasable" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "subscription_plans_code_key" ON "subscription_plans"("code");
CREATE INDEX "subscription_plans_isActive_sortOrder_idx" ON "subscription_plans"("isActive", "sortOrder");
CREATE INDEX "subscription_plans_kind_isActive_idx" ON "subscription_plans"("kind", "isActive");
