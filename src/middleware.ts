import { NextRequest, NextResponse } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getLocaleFromPathname,
  isSupportedLocale
} from "@/lib/i18n";

function hasPublicFile(pathname: string): boolean {
  return /\.[a-zA-Z0-9]+$/.test(pathname);
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    hasPublicFile(pathname)
  ) {
    return NextResponse.next();
  }

  const localeFromPath = getLocaleFromPathname(pathname);
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  const hasLocalePrefix = isSupportedLocale(firstSegment);

  if (!hasLocalePrefix) {
    const cookieLocale = request.cookies.get(LOCALE_COOKIE)?.value;
    const locale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = pathname === "/" ? `/${locale}` : `/${locale}${pathname}`;
    return NextResponse.redirect(redirectUrl);
  }

  const internalPath = pathname.replace(/^\/(en|fr)(?=\/|$)/, "") || "/";
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = internalPath;

  const response = NextResponse.rewrite(rewriteUrl);
  response.cookies.set(LOCALE_COOKIE, localeFromPath, { path: "/" });
  return response;
}

export const config = {
  matcher: ["/((?!_next|api|.*\\..*).*)"]
};
