ALTER TABLE "vendor_kyc"
ADD COLUMN "serviceCategoryIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "serviceSubcategoryIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
