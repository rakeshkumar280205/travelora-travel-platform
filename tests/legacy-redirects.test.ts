import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const { getLegacyRedirect } = vi.hoisted(() => ({
  getLegacyRedirect: vi.fn(),
}));

vi.mock("@/config/legacy-redirects", () => ({ getLegacyRedirect }));

import { proxy } from "@/proxy";

describe("legacy redirect proxy", () => {
  it("preserves query strings on mapped redirects", () => {
    getLegacyRedirect.mockReturnValue("/packages/kerala-escape");
    const request = new NextRequest("https://travelora.example/old-journey?ref=campaign");

    const response = proxy(request);

    expect(response.status).toBe(308);
    expect(response.headers.get("location"))
      .toBe("https://travelora.example/packages/kerala-escape?ref=campaign");
  });

  it("does not redirect unmapped paths", () => {
    getLegacyRedirect.mockReturnValue(null);
    const response = proxy(new NextRequest("https://travelora.example/packages"));

    expect(response.status).toBe(200);
  });

  it("does not redirect a mapping back to the same path", () => {
    getLegacyRedirect.mockReturnValue("/packages");
    const response = proxy(new NextRequest("https://travelora.example/packages"));

    expect(response.status).toBe(200);
  });
});
