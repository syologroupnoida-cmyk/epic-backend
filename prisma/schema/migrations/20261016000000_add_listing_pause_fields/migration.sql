ALTER TABLE "vendor_listings"
ADD COLUMN "pausedAt" TIMESTAMP(3),
ADD COLUMN "pausedByAdminId" TEXT,
ADD COLUMN "pauseReason" TEXT;
