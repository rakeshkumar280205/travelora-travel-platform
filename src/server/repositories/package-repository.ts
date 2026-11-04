import "server-only";

import { prisma } from "@/server/db/client";

const packageInclude = {
  seasonalPrices: { orderBy: { startDate: "asc" as const } },
  itineraryDays: { orderBy: { dayNumber: "asc" as const } },
};

const publishedInclude = { publishedVersion: true };

export type PackageSnapshot = {
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  category: string;
  hotelCategory: string;
  seasonalPrices: Array<{
    id: string;
    seasonName: string;
    startDate: string;
    endDate: string;
    amount: string;
    currency: string;
    pricingBasis: string;
  }>;
  itineraryDays: Array<{
    id: string;
    dayNumber: number;
    title: string;
    description: string;
  }>;
};

function snapshotPackage(packageRecord: {
  id: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  publishedVersion: { id: string; versionNumber: number; snapshot: unknown } | null;
}) {
  if (!packageRecord.publishedVersion) return null;
  return {
    id: packageRecord.id,
    slug: (packageRecord.publishedVersion.snapshot as PackageSnapshot).slug,
    title: (packageRecord.publishedVersion.snapshot as PackageSnapshot).title,
    destination: (packageRecord.publishedVersion.snapshot as PackageSnapshot).destination,
    durationDays: (packageRecord.publishedVersion.snapshot as PackageSnapshot).durationDays,
    description: (packageRecord.publishedVersion.snapshot as PackageSnapshot).description,
    category: (packageRecord.publishedVersion.snapshot as PackageSnapshot).category,
    hotelCategory: (packageRecord.publishedVersion.snapshot as PackageSnapshot).hotelCategory,
    status: "PUBLISHED",
    createdAt: packageRecord.createdAt,
    updatedAt: packageRecord.updatedAt,
    seasonalPrices: (packageRecord.publishedVersion.snapshot as PackageSnapshot).seasonalPrices,
    itineraryDays: (packageRecord.publishedVersion.snapshot as PackageSnapshot).itineraryDays,
  };
}

export async function listPublishedPackages() {
  const packages = await prisma.package.findMany({
    where: { status: "PUBLISHED", publishedVersion: { isNot: null } },
    include: publishedInclude,
    orderBy: { createdAt: "desc" },
  });
  return packages.map(snapshotPackage).filter((item): item is NonNullable<typeof item> => item !== null);
}

export async function findPublishedPackageBySlug(slug: string) {
  const packages = await listPublishedPackages();
  return packages.find((item) => item.slug === slug) ?? null;
}

export async function listRelatedPublishedPackages(slug: string) {
  const packages = await listPublishedPackages();
  return packages.filter((item) => item.slug !== slug).slice(0, 3);
}

