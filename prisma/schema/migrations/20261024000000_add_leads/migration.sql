CREATE TYPE "LeadType" AS ENUM ('DIRECT', 'SHARED');
CREATE TYPE "LeadSourceType" AS ENUM ('VENDOR_PROFILE', 'SERVICE_LISTING', 'VENUE_PROPERTY', 'GET_QUOTES');
CREATE TYPE "LeadStatus" AS ENUM ('PENDING_REVIEW', 'ACTIVE', 'SOLD_OUT', 'EXPIRED', 'CLOSED');

CREATE TABLE "leads" (
  "id" TEXT NOT NULL,
  "leadType" "LeadType" NOT NULL,
  "sourceType" "LeadSourceType" NOT NULL,
  "targetVendorUserId" TEXT,
  "serviceListingId" TEXT,
  "venuePropertyListingId" TEXT,
  "serviceCategoryId" TEXT,
  "serviceSubcategoryId" TEXT,
  "cityId" TEXT NOT NULL,
  "customerName" TEXT NOT NULL,
  "customerPhone" TEXT NOT NULL,
  "customerEmail" TEXT,
  "eventDate" TIMESTAMP(3),
  "guestCount" INTEGER,
  "budgetMin" INTEGER,
  "budgetMax" INTEGER,
  "message" TEXT,
  "basePrice" INTEGER,
  "maxBuyerCount" INTEGER NOT NULL DEFAULT 1,
  "soldCount" INTEGER NOT NULL DEFAULT 0,
  "status" "LeadStatus" NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "leads_targetVendorUserId_status_idx" ON "leads"("targetVendorUserId", "status");
CREATE INDEX "leads_status_leadType_idx" ON "leads"("status", "leadType");
CREATE INDEX "leads_cityId_status_idx" ON "leads"("cityId", "status");
CREATE INDEX "leads_serviceCategoryId_status_idx" ON "leads"("serviceCategoryId", "status");
CREATE INDEX "leads_serviceSubcategoryId_status_idx" ON "leads"("serviceSubcategoryId", "status");
CREATE INDEX "leads_serviceListingId_idx" ON "leads"("serviceListingId");
CREATE INDEX "leads_venuePropertyListingId_idx" ON "leads"("venuePropertyListingId");

ALTER TABLE "leads" ADD CONSTRAINT "leads_targetVendorUserId_fkey" FOREIGN KEY ("targetVendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_serviceListingId_fkey" FOREIGN KEY ("serviceListingId") REFERENCES "vendor_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_venuePropertyListingId_fkey" FOREIGN KEY ("venuePropertyListingId") REFERENCES "venue_property_listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "cities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_serviceCategoryId_fkey" FOREIGN KEY ("serviceCategoryId") REFERENCES "service_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "leads" ADD CONSTRAINT "leads_serviceSubcategoryId_fkey" FOREIGN KEY ("serviceSubcategoryId") REFERENCES "service_subcategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;
