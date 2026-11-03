CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'EDITOR', 'CONSULTANT');
CREATE TYPE "PackageStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CONSULTANT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Package" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "hotelCategory" TEXT NOT NULL,
    "status" "PackageStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Package_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeasonalPrice" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "seasonName" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "pricingBasis" TEXT NOT NULL,
    CONSTRAINT "SeasonalPrice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Package_slug_key" ON "Package"("slug");
CREATE INDEX "SeasonalPrice_packageId_idx" ON "SeasonalPrice"("packageId");
CREATE UNIQUE INDEX "ItineraryDay_packageId_dayNumber_key" ON "ItineraryDay"("packageId", "dayNumber");
CREATE INDEX "ItineraryDay_packageId_idx" ON "ItineraryDay"("packageId");

ALTER TABLE "SeasonalPrice" ADD CONSTRAINT "SeasonalPrice_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_packageId_fkey"
  FOREIGN KEY ("packageId") REFERENCES "Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;
