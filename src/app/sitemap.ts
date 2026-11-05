import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/env";
import { getPublishedPackages } from "@/server/services/package-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  if (!siteUrl) return [];

  const packages = await getPublishedPackages();
  const baseUrl = siteUrl.toString().replace(/\/$/, "");

  return [
    {
      url: baseUrl,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${baseUrl}/packages`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...packages.map((packageRecord) => ({
      url: `${baseUrl}/packages/${encodeURIComponent(packageRecord.slug)}`,
      lastModified: packageRecord.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
