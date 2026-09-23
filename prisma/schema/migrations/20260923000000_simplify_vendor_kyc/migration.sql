-- Non-destructive migration: historical KYC columns remain in place, while
-- the application accepts and exposes only the simplified business fields.
ALTER TABLE "vendor_kyc"
ADD COLUMN "whatsappNumber" TEXT,
ADD COLUMN "primaryOperatingCity" TEXT,
ADD COLUMN "addressStreet" TEXT,
ADD COLUMN "addressLocality" TEXT,
ADD COLUMN "addressState" TEXT,
ADD COLUMN "addressPincode" TEXT;

-- These legacy fields are no longer supplied by new KYC submissions. Their
-- existing values are preserved; only the old NOT NULL requirement is lifted.
ALTER TABLE "vendor_kyc"
ALTER COLUMN "companyName" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "officeAddress" DROP NOT NULL;

UPDATE "vendor_kyc" AS k
SET
  "businessName" = COALESCE(k."businessName", k."companyName"),
  "whatsappNumber" = u."phone",
  "primaryOperatingCity" = k."officeCity",
  "addressStreet" = k."officeAddress",
  "addressState" = k."officeState"
FROM "users" AS u
WHERE u."id" = k."vendorUserId";
