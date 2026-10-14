ALTER TABLE "vendor_kyc"
ADD COLUMN "addressCity" TEXT,
ADD COLUMN "addressCountryCode" TEXT NOT NULL DEFAULT 'IN';

-- Preserve any usable city value from the older office-address fields.
UPDATE "vendor_kyc"
SET "addressCity" = NULLIF(BTRIM("officeCity"), '')
WHERE "addressCity" IS NULL
  AND NULLIF(BTRIM("officeCity"), '') IS NOT NULL;