export async function listAllPackages() {
  return prisma.package.findMany({
    include: packageInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDashboardData() {
  const [totalPackages, publishedPackages, draftPackages, totalStaffUsers, recentPackages] =
    await Promise.all([
      prisma.package.count(),
      prisma.package.count({ where: { status: "PUBLISHED" } }),
      prisma.package.count({ where: { status: "DRAFT" } }),
      prisma.user.count(),
      prisma.package.findMany({
        select: { id: true, title: true, destination: true, durationDays: true, status: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 5,
      }),
    ]);
  return { stats: { totalPackages, publishedPackages, draftPackages, totalStaffUsers }, recentPackages };
}

export async function createPackage(data: Parameters<typeof prisma.package.create>[0]["data"]) {
  return prisma.package.create({ data, include: packageInclude });
}

export async function updatePackage(id: string, data: Parameters<typeof prisma.package.update>[0]["data"]) {
  return prisma.package.update({ where: { id }, data, include: packageInclude });
}

export async function duplicatePackage(id: string, slug: string) {
  return prisma.$transaction(async (transaction) => {
    const source = await transaction.package.findUnique({ where: { id }, include: packageInclude });
    if (!source) throw new Error("PACKAGE_NOT_FOUND");
    return transaction.package.create({
      data: {
        slug,
        title: `${source.title} (Copy)`,
        destination: source.destination,
        durationDays: source.durationDays,
        description: source.description,
        category: source.category,
        hotelCategory: source.hotelCategory,
        status: "DRAFT",
        seasonalPrices: { create: source.seasonalPrices.map(({ seasonName, startDate, endDate, amount, currency, pricingBasis }) => ({ seasonName, startDate, endDate, amount, currency, pricingBasis })) },
        itineraryDays: { create: source.itineraryDays.map(({ dayNumber, title, description }) => ({ dayNumber, title, description })) },
      },
      include: packageInclude,
    });
  });
}

export function toSnapshot(packageRecord: {
  slug: string;
  title: string;
  destination: string;
  durationDays: number;
  description: string;
  category: string;
  hotelCategory: string;
  seasonalPrices: Array<{ id: string; seasonName: string; startDate: Date; endDate: Date; amount: unknown; currency: string; pricingBasis: string }>;
  itineraryDays: Array<{ id: string; dayNumber: number; title: string; description: string }>;
}): PackageSnapshot {
  return {
    slug: packageRecord.slug,
    title: packageRecord.title,
    destination: packageRecord.destination,
    durationDays: packageRecord.durationDays,
    description: packageRecord.description,
    category: packageRecord.category,
    hotelCategory: packageRecord.hotelCategory,
    seasonalPrices: packageRecord.seasonalPrices.map((price) => ({ ...price, startDate: price.startDate.toISOString(), endDate: price.endDate.toISOString(), amount: String(price.amount) })),
    itineraryDays: packageRecord.itineraryDays,
  };
}

export async function publishPackage(id: string, createdBy: string | null, snapshot: PackageSnapshot) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      return await prisma.$transaction(async (transaction) => {
        const packageRecord = await transaction.package.findUnique({ where: { id } });
        if (!packageRecord) throw new Error("PACKAGE_NOT_FOUND");
        const latest = await transaction.packageVersion.aggregate({ where: { packageId: id }, _max: { versionNumber: true } });
        const version = await transaction.packageVersion.create({
          data: { packageId: id, versionNumber: (latest._max.versionNumber ?? 0) + 1, snapshot, createdBy },
        });
        await transaction.package.update({ where: { id }, data: { status: "PUBLISHED", publishedVersionId: version.id } });
        return version;
      }, { isolationLevel: "Serializable" });
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "P2034" && attempt < 2) continue;
      throw error;
    }

  }
  throw new Error("PUBLISH_RETRY_EXHAUSTED");
}

export async function rollbackPackage(
  id: string,
  createdBy: string | null,
  snapshot: PackageSnapshot,
) {
  return prisma.$transaction(async (transaction) => {
    const packageRecord = await transaction.package.findUnique({ where: { id } });
    if (!packageRecord) throw new Error("PACKAGE_NOT_FOUND");
    const latest = await transaction.packageVersion.aggregate({
      where: { packageId: id },
      _max: { versionNumber: true },
    });
    const version = await transaction.packageVersion.create({
      data: { packageId: id, versionNumber: (latest._max.versionNumber ?? 0) + 1, snapshot, createdBy },
    });
    await transaction.package.update({
      where: { id },
      data: {
        slug: snapshot.slug,
        title: snapshot.title,
        destination: snapshot.destination,
        durationDays: snapshot.durationDays,
        description: snapshot.description,
        category: snapshot.category,
        hotelCategory: snapshot.hotelCategory,
        status: "PUBLISHED",
        publishedVersionId: version.id,
        seasonalPrices: {
          deleteMany: {},
          create: snapshot.seasonalPrices.map(({ seasonName, startDate, endDate, amount, currency, pricingBasis }) => ({
            seasonName,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            amount,
            currency,
            pricingBasis,
          })),
        },
        itineraryDays: {
          deleteMany: {},
          create: snapshot.itineraryDays.map(({ dayNumber, title, description }) => ({
            dayNumber,
            title,
            description,
          })),
        },
      },
    });
    return version;
  }, { isolationLevel: "Serializable" });
}

export async function listPackageVersions(id: string) {
  return prisma.packageVersion.findMany({
    where: { packageId: id },
    select: { id: true, versionNumber: true, createdAt: true, createdBy: true, package: { select: { publishedVersionId: true } } },
    orderBy: { versionNumber: "desc" },
  });
}

export async function getPackageVersion(id: string, versionId: string) {
  return prisma.packageVersion.findFirst({ where: { id: versionId, packageId: id } });
}
