"use client";

import { NextIntlClientProvider } from "next-intl";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import {
  AppLocale,
  APP_TIME_ZONE,
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getLocaleFromPathname,
  isSupportedLocale,
} from "@/lib/i18n";

type Props = {
  children: ReactNode;
};

function readLocaleCookie(): AppLocale | null {
  if (typeof document === "undefined") return null;
  const entry = document.cookie
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${LOCALE_COOKIE}=`));
  const value = entry?.split("=")[1];
  return isSupportedLocale(value) ? value : null;
}

export function IntlProvider({ children }: Props) {
  const pathname = usePathname() || "/";
  const pathLocale = getLocaleFromPathname(pathname);
  const pathHasLocale = isSupportedLocale(pathname.split("/").filter(Boolean)[0]);
  const [cookieLocale, setCookieLocale] = useState<AppLocale | null>(null);

  useEffect(() => {
    setCookieLocale(readLocaleCookie());
  }, [pathname]);

  const locale: AppLocale = pathHasLocale ? pathLocale : cookieLocale ?? pathLocale ?? DEFAULT_LOCALE;

  const messages = useMemo(
    () => (locale === "fr" ? frMessages : enMessages),
    [locale]
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={APP_TIME_ZONE}>
      {children}
    </NextIntlClientProvider>
  );
}
