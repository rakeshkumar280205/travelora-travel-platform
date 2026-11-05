import type { MetadataRoute } from "next";

import { getSiteUrl } from "@/config/env";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const baseUrl = siteUrl?.toString().replace(/\/$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api"],
    },
    ...(baseUrl ? { sitemap: `${baseUrl}/sitemap.xml` } : {}),
  };
}
