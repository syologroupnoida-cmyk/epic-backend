CREATE TABLE "listing_service_areas" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "listing_service_areas_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "listing_service_areas_listingId_cityId_key" ON "listing_service_areas"("listingId", "cityId");
CREATE INDEX "listing_service_areas_cityId_listingId_idx" ON "listing_service_areas"("cityId", "listingId");

ALTER TABLE "listing_service_areas" ADD CONSTRAINT "listing_service_areas_listingId_fkey"
FOREIGN KEY ("listingId") REFERENCES "vendor_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "listing_service_areas" ADD CONSTRAINT "listing_service_areas_cityId_fkey"
FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "listing_service_areas" ("id", "listingId", "cityId")
SELECT CONCAT('lsa_', "id"), "id", "cityId"
FROM "vendor_listings";
