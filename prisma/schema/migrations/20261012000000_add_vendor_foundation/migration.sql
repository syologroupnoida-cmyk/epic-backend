CREATE TYPE "OfferingKind" AS ENUM ('SERVICE', 'VENUE_PROPERTY');

CREATE TYPE "VendorProfileStatus" AS ENUM ('DRAFT', 'ACTIVE', 'SUSPENDED');

CREATE TYPE "CapabilityStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'INACTIVE');

CREATE TYPE "CapabilitySource" AS ENUM ('KYC', 'VENDOR_REQUEST', 'ADMIN');

ALTER TABLE "service_categories"
ADD COLUMN "offeringKind" "OfferingKind" NOT NULL DEFAULT 'SERVICE',
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "service_subcategories"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE "vendor_profiles"
ADD COLUMN "businessName" TEXT,
ADD COLUMN "slug" TEXT,
ADD COLUMN "about" TEXT,
ADD COLUMN "logoUrl" TEXT,
ADD COLUMN "logoPublicId" TEXT,
ADD COLUMN "primaryCityId" TEXT,
ADD COLUMN "profileStatus" "VendorProfileStatus" NOT NULL DEFAULT 'DRAFT';

CREATE TABLE "cities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "stateName" TEXT NOT NULL,
    "countryCode" TEXT NOT NULL DEFAULT 'IN',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "cities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_capabilities" (
    "id" TEXT NOT NULL,
    "vendorUserId" TEXT NOT NULL,
    "serviceSubcategoryId" TEXT NOT NULL,
    "status" "CapabilityStatus" NOT NULL DEFAULT 'PENDING',
    "source" "CapabilitySource" NOT NULL DEFAULT 'KYC',
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "vendor_capabilities_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "service_categories_offeringKind_isActive_idx" ON "service_categories"("offeringKind", "isActive");

CREATE INDEX "service_subcategories_isActive_idx" ON "service_subcategories"("isActive");

CREATE UNIQUE INDEX "vendor_profiles_slug_key" ON "vendor_profiles"("slug");

CREATE INDEX "vendor_profiles_profileStatus_idx" ON "vendor_profiles"("profileStatus");

CREATE INDEX "vendor_profiles_primaryCityId_idx" ON "vendor_profiles"("primaryCityId");

CREATE UNIQUE INDEX "cities_slug_key" ON "cities"("slug");

CREATE INDEX "cities_isActive_idx" ON "cities"("isActive");

CREATE UNIQUE INDEX "cities_name_stateName_countryCode_key" ON "cities"("name", "stateName", "countryCode");

CREATE INDEX "vendor_capabilities_vendorUserId_status_idx" ON "vendor_capabilities"("vendorUserId", "status");

CREATE INDEX "vendor_capabilities_serviceSubcategoryId_status_idx" ON "vendor_capabilities"("serviceSubcategoryId", "status");

CREATE UNIQUE INDEX "vendor_capabilities_vendorUserId_serviceSubcategoryId_key" ON "vendor_capabilities"("vendorUserId", "serviceSubcategoryId");

ALTER TABLE "vendor_profiles"
ADD CONSTRAINT "vendor_profiles_primaryCityId_fkey"
FOREIGN KEY ("primaryCityId") REFERENCES "cities"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "vendor_capabilities"
ADD CONSTRAINT "vendor_capabilities_vendorUserId_fkey"
FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "vendor_capabilities"
ADD CONSTRAINT "vendor_capabilities_serviceSubcategoryId_fkey"
FOREIGN KEY ("serviceSubcategoryId") REFERENCES "service_subcategories"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;

-- Existing approved vendors have already passed the approval boundary. Build
-- their editable public drafts without changing the historical KYC snapshot.
UPDATE "vendor_profiles" AS profile
SET
    "businessName" = COALESCE(
        NULLIF(BTRIM(kyc."businessName"), ''),
        NULLIF(BTRIM(kyc."companyName"), '')
    ),
    "about" = NULLIF(BTRIM(kyc."description"), ''),
    "slug" = CONCAT(
        COALESCE(
            NULLIF(
                BTRIM(
                    LOWER(
                        REGEXP_REPLACE(
                            COALESCE(
                                NULLIF(BTRIM(kyc."businessName"), ''),
                                NULLIF(BTRIM(kyc."companyName"), ''),
                                'vendor'
                            ),
                            '[^a-zA-Z0-9]+',
                            '-',
                            'g'
                        )
                    ),
                    '-'
                ),
                ''
            ),
            'vendor'
        ),
        '-',
        LOWER(profile."userId")
    ),
    "profileStatus" = 'DRAFT'
FROM "vendor_kyc" AS kyc
WHERE kyc."vendorUserId" = profile."userId"
  AND profile."kycStatus" = 'APPROVED';

-- Convert valid approved KYC subcategory selections into queryable capability
-- rows. Stale IDs are skipped and remain visible in the KYC audit snapshot.
INSERT INTO "vendor_capabilities" (
    "id",
    "vendorUserId",
    "serviceSubcategoryId",
    "status",
    "source",
    "reviewedAt",
    "reviewedByAdminId",
    "createdAt",
    "updatedAt"
)
SELECT
    CONCAT('backfill_', MD5(profile."userId" || ':' || selected."serviceSubcategoryId")),
    profile."userId",
    selected."serviceSubcategoryId",
    'APPROVED',
    'KYC',
    COALESCE(kyc."reviewedAt", CURRENT_TIMESTAMP),
    kyc."reviewedByAdminId",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "vendor_profiles" AS profile
INNER JOIN "vendor_kyc" AS kyc
    ON kyc."vendorUserId" = profile."userId"
CROSS JOIN LATERAL UNNEST(kyc."serviceSubcategoryIds")
    AS selected("serviceSubcategoryId")
INNER JOIN "service_subcategories" AS subcategory
    ON subcategory."id" = selected."serviceSubcategoryId"
WHERE profile."kycStatus" = 'APPROVED'
ON CONFLICT ("vendorUserId", "serviceSubcategoryId") DO NOTHING;
