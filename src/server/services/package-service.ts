import "server-only";

import type { Prisma } from "@prisma/client";

import {
  createPackage,
  findPublishedPackageBySlug,
  listRelatedPublishedPackages,
  listAllPackages,
  listPublishedPackages,
  updatePackage,
} from "@/server/repositories/package-repository";
import type {
  PackageCreateInput,
  PackageUpdateInput,
} from "@/lib/validation/package-schemas";

function toCreateData(data: PackageCreateInput): Prisma.PackageCreateInput {
  return {
    slug: data.slug,
    title: data.title,
    destination: data.destination,
    durationDays: data.durationDays,
    description: data.description,
    category: data.category,
    hotelCategory: data.hotelCategory,
    status: data.status,
    seasonalPrices: {
      create: data.seasonalPrices,
    },
    itineraryDays: {
      create: data.itineraryDays,
    },
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
  if (data.hotelCategory !== undefined) {
    packageData.hotelCategory = data.hotelCategory;
  }
  if (data.status !== undefined) packageData.status = data.status;
  if (data.seasonalPrices !== undefined) {
    packageData.seasonalPrices = {
      deleteMany: {},
      create: data.seasonalPrices,
    };
  }
  if (data.itineraryDays !== undefined) {
    packageData.itineraryDays = {
      deleteMany: {},
      create: data.itineraryDays,
    };
  }

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

export async function addPackage(data: PackageCreateInput) {
  return createPackage(toCreateData(data));
}

export async function editPackage(id: string, data: PackageUpdateInput) {
  return updatePackage(id, toUpdateData(data));
}
