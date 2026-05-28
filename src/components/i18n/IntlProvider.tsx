"use client";

import { NextIntlClientProvider } from "next-intl";
import { usePathname } from "next/navigation";
import { ReactNode, useMemo } from "react";
import enMessages from "@/messages/en.json";
import frMessages from "@/messages/fr.json";
import { getLocaleFromPathname } from "@/lib/i18n";

type Props = {
  children: ReactNode;
};

export function IntlProvider({ children }: Props) {
  const pathname = usePathname() || "/";
  const locale = getLocaleFromPathname(pathname);

  const messages = useMemo(
    () => (locale === "fr" ? frMessages : enMessages),
    [locale]
  );

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
