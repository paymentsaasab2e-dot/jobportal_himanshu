"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { useLocale } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppLocale, localizePath } from "@/lib/i18n";

const localeOptions: Array<{ value: AppLocale; label: string }> = [
  { value: "en", label: "EN" },
  { value: "fr", label: "FR" },
];

/** Matches header nav: .app-header-nav-link (13px / medium weight). */
const triggerClassName =
  "app-header-nav-link inline-flex min-w-[4.25rem] items-center justify-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-slate-600 transition-colors hover:border-slate-400 hover:text-slate-800";

const menuItemClassName =
  "app-header-nav-link block w-full px-3 py-1.5 text-center text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900";

function LanguageSwitcherSelect({ className }: { className?: string }) {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname() || "/";
  const searchParams = useSearchParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const current = localeOptions.find((o) => o.value === locale) ?? localeOptions[0];

  useEffect(() => {
    if (!open) return undefined;
    const onOutside = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onOutside);
    return () => document.removeEventListener("mousedown", onOutside);
  }, [open]);

  const onLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      setOpen(false);
      return;
    }
    const nextPath = localizePath(pathname, nextLocale);
    const query = searchParams.toString();
    router.push(query ? `${nextPath}?${query}` : nextPath);
    setOpen(false);
  };

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        aria-label="Select language"
        aria-expanded={open}
        aria-haspopup="listbox"
        className={className || triggerClassName}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span>{current.label}</span>
        <ChevronDown
          size={14}
          strokeWidth={2.25}
          className={`shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label="Language options"
          className="absolute left-0 top-[calc(100%+4px)] z-[200] min-w-full overflow-hidden rounded-lg border border-slate-200 bg-white py-0.5 shadow-lg"
        >
          {localeOptions.map((option) => {
            const active = option.value === locale;
            return (
              <li key={option.value} role="option" aria-selected={active}>
                <button
                  type="button"
                  className={`${menuItemClassName} ${active ? "bg-[#28A8E1]/10 text-[#1d7eb0]" : ""}`}
                  onClick={() => onLocaleChange(option.value)}
                >
                  {option.label}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function LanguageSwitcherFallback({ className }: { className?: string }) {
  return (
    <button
      type="button"
      aria-label="Select language"
      disabled
      className={className || triggerClassName}
    >
      <span>EN</span>
      <ChevronDown size={14} strokeWidth={2.25} className="shrink-0 text-slate-400" aria-hidden />
    </button>
  );
}

export default function LanguageSwitcher({ className }: { className?: string }) {
  return (
    <Suspense fallback={<LanguageSwitcherFallback className={className} />}>
      <LanguageSwitcherSelect className={className} />
    </Suspense>
  );
}
