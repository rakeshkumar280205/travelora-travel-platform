import "server-only";

import { prisma } from "@/server/db/client";

const packageInclude = {
  seasonalPrices: {
    orderBy: { startDate: "asc" as const },
  },
  itineraryDays: {
    orderBy: { dayNumber: "asc" as const },
  },
};

export async function listPublishedPackages() {
  return prisma.package.findMany({
    where: { status: "PUBLISHED" },
    include: packageInclude,
    orderBy: { createdAt: "desc" },
  });
}

export async function findPublishedPackageBySlug(slug: string) {
  return prisma.package.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: packageInclude,
  });
}

export async function listRelatedPublishedPackages(slug: string) {
  return prisma.package.findMany({
    where: {
      status: "PUBLISHED",
      slug: { not: slug },
    },
    include: packageInclude,
    orderBy: { createdAt: "desc" },
    take: 3,
  });
}

export async function listAllPackages() {
  return prisma.package.findMany({
    include: packageInclude,
    orderBy: { updatedAt: "desc" },
  });
}

export async function createPackage(
  data: Parameters<typeof prisma.package.create>[0]["data"]
) {
  return prisma.package.create({
    data,
    include: packageInclude,
  });
}

export async function updatePackage(
  id: string,
  data: Parameters<typeof prisma.package.update>[0]["data"]
) {
  return prisma.package.update({
    where: { id },
    data,
    include: packageInclude,
  });
}
