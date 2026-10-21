CREATE TABLE "venue_property_listings" (
    "id" TEXT NOT NULL,
    "vendorUserId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "startingPrice" INTEGER NOT NULL,
    "priceType" "ListingPriceType" NOT NULL DEFAULT 'STARTING_FROM',
    "cityId" TEXT NOT NULL,
    "address" JSONB NOT NULL,
    "capacityMin" INTEGER,
    "capacityMax" INTEGER,
    "rooms" INTEGER,
    "parkingCapacity" INTEGER,
    "amenities" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "metadata" JSONB,
    "status" "ListingStatus" NOT NULL DEFAULT 'DRAFT',
    "submittedAt" TIMESTAMP(3),
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "rejectionReason" TEXT,
    "pausedAt" TIMESTAMP(3),
    "pausedByAdminId" TEXT,
    "pauseReason" TEXT,
    "archivedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "venue_property_listings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "venue_property_types" (
    "id" TEXT NOT NULL,
    "venuePropertyId" TEXT NOT NULL,
    "serviceSubcategoryId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "venue_property_types_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "venue_property_media" (
    "id" TEXT NOT NULL,
    "venuePropertyId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "mediaType" "ListingMediaType" NOT NULL DEFAULT 'IMAGE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "venue_property_media_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "venue_property_listings_slug_key" ON "venue_property_listings"("slug");
CREATE INDEX "venue_property_listings_vendorUserId_status_idx" ON "venue_property_listings"("vendorUserId", "status");
CREATE INDEX "venue_property_listings_cityId_status_idx" ON "venue_property_listings"("cityId", "status");
CREATE INDEX "venue_property_listings_status_idx" ON "venue_property_listings"("status");
CREATE UNIQUE INDEX "venue_property_types_venuePropertyId_serviceSubcategoryId_key" ON "venue_property_types"("venuePropertyId", "serviceSubcategoryId");
CREATE INDEX "venue_property_types_serviceSubcategoryId_idx" ON "venue_property_types"("serviceSubcategoryId");
CREATE UNIQUE INDEX "venue_property_media_venuePropertyId_publicId_key" ON "venue_property_media"("venuePropertyId", "publicId");
CREATE INDEX "venue_property_media_venuePropertyId_sortOrder_idx" ON "venue_property_media"("venuePropertyId", "sortOrder");

ALTER TABLE "venue_property_listings" ADD CONSTRAINT "venue_property_listings_vendorUserId_fkey"
FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_property_listings" ADD CONSTRAINT "venue_property_listings_cityId_fkey"
FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "venue_property_types" ADD CONSTRAINT "venue_property_types_venuePropertyId_fkey"
FOREIGN KEY ("venuePropertyId") REFERENCES "venue_property_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "venue_property_types" ADD CONSTRAINT "venue_property_types_serviceSubcategoryId_fkey"
FOREIGN KEY ("serviceSubcategoryId") REFERENCES "service_subcategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "venue_property_media" ADD CONSTRAINT "venue_property_media_venuePropertyId_fkey"
FOREIGN KEY ("venuePropertyId") REFERENCES "venue_property_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
