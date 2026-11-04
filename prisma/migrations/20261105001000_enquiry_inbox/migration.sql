CREATE TYPE "EnquiryActivityType" AS ENUM (
    'CREATED',
    'STATUS_CHANGED',
    'ASSIGNED',
    'NOTE_ADDED',
    'REPLY_DRAFT_SAVED'
);

CREATE TABLE "EnquiryNote" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EnquiryNote_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EnquiryReply" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EnquiryReply_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "EnquiryActivity" (
    "id" TEXT NOT NULL,
    "enquiryId" TEXT NOT NULL,
    "actorId" TEXT,
    "type" "EnquiryActivityType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EnquiryActivity_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EnquiryNote_enquiryId_createdAt_idx" ON "EnquiryNote"("enquiryId", "createdAt");
CREATE INDEX "EnquiryReply_enquiryId_updatedAt_idx" ON "EnquiryReply"("enquiryId", "updatedAt");
CREATE INDEX "EnquiryActivity_enquiryId_createdAt_idx" ON "EnquiryActivity"("enquiryId", "createdAt");
CREATE INDEX "EnquiryActivity_type_createdAt_idx" ON "EnquiryActivity"("type", "createdAt");

ALTER TABLE "EnquiryNote" ADD CONSTRAINT "EnquiryNote_enquiryId_fkey"
  FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnquiryNote" ADD CONSTRAINT "EnquiryNote_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EnquiryReply" ADD CONSTRAINT "EnquiryReply_enquiryId_fkey"
  FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnquiryReply" ADD CONSTRAINT "EnquiryReply_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EnquiryActivity" ADD CONSTRAINT "EnquiryActivity_enquiryId_fkey"
  FOREIGN KEY ("enquiryId") REFERENCES "Enquiry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EnquiryActivity" ADD CONSTRAINT "EnquiryActivity_actorId_fkey"
  FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
