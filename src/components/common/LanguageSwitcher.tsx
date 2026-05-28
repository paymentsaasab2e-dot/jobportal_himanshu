"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppLocale, localizePath } from "@/lib/i18n";

const localeOptions: Array<{ value: AppLocale; label: string }> = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" }
];

export default function LanguageSwitcher({
  className
}: {
  className?: string;
}) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();

  const onLocaleChange = (nextLocale: AppLocale) => {
    const nextPath = localizePath(pathname, nextLocale);
    const query = searchParams.toString();
    router.push(query ? `${nextPath}?${query}` : nextPath);
  };

  return (
    <select
      aria-label="Select language"
      className={
        className ||
        "rounded-full border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700"
      }
      value={locale}
      onChange={(event) => onLocaleChange(event.target.value as AppLocale)}
    >
      {localeOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
