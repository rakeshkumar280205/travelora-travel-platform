/*
  Warnings:

  - A unique constraint covering the columns `[publishedVersionId]` on the table `Package` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "public"."Package" ADD COLUMN     "publishedVersionId" TEXT;

-- CreateTable
CREATE TABLE "public"."PackageVersion" (
    "id" TEXT NOT NULL,
    "packageId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "createdBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PackageVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PackageVersion_packageId_createdAt_idx" ON "public"."PackageVersion"("packageId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "PackageVersion_packageId_versionNumber_key" ON "public"."PackageVersion"("packageId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Package_publishedVersionId_key" ON "public"."Package"("publishedVersionId");

-- AddForeignKey
ALTER TABLE "public"."Package" ADD CONSTRAINT "Package_publishedVersionId_fkey" FOREIGN KEY ("publishedVersionId") REFERENCES "public"."PackageVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."PackageVersion" ADD CONSTRAINT "PackageVersion_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "public"."Package"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill the first immutable snapshot for every package that is currently published.
INSERT INTO "public"."PackageVersion" (
    "id",
    "packageId",
    "versionNumber",
    "snapshot",
    "createdBy"
)
SELECT
    'legacy-' || p."id" || '-v1',
    p."id",
    1,
    jsonb_build_object(
        'slug', p."slug",
        'title', p."title",
        'destination', p."destination",
        'durationDays', p."durationDays",
        'description', p."description",
        'category', p."category",
        'hotelCategory', p."hotelCategory",
        'seasonalPrices', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', sp."id",
                'seasonName', sp."seasonName",
                'startDate', sp."startDate",
                'endDate', sp."endDate",
                'amount', sp."amount"::text,
                'currency', sp."currency",
                'pricingBasis', sp."pricingBasis"
            ) ORDER BY sp."startDate")
            FROM "public"."SeasonalPrice" sp
            WHERE sp."packageId" = p."id"
        ), '[]'::jsonb),
        'itineraryDays', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'id', day."id",
                'dayNumber', day."dayNumber",
                'title', day."title",
                'description', day."description"
            ) ORDER BY day."dayNumber")
            FROM "public"."ItineraryDay" day
            WHERE day."packageId" = p."id"
        ), '[]'::jsonb)
    ),
    NULL
FROM "public"."Package" p
WHERE p."status" = 'PUBLISHED';

UPDATE "public"."Package" p
SET "publishedVersionId" = 'legacy-' || p."id" || '-v1'
WHERE p."status" = 'PUBLISHED';
