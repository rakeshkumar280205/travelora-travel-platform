import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

import { getLegacyRedirect } from "@/config/legacy-redirects";

export function proxy(request: NextRequest) {
  const targetPath = getLegacyRedirect(request.nextUrl.pathname);
  if (!targetPath) return NextResponse.next();

  const targetUrl = new URL(targetPath, request.url);
  if (!targetUrl.search) targetUrl.search = request.nextUrl.search;
  if (targetUrl.pathname === request.nextUrl.pathname) return NextResponse.next();

  return NextResponse.redirect(targetUrl, 308);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|sitemap.xml|robots.txt|.*\\..*).*)"],
};
