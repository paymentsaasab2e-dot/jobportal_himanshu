export const SUPPORTED_LOCALES = ["en", "fr"] as const;

export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: AppLocale = "en";

export const APP_TIME_ZONE = "Asia/Kolkata";

export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isSupportedLocale(value?: string | null): value is AppLocale {
  return !!value && SUPPORTED_LOCALES.includes(value as AppLocale);
}

export function getLocaleFromPathname(pathname: string): AppLocale {
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  return isSupportedLocale(firstSegment) ? firstSegment : DEFAULT_LOCALE;
}

export function stripLocaleFromPathname(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean);
  if (parts.length === 0) return "/";
  if (isSupportedLocale(parts[0])) {
    const rest = parts.slice(1).join("/");
    return rest ? `/${rest}` : "/";
  }
  return pathname.startsWith("/") ? pathname : `/${pathname}`;
}

export function localizePath(path: string, locale: AppLocale): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const unlocalized = stripLocaleFromPathname(normalized);
  return unlocalized === "/" ? `/${locale}` : `/${locale}${unlocalized}`;
}
