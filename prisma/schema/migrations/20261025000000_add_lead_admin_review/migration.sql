ALTER TYPE "LeadStatus" ADD VALUE IF NOT EXISTS 'REJECTED';

ALTER TABLE "leads"
  ADD COLUMN "reviewedAt" TIMESTAMP(3),
  ADD COLUMN "reviewedByAdminId" TEXT,
  ADD COLUMN "rejectionReason" TEXT,
  ADD COLUMN "closedAt" TIMESTAMP(3),
  ADD COLUMN "closedByAdminId" TEXT,
  ADD COLUMN "closureReason" TEXT;
