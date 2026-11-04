CREATE TYPE "EnquiryStatus" AS ENUM (
    'NEW',
    'IN_PROGRESS',
    'WAITING_FOR_CUSTOMER',
    'RESPONDED',
    'CONVERTED',
    'CLOSED'
);

CREATE TABLE "Enquiry" (
    "id" TEXT NOT NULL,
    "customerName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "packageId" TEXT,
    "destination" TEXT NOT NULL,
    "startDate" TIMESTAMP(3),
    "travelMonth" TEXT,
    "durationDays" INTEGER,
    "adults" INTEGER NOT NULL,
    "children" INTEGER,
    "budget" DECIMAL(12,2),
    "currency" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "assignedConsultantId" TEXT,
    "whatsappConsent" BOOLEAN NOT NULL DEFAULT false,
    "whatsappConsentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Enquiry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Enquiry_status_createdAt_idx" ON "Enquiry"("status", "createdAt");
CREATE INDEX "Enquiry_packageId_idx" ON "Enquiry"("packageId");
CREATE INDEX "Enquiry_assignedConsultantId_status_idx" ON "Enquiry"("assignedConsultantId", "status");
CREATE INDEX "Enquiry_email_createdAt_idx" ON "Enquiry"("email", "createdAt");

ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Enquiry" ADD CONSTRAINT "Enquiry_assignedConsultantId_fkey"
  FOREIGN KEY ("assignedConsultantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
