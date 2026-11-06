CREATE TYPE "VendorSalesMeetingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED', 'NO_SHOW');

CREATE TABLE "vendor_sales_meetings" (
  "id" TEXT NOT NULL,
  "vendorUserId" TEXT NOT NULL,
  "requestedStartAt" TIMESTAMP(3) NOT NULL,
  "requestedEndAt" TIMESTAMP(3) NOT NULL,
  "scheduledStartAt" TIMESTAMP(3),
  "scheduledEndAt" TIMESTAMP(3),
  "meetingUrl" TEXT,
  "vendorNote" TEXT,
  "vendorMessage" TEXT,
  "adminNote" TEXT,
  "status" "VendorSalesMeetingStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedByAdminId" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "vendor_sales_meetings_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vendor_sales_meetings_vendorUserId_status_requestedStartAt_idx" ON "vendor_sales_meetings"("vendorUserId", "status", "requestedStartAt");
CREATE INDEX "vendor_sales_meetings_status_scheduledStartAt_idx" ON "vendor_sales_meetings"("status", "scheduledStartAt");
CREATE INDEX "vendor_sales_meetings_reviewedByAdminId_idx" ON "vendor_sales_meetings"("reviewedByAdminId");

ALTER TABLE "vendor_sales_meetings"
ADD CONSTRAINT "vendor_sales_meetings_vendorUserId_fkey"
FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
