ALTER TABLE "vendor_kyc"
ADD COLUMN "contactPerson" TEXT,
ADD COLUMN "logoName" TEXT,
ADD COLUMN "description" TEXT,
ADD COLUMN "source" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
ADD COLUMN "sourceNote" TEXT,
ADD COLUMN "declaredDocumentStatus" JSONB;
