CREATE TYPE "ListingStatus" AS ENUM ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'REJECTED', 'PAUSED');
CREATE TYPE "ListingPriceType" AS ENUM ('FIXED', 'STARTING_FROM', 'PER_PERSON', 'PER_PLATE', 'PER_DAY', 'CUSTOM');
CREATE TYPE "ListingMediaType" AS ENUM ('IMAGE', 'VIDEO');

CREATE TABLE "vendor_listings" (
    "id" TEXT NOT NULL,
    "vendorUserId" TEXT NOT NULL,
    "listingType" "OfferingKind" NOT NULL DEFAULT 'SERVICE',
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startingPrice" INTEGER NOT NULL,
    "priceType" "ListingPriceType" NOT NULL DEFAULT 'STARTING_FROM',
    "cityId" TEXT NOT NULL,
    "metadata" JSONB,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "rejectionReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_service_components" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "serviceSubcategoryId" TEXT NOT NULL,
    "price" INTEGER,
    "metadata" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "listing_service_components_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "listing_media" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "mediaType" "ListingMediaType" NOT NULL DEFAULT 'IMAGE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vendor_listings_slug_key" ON "vendor_listings"("slug");
CREATE INDEX "vendor_listings_vendorUserId_status_idx" ON "vendor_listings"("vendorUserId", "status");
CREATE INDEX "vendor_listings_cityId_status_idx" ON "vendor_listings"("cityId", "status");
CREATE INDEX "vendor_listings_status_listingType_idx" ON "vendor_listings"("status", "listingType");
CREATE UNIQUE INDEX "listing_service_components_listingId_serviceSubcategoryId_key" ON "listing_service_components"("listingId", "serviceSubcategoryId");
CREATE INDEX "listing_service_components_serviceSubcategoryId_idx" ON "listing_service_components"("serviceSubcategoryId");
CREATE UNIQUE INDEX "listing_media_listingId_publicId_key" ON "listing_media"("listingId", "publicId");
CREATE INDEX "listing_media_listingId_sortOrder_idx" ON "listing_media"("listingId", "sortOrder");

ALTER TABLE "vendor_listings" ADD CONSTRAINT "vendor_listings_vendorUserId_fkey"
FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendor_listings" ADD CONSTRAINT "vendor_listings_cityId_fkey"
FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "listing_service_components" ADD CONSTRAINT "listing_service_components_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_service_components" ADD CONSTRAINT "listing_service_components_serviceSubcategoryId_fkey"
FOREIGN KEY ("serviceSubcategoryId") REFERENCES "service_subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
