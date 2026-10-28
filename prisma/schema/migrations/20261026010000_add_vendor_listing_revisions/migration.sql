CREATE TYPE "ListingRevisionStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'REJECTED', 'APPROVED', 'CANCELLED');

CREATE TABLE "vendor_listing_revisions" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "vendorUserId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "ListingRevisionStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_listing_revisions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "vendor_listing_revisions_listingId_status_idx"
ON "vendor_listing_revisions"("listingId", "status");

CREATE INDEX "vendor_listing_revisions_vendorUserId_status_idx"
ON "vendor_listing_revisions"("vendorUserId", "status");

CREATE INDEX "vendor_listing_revisions_status_submittedAt_idx"
ON "vendor_listing_revisions"("status", "submittedAt");

-- A listing can have only one editable/reviewable revision at a time while
-- retaining approved and cancelled revisions as history.
CREATE UNIQUE INDEX "vendor_listing_revisions_one_open_per_listing_idx"
ON "vendor_listing_revisions"("listingId")
WHERE "status" IN ('DRAFT', 'PENDING_REVIEW', 'REJECTED');

ALTER TABLE "vendor_listing_revisions"
ADD CONSTRAINT "vendor_listing_revisions_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "vendor_listings"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
