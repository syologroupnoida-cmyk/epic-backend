-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'VENDOR', 'CLIENT');

-- CreateEnum
CREATE TYPE "EmailOtpPurpose" AS ENUM ('EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN_2FA', 'AADHAAR_VERIFICATION');

-- CreateEnum
CREATE TYPE "KycStatus" AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('LOCAL', 'GOOGLE', 'HYBRID');

-- CreateEnum
CREATE TYPE "CompanyType" AS ENUM ('PROPRIETORSHIP', 'PARTNERSHIP', 'LLP', 'PVT_LTD', 'PUBLIC_LTD', 'OTHER');

-- CreateEnum
CREATE TYPE "ReferralSource" AS ENUM ('REFERENCE', 'GOOGLE', 'SOCIAL_MEDIA', 'ADVERTISEMENT', 'OTHER');

-- CreateEnum
CREATE TYPE "KycDocumentType" AS ENUM ('PAN', 'GSTIN', 'CIN', 'AADHAR', 'OTHER');

-- CreateEnum
CREATE TYPE "VendorType" AS ENUM ('TRAVEL_AGENT', 'PROPERTY_OWNER');

-- CreateTable
CREATE TABLE "customer_profiles" (
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateTable
CREATE TABLE "email_otps" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "codeHash" TEXT NOT NULL,
    "purpose" "EmailOtpPurpose" NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "consumedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isRevoked" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "password" TEXT,
    "googleId" TEXT,
    "avatarUrl" TEXT,
    "authProvider" "AuthProvider" NOT NULL DEFAULT 'LOCAL',
    "role" "UserRole" NOT NULL DEFAULT 'CLIENT',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "emailVerifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_kyc" (
    "vendorUserId" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "businessName" TEXT,
    "companyType" "CompanyType",
    "companySinceYears" INTEGER,
    "teamSize" INTEGER,
    "companyLogoUrl" TEXT,
    "country" TEXT NOT NULL,
    "officeAddress" TEXT NOT NULL,
    "officeCity" TEXT,
    "officeState" TEXT,
    "services" TEXT[],
    "destinations" TEXT[],
    "dailyLeadRequirement" INTEGER,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "referralSource" "ReferralSource",
    "otherSource" TEXT,
    "marketplaceWorked" BOOLEAN NOT NULL DEFAULT false,
    "agreedTerms" BOOLEAN NOT NULL DEFAULT false,
    "declaredTrue" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "reviewedByAdminId" TEXT,
    "rejectionReason" TEXT,

    CONSTRAINT "vendor_kyc_pkey" PRIMARY KEY ("vendorUserId")
);

-- CreateTable
CREATE TABLE "vendor_kyc_documents" (
    "id" TEXT NOT NULL,
    "vendorUserId" TEXT NOT NULL,
    "type" "KycDocumentType" NOT NULL,
    "documentNumber" TEXT,
    "documentUrl" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verifiedAt" TIMESTAMP(3),
    "verifiedByAdminId" TEXT,
    "notes" TEXT,
    "thirdPartyVerified" BOOLEAN NOT NULL DEFAULT false,
    "thirdPartyProvider" TEXT,
    "thirdPartyVerifiedAt" TIMESTAMP(3),
    "thirdPartyResponse" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_kyc_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendor_profiles" (
    "userId" TEXT NOT NULL,
    "vendorType" "VendorType" NOT NULL DEFAULT 'TRAVEL_AGENT',
    "kycStatus" "KycStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_profiles_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "email_otps_userId_purpose_idx" ON "email_otps"("userId", "purpose");

-- CreateIndex
CREATE INDEX "email_otps_expiresAt_idx" ON "email_otps"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_key" ON "refresh_tokens"("token");

-- CreateIndex
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");

-- CreateIndex
CREATE INDEX "refresh_tokens_expiresAt_idx" ON "refresh_tokens"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_googleId_key" ON "users"("googleId");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE UNIQUE INDEX "vendor_kyc_documents_vendorUserId_type_key" ON "vendor_kyc_documents"("vendorUserId", "type");

-- CreateIndex
CREATE INDEX "vendor_profiles_kycStatus_idx" ON "vendor_profiles"("kycStatus");

-- CreateIndex
CREATE INDEX "vendor_profiles_vendorType_idx" ON "vendor_profiles"("vendorType");

-- AddForeignKey
ALTER TABLE "customer_profiles" ADD CONSTRAINT "customer_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_otps" ADD CONSTRAINT "email_otps_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_kyc" ADD CONSTRAINT "vendor_kyc_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_kyc_documents" ADD CONSTRAINT "vendor_kyc_documents_vendorUserId_fkey" FOREIGN KEY ("vendorUserId") REFERENCES "vendor_profiles"("userId") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendor_profiles" ADD CONSTRAINT "vendor_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
