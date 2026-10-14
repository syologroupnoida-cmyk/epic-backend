ALTER TABLE "vendor_kyc"
ADD COLUMN "primaryCityId" TEXT;

CREATE INDEX "vendor_kyc_primaryCityId_idx"
ON "vendor_kyc"("primaryCityId");

ALTER TABLE "vendor_kyc"
ADD CONSTRAINT "vendor_kyc_primaryCityId_fkey"
FOREIGN KEY ("primaryCityId") REFERENCES "cities"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

-- Best-effort compatibility backfill for KYC rows created before city IDs
-- were collected. The legal-address state is intentionally not considered
-- because it may differ from the operating city. Only a single active name
-- match is accepted; ambiguous or unmatched names remain null for review.
WITH "legacyCityCandidates" AS (
    SELECT
        kyc."vendorUserId",
        city."id" AS "cityId",
        COUNT(*) OVER (PARTITION BY kyc."vendorUserId") AS "matchCount"
    FROM "vendor_kyc" AS kyc
    INNER JOIN "cities" AS city
        ON city."isActive" = true
       AND LOWER(BTRIM(city."name")) = LOWER(BTRIM(kyc."primaryOperatingCity"))
    WHERE kyc."primaryCityId" IS NULL
      AND NULLIF(BTRIM(kyc."primaryOperatingCity"), '') IS NOT NULL
)
UPDATE "vendor_kyc" AS kyc
SET "primaryCityId" = candidate."cityId"
FROM "legacyCityCandidates" AS candidate
WHERE kyc."vendorUserId" = candidate."vendorUserId"
  AND candidate."matchCount" = 1;
