CREATE TYPE "ContactUserType" AS ENUM ('CLIENT', 'VENDOR', 'GENERAL');
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

CREATE TABLE "contact_messages" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "userType" "ContactUserType" NOT NULL DEFAULT 'GENERAL',
  "subject" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
  "adminNote" TEXT,
  "handledByAdminId" TEXT,
  "handledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "contact_messages_status_createdAt_idx" ON "contact_messages"("status", "createdAt");
CREATE INDEX "contact_messages_userType_createdAt_idx" ON "contact_messages"("userType", "createdAt");
CREATE INDEX "contact_messages_handledByAdminId_idx" ON "contact_messages"("handledByAdminId");
