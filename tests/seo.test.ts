import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSiteUrl, getPublishedPackages } = vi.hoisted(() => ({
  getSiteUrl: vi.fn(),
  getPublishedPackages: vi.fn(),
}));

vi.mock("@/config/env", () => ({ getSiteUrl }));
vi.mock("@/server/services/package-service", () => ({ getPublishedPackages }));

import sitemap from "@/app/sitemap";
import robots from "@/app/robots";

describe("SEO metadata routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("includes only the homepage, listing and published package URLs", async () => {
    getSiteUrl.mockReturnValue(new URL("https://travelora.example/"));
    getPublishedPackages.mockResolvedValue([
      {
        slug: "kerala-escape",
        updatedAt: new Date("2026-11-01T00:00:00.000Z"),
      },
    ]);

    await expect(sitemap()).resolves.toEqual([
      expect.objectContaining({ url: "https://travelora.example" }),
      expect.objectContaining({ url: "https://travelora.example/packages" }),
      expect.objectContaining({ url: "https://travelora.example/packages/kerala-escape" }),
    ]);
  });

  it("does not invent URLs when the canonical site URL is not configured", async () => {
    getSiteUrl.mockReturnValue(null);

    await expect(sitemap()).resolves.toEqual([]);
    expect(getPublishedPackages).not.toHaveBeenCalled();
  });

  it("allows public pages and disallows admin and API routes", () => {
    getSiteUrl.mockReturnValue(new URL("https://travelora.example/"));

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
      sitemap: "https://travelora.example/sitemap.xml",
    });
  });

  it("omits a sitemap reference when the site URL is not configured", () => {
    getSiteUrl.mockReturnValue(null);

    expect(robots()).toEqual({
      rules: {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/api"],
      },
    });
  });
});
