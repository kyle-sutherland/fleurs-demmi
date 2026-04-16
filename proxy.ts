import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const LOCALES = ["en", "fr"];
const DEFAULT_LOCALE = "en";

export function proxy(request: NextRequest): Response {
  const { pathname } = request.nextUrl;

  // Pass through static assets and internal Next.js routes untouched
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Already has a valid locale prefix — set header and continue
  const firstSegment = pathname.split("/")[1];
  if (LOCALES.includes(firstSegment)) {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-locale", firstSegment);
    return NextResponse.next({
      request: { headers: requestHeaders },
    });
  }

  // Redirect bare paths to the default locale
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === "/" ? "" : pathname}`;
  return Response.redirect(url.toString(), 307);
}
