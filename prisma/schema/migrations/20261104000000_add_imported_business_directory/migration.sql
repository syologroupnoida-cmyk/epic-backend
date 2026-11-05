CREATE TYPE "ImportedBusinessStatus" AS ENUM ('NEW', 'CONTACTED', 'INTERESTED', 'REGISTERED', 'NOT_INTERESTED', 'INVALID');

CREATE TABLE "imported_businesses" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "keyword" TEXT,
    "location" TEXT,
    "businessName" TEXT NOT NULL,
    "category" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "emails" TEXT[],
    "address" TEXT,
    "city" TEXT,
    "state" TEXT,
    "pincode" TEXT,
    "rating" DECIMAL(2,1),
    "reviewCount" INTEGER,
    "googleCid" TEXT,
    "source" TEXT NOT NULL DEFAULT 'CSV_IMPORT',
    "status" "ImportedBusinessStatus" NOT NULL DEFAULT 'NEW',
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "salesNote" TEXT,
    "lastContactedAt" TIMESTAMP(3),
    "registeredVendorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "imported_businesses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "business_import_batches" (
    "id" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "importedRows" INTEGER NOT NULL,
    "duplicateRows" INTEGER NOT NULL,
    "failedRows" INTEGER NOT NULL,
    "errorSummary" JSONB,
    "uploadedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "business_import_batches_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "imported_businesses_slug_key" ON "imported_businesses"("slug");
CREATE UNIQUE INDEX "imported_businesses_googleCid_key" ON "imported_businesses"("googleCid");
CREATE UNIQUE INDEX "imported_businesses_registeredVendorUserId_key" ON "imported_businesses"("registeredVendorUserId");
CREATE INDEX "imported_businesses_isPublished_createdAt_idx" ON "imported_businesses"("isPublished", "createdAt");
CREATE INDEX "imported_businesses_status_createdAt_idx" ON "imported_businesses"("status", "createdAt");
CREATE INDEX "imported_businesses_businessName_idx" ON "imported_businesses"("businessName");
CREATE INDEX "imported_businesses_city_idx" ON "imported_businesses"("city");
CREATE INDEX "business_import_batches_createdAt_idx" ON "business_import_batches"("createdAt");
CREATE INDEX "business_import_batches_uploadedById_idx" ON "business_import_batches"("uploadedById");

ALTER TABLE "imported_businesses" ADD CONSTRAINT "imported_businesses_registeredVendorUserId_fkey" FOREIGN KEY ("registeredVendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE SET NULL ON UPDATE CASCADE;
