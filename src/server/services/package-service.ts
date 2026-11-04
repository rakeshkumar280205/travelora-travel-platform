import "server-only";

import type { Prisma } from "@prisma/client";

import { publishPackageSchema } from "@/lib/validation/package-schemas";
import type { PackageCreateInput, PackageUpdateInput } from "@/lib/validation/package-schemas";
import {
  createPackage,
  duplicatePackage,
  getDashboardData,
  findPublishedPackageBySlug,
  getPackageVersion,
  listPackageVersions,
  listRelatedPublishedPackages,
  listAllPackages,
  listPublishedPackages,
  publishPackage,
  rollbackPackage,
  toSnapshot,
  updatePackage,
} from "@/server/repositories/package-repository";

function toCreateData(data: PackageCreateInput): Prisma.PackageCreateInput {
  return {
    slug: data.slug,
    title: data.title,
    destination: data.destination,
    durationDays: data.durationDays,
    description: data.description,
    category: data.category,
    hotelCategory: data.hotelCategory,
    status: "DRAFT",
    seasonalPrices: { create: data.seasonalPrices },
    itineraryDays: { create: data.itineraryDays },
  };
}

function toUpdateData(data: PackageUpdateInput): Prisma.PackageUpdateInput {
  const packageData: Prisma.PackageUpdateInput = {};
  if (data.slug !== undefined) packageData.slug = data.slug;
  if (data.title !== undefined) packageData.title = data.title;
  if (data.destination !== undefined) packageData.destination = data.destination;
  if (data.durationDays !== undefined) packageData.durationDays = data.durationDays;
  if (data.description !== undefined) packageData.description = data.description;
  if (data.category !== undefined) packageData.category = data.category;
  if (data.hotelCategory !== undefined) packageData.hotelCategory = data.hotelCategory;
  if (data.seasonalPrices !== undefined) packageData.seasonalPrices = { deleteMany: {}, create: data.seasonalPrices };
  if (data.itineraryDays !== undefined) packageData.itineraryDays = { deleteMany: {}, create: data.itineraryDays };
  return packageData;
}

export async function getPublishedPackages() {
  return listPublishedPackages();
}

export async function getPublishedPackageBySlug(slug: string) {
  return findPublishedPackageBySlug(slug);
}

export async function getRelatedPublishedPackages(slug: string) {
  return listRelatedPublishedPackages(slug);
}

export async function getAdminPackages() {
  return listAllPackages();
}

export async function getAdminDashboardData() {
  return getDashboardData();
}

export async function addPackage(data: PackageCreateInput) {
  return createPackage(toCreateData(data));
}

export async function editPackage(id: string, data: PackageUpdateInput) {
  return updatePackage(id, toUpdateData(data));
}

export async function duplicatePackageRecord(id: string) {
  const source = await getAdminPackages();
  const packageRecord = source.find((item) => item.id === id);
  if (!packageRecord) throw new Error("PACKAGE_NOT_FOUND");
  const existingSlugs = new Set(source.map((item) => item.slug));
  const baseSlug = `${packageRecord.slug}-copy`;
  let slug = baseSlug;
  let suffix = 2;
  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
  return duplicatePackage(id, slug);
}

export async function publishPackageRecord(id: string, createdBy: string | null) {
  const packages = await getAdminPackages();
  const packageRecord = packages.find((item) => item.id === id);
  if (!packageRecord) throw new Error("PACKAGE_NOT_FOUND");
  const validated = publishPackageSchema.parse({
    title: packageRecord.title,
    slug: packageRecord.slug,
    destination: packageRecord.destination,
    durationDays: packageRecord.durationDays,
    seasonalPrices: packageRecord.seasonalPrices,
    itineraryDays: packageRecord.itineraryDays,
  });
  return publishPackage(id, createdBy, toSnapshot({
    ...packageRecord,
    ...validated,
    seasonalPrices: validated.seasonalPrices.map((price, index) => ({
      ...price,
      id: packageRecord.seasonalPrices[index].id,
    })),
    itineraryDays: validated.itineraryDays.map((day, index) => ({
      ...day,
      id: packageRecord.itineraryDays[index].id,
    })),
  }));
}

export async function getPackageVersionHistory(id: string) {
  return listPackageVersions(id);
}

export async function rollbackPackageVersion(id: string, versionId: string, createdBy: string | null) {
  const version = await getPackageVersion(id, versionId);
  if (!version) throw new Error("VERSION_NOT_FOUND");
  const snapshot = version.snapshot as {
    slug: string;
    title: string;
    destination: string;
    durationDays: number;
    description: string;
    category: string;
    hotelCategory: string;
    seasonalPrices: Array<{ id: string; seasonName: string; startDate: string; endDate: string; amount: string; currency: string; pricingBasis: string }>;
    itineraryDays: Array<{ id: string; dayNumber: number; title: string; description: string }>;
  };
  const validated = publishPackageSchema.parse({
    ...snapshot,
    seasonalPrices: snapshot.seasonalPrices.map((price) => ({
      ...price,
      startDate: new Date(price.startDate),
      endDate: new Date(price.endDate),
      amount: Number(price.amount),
    })),
  });
  return rollbackPackage(id, createdBy, {
    ...snapshot,
    ...validated,
    seasonalPrices: validated.seasonalPrices.map((price, index) => ({
      ...price,
      id: snapshot.seasonalPrices[index]?.id ?? `rollback-price-${index + 1}`,
      startDate: price.startDate.toISOString(),
      endDate: price.endDate.toISOString(),
      amount: String(price.amount),
    })),
    itineraryDays: validated.itineraryDays.map((day, index) => ({
      ...day,
      id: snapshot.itineraryDays[index]?.id ?? `rollback-day-${index + 1}`,
    })),
  });
}
