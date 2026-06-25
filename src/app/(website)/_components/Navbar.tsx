"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { LANDING_SCROLL_EVENT } from "@/hooks/useLandingSmoothScroll";
import { AppLocale, localizePath, stripLocaleFromPathname } from "@/lib/i18n";
import {
  EMPLOYERS_TRIAL_PATH,
  EMPLOYERS_LOGIN_HREF,
} from "@/lib/employers/constants";

const navLinks = [
  { key: "exploreJobs", href: "/" },
  { key: "employers", href: "/employers" },
  { key: "services", href: "/services" },
] as const;

const MARKETING_NAV_PILL_ID = "website-nav-marketing-pill";

function isNavLinkActive(normalizedPath: string, href: string) {
  if (href === "/") return normalizedPath === "/";
  return normalizedPath === href || normalizedPath.startsWith(`${href}/`);
}

function navPillClass(linkKey: (typeof navLinks)[number]["key"]) {
  return linkKey === "employers"
    ? "from-[#E8770E] to-[#FC9620] shadow-[0_8px_22px_rgba(252,150,32,0.38)]"
    : "from-[#08428c] to-[#28a8e1] shadow-[0_8px_22px_rgba(8,66,140,0.35)]";
}

export default function WebsiteNavbar() {
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const t = useTranslations();
  const tEmployers = useTranslations("employersNav");
  const normalizedPath = stripLocaleFromPathname(pathname || "/");
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const employersLoginHref = EMPLOYERS_LOGIN_HREF;
  const employersTrialHref = localizePath(EMPLOYERS_TRIAL_PATH, locale);
  const isEmployersPage = normalizedPath === "/employers" || normalizedPath.startsWith("/employers/");
  const isEmployersLandingPage = normalizedPath === "/employers";
  const isServicesPage = normalizedPath === "/services" || normalizedPath.startsWith("/services/");
  const loginSignupHref = isEmployersPage ? employersLoginHref : localizePath("/whatsapp", locale);

  const isHomePage = normalizedPath === "/";
  const activeIndex = navLinks.findIndex((l) => isNavLinkActive(normalizedPath, l.href));
  const currentIndex = activeIndex;
  const isTopOfPage = !isScrolled;
  const isEmployersTransparent = isEmployersLandingPage && isTopOfPage;
  const isHomeTransparent = isHomePage && isTopOfPage;
  const isLightMarketingNav = isHomeTransparent || (isEmployersPage && !isEmployersLandingPage);
  const isNavbarShellTransparent = isEmployersTransparent || isHomeTransparent;
  const hasMountedPath = useRef(false);

  const navLinkTextClass = (isActive: boolean) => {
    if (isActive) return "text-white";
    if (isEmployersTransparent) return "text-white/80! hover:text-white!";
    return "text-slate-700 hover:text-slate-900";
  };

  useEffect(() => {
    const updateScrolled = (scrollTop: number) => setIsScrolled(scrollTop > 24);

    const handleWindowScroll = () => updateScrolled(window.scrollY);
    const handleLenisScroll = (event: Event) => {
      const detail = (event as CustomEvent<{ scroll: number }>).detail;
      updateScrolled(detail?.scroll ?? window.scrollY);
    };

    updateScrolled(window.scrollY);
    window.addEventListener("scroll", handleWindowScroll, { passive: true });
    window.addEventListener(LANDING_SCROLL_EVENT, handleLenisScroll as EventListener);

    return () => {
      window.removeEventListener("scroll", handleWindowScroll);
      window.removeEventListener(LANDING_SCROLL_EVENT, handleLenisScroll as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!hasMountedPath.current) {
      hasMountedPath.current = true;
      return;
    }

    try {
      const lenis = window.__landingLenis;
      if (lenis && typeof lenis.scrollTo === "function") {
        lenis.scrollTo(0, { immediate: true });
        return;
      }
    } catch {
      // fall through to native scroll
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [normalizedPath]);

  useEffect(() => {
    const lenis = window.__landingLenis;
    if (!lenis) return;
    if (isMobileMenuOpen) lenis.stop();
    else lenis.start();
  }, [isMobileMenuOpen]);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-500 flex justify-center px-3 sm:px-4 transition-all duration-500 ease-out ${
        isScrolled ? "py-2" : "py-2.5"
      }`}
    >
      <div
        className={`relative grid grid-cols-[1fr_auto_1fr] items-center rounded-[26px] border transition-[width,padding,box-shadow,border-color,background,backdrop-filter] duration-500 ease-out ${
          isNavbarShellTransparent
            ? "w-[min(1680px,96vw)] px-4 sm:px-5 lg:px-8 border-transparent bg-transparent shadow-none backdrop-blur-none"
            : isScrolled
              ? "w-[min(880px,78vw)] px-3 sm:px-4 border-white/75 bg-white/50 backdrop-blur-2xl shadow-[0_14px_40px_rgba(8,66,140,0.14),inset_0_1px_0_rgba(255,255,255,0.92)]"
              : "w-[min(1680px,96vw)] px-4 sm:px-5 lg:px-8 border-white/55 bg-white/28 backdrop-blur-xl shadow-[0_10px_34px_rgba(40,168,225,0.1),inset_0_1px_0_rgba(255,255,255,0.8)]"
        }`}
      >
        <div className="justify-self-start shrink-0">
          <Link href={localizePath("/", locale)} className="relative flex items-center group w-fit">
            <div
              className={`relative transition-all duration-500 ${
                isScrolled ? "h-8 w-28" : "h-9 w-32"
              }`}
            >
              <Image
                src="/SAASA%20Logo.png"
                alt="SAASA B2E"
                fill
                className="object-contain object-left"
                priority
              />
            </div>
          </Link>
        </div>

        <div
          className={`hidden md:inline-flex items-center relative rounded-full transition-all duration-500 justify-self-center ${
            isEmployersTransparent
              ? "border border-white/15 bg-white/5 backdrop-blur-sm p-1.5"
              : isLightMarketingNav
                ? "border border-slate-200/80 bg-white/60 shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-xl p-1.5"
                : `border border-white/65 bg-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] backdrop-blur-xl ${isScrolled ? "p-1" : "p-1.5"}`
          }`}
        >
          {navLinks.map((link, i) => {
            const isActive = currentIndex === i;
            const href = localizePath(link.href, locale);
            return (
              <Link
                key={link.key}
                href={href}
                prefetch
                className={`relative z-10 inline-flex items-center justify-center rounded-full font-semibold whitespace-nowrap text-center transition-colors duration-300 ${
                  isScrolled ? "min-h-[34px] px-4 text-[14px]" : "min-h-[38px] px-5 text-[15px]"
                } ${navLinkTextClass(isActive)}`}
              >
                {isActive && (
                  <motion.span
                    layoutId={MARKETING_NAV_PILL_ID}
                    className={`absolute inset-0 rounded-full bg-linear-to-r ${navPillClass(link.key)}`}
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative z-10 leading-none">{t(`nav.${link.key}`)}</span>
              </Link>
            );
          })}
        </div>

        <div className="hidden md:flex items-center justify-end justify-self-end gap-3 shrink-0">
          {isEmployersPage && (
            <Link
              href={employersTrialHref}
              className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-bold transition-all duration-500 ${
                isScrolled ? "px-4 py-1.5 text-[13px]" : "px-5 py-2 text-[14px]"
              } ${
                isEmployersTransparent
                  ? "bg-linear-to-r from-[#E8770E] to-[#FC9620] text-white shadow-[0_8px_22px_rgba(252,150,32,0.38)] hover:brightness-105"
                  : "bg-linear-to-r from-[#E8770E] to-[#FC9620] text-white shadow-[0_8px_22px_rgba(252,150,32,0.32)] hover:brightness-105"
              }`}
            >
              {tEmployers("tryItFree")}
            </Link>
          )}
          {!isServicesPage && (
            <Link
              href={loginSignupHref}
              className={`inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-full font-bold backdrop-blur-xl transition-all duration-500 ${
                isScrolled ? "px-4 py-1.5 text-[14px]" : "px-6 py-2 text-[15px]"
              } ${
                isEmployersTransparent
                  ? "border border-white/30 bg-white/10 text-white! shadow-none hover:bg-white/20 hover:text-white!"
                  : "border border-white/75 bg-white/40 text-slate-900! shadow-[inset_0_1px_0_rgba(255,255,255,0.88)] hover:bg-white/65 hover:text-[#08428c]!"
              }`}
            >
              {t("common.login")}
            </Link>
          )}
          <LanguageSwitcher
            className={
              isEmployersTransparent
                ? "inline-flex min-w-17 items-center justify-center gap-1 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:border-white/50 hover:bg-white/15"
                : undefined
            }
          />
        </div>

        <button
          type="button"
          className={`md:hidden justify-self-end col-start-3 p-2 transition-colors ${
            isEmployersTransparent
              ? "text-white hover:text-white/80"
              : "text-slate-700 hover:text-[#08428c]"
          }`}
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {isMobileMenuOpen && (
          <div
            data-lenis-prevent
            className="md:hidden absolute top-[calc(100%+8px)] left-0 right-0 rounded-[24px] border border-white/65 bg-white/45 backdrop-blur-2xl shadow-[0_18px_40px_rgba(15,23,42,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 max-h-[calc(100vh-90px)] overflow-y-auto"
          >
            {navLinks.map((link) => (
              <div key={link.key} className="flex flex-col gap-2">
                <Link
                  href={localizePath(link.href, locale)}
                  prefetch
                  className={`text-lg font-bold ${isNavLinkActive(normalizedPath, link.href) ? (link.key === "employers" ? "text-[#E8770E]" : "text-[#08428c]") : "text-slate-800"}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t(`nav.${link.key}`)}
                </Link>
              </div>
            ))}
            <div className="h-px bg-white/70 my-2" />
            {!isServicesPage && (
              <div className="flex flex-col gap-3 mt-2">
                {isEmployersPage && (
                  <Link
                    href={employersTrialHref}
                    className="flex items-center justify-center bg-linear-to-r from-[#E8770E] to-[#FC9620] text-center py-4 rounded-[18px] font-bold text-lg text-white shadow-[0_8px_22px_rgba(252,150,32,0.35)]"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {tEmployers("tryItFree")}
                  </Link>
                )}
                <Link
                  href={loginSignupHref}
                  className="border border-white/80 bg-white/55 text-slate-900! text-center py-4 rounded-[18px] font-bold text-lg backdrop-blur-xl hover:bg-white/80 hover:text-[#08428c]! transition-all"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {t("common.login")}
                </Link>
              </div>
            )}
            <LanguageSwitcher />
          </div>
        )}
      </div>
    </nav>
  );
}
