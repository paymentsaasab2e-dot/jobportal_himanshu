"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { Menu, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import LanguageSwitcher from "@/components/common/LanguageSwitcher";
import { AppLocale, localizePath, stripLocaleFromPathname } from "@/lib/i18n";

const navLinks = [
  { key: "exploreJobs", href: "/" },
  // { name: "Courses", href: "/explore-jobs" },
  { key: "employers", href: "/employers" },
  { key: "services", href: "/services" },
];

export default function WebsiteNavbar() {
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const t = useTranslations();
  const normalizedPath = stripLocaleFromPathname(pathname || "/");
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const employersLoginHref = "https://employers.hryantra.com/login?redirect=%2Fleads";
  const isEmployersPage = normalizedPath === "/employers" || normalizedPath.startsWith("/employers/");
  const isServicesPage = normalizedPath === "/services" || normalizedPath.startsWith("/services/");
  const loginSignupHref = isEmployersPage ? employersLoginHref : localizePath("/whatsapp", locale);

  // Sliding pill state
  const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });
  const [isReady, setIsReady] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const activeIndex = navLinks.findIndex((l) => normalizedPath === l.href);
  const currentIndex = activeIndex; // Remove the default to 0
  const hasActiveTab = currentIndex !== -1;

  // Update pill position whenever active tab or layout changes
  const updatePill = () => {
    const el = linkRefs.current[currentIndex];
    const container = navRef.current;
    if (!hasActiveTab || !el || !container) {
      setIsReady(false);
      return;
    }
    const containerRect = container.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    setPillStyle({
      left: elRect.left - containerRect.left,
      width: elRect.width,
    });
    setIsReady(true);
  };

  useEffect(() => {
    updatePill();
  }, [currentIndex, pathname]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", updatePill);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updatePill);
    };
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[500] transition-all duration-500 ${
        isScrolled
          ? "bg-white/80 backdrop-blur-xl border-b border-slate-200 py-2 shadow-sm"
          : "bg-transparent py-2.5"
      }`}
    >
      <div className="mx-auto flex max-w-[1180px] items-center justify-between px-4 sm:px-5 lg:px-6">

        {/* Logo */}
        <div className="flex-1">
          <Link href={localizePath("/", locale)} className="relative flex items-center group w-fit">
            <div className="relative h-9 w-32">
              <Image
                src="/SAASA%20Logo.png"
                alt="SAASA B2E"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>
        </div>

        {/* Desktop Nav with Sliding Pill */}
        <div ref={navRef} className="hidden md:flex items-center relative">
          {/* Sliding black pill — absolutely positioned inside nav container */}
          {isReady && hasActiveTab && (
            <div
              className="absolute top-0 bottom-0 rounded-full bg-slate-900 shadow-lg pointer-events-none"
              style={{
                left: pillStyle.left,
                width: pillStyle.width,
                transition: "left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            />
          )}

          {navLinks.map((link, i) => {
            const isActive = currentIndex === i;
            return (
              <button
                key={link.key}
                ref={(el) => { linkRefs.current[i] = el; }}
                onClick={() => router.push(localizePath(link.href, locale))}
                className={`relative z-10 px-5 py-2 rounded-full text-[15px] font-medium transition-colors duration-200 ${
                  isActive ? "text-white" : "text-black hover:text-slate-700"
                }`}
              >
                {t(`nav.${link.key}`)}
              </button>
            );
          })}
        </div>

        {/* Desktop Actions */}
        <div className="flex-1 hidden md:flex justify-end">
          {!isServicesPage && (
            <div className="flex items-center gap-4">
              <Link
                href={loginSignupHref}
                className="border-2 border-black !text-black px-6 py-2 rounded-full text-[15px] font-bold hover:bg-black hover:!text-white transition-all"
              >
                {t("common.login")}
              </Link>
            </div>
          )}
          <div className="ml-3">
            <LanguageSwitcher />
          </div>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden p-2 text-slate-700 hover:text-slate-900 transition-colors"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-t border-slate-100 shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300 h-[calc(100vh-80px)] overflow-y-auto">
          {navLinks.map((link) => (
            <div key={link.key} className="flex flex-col gap-2">
              <Link
                href={localizePath(link.href, locale)}
                className={`text-lg font-bold ${normalizedPath === link.href ? "text-blue-600" : "text-slate-800"}`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t(`nav.${link.key}`)}
              </Link>
            </div>
          ))}
          <div className="h-px bg-slate-100 my-2" />
          {!isServicesPage && (
            <div className="flex flex-col gap-3 mt-2">
              <Link
                href={loginSignupHref}
                className="border-2 border-black !text-black text-center py-4 rounded-[18px] font-bold text-lg hover:bg-black hover:!text-white transition-all"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {t("common.login")}
              </Link>
            </div>
          )}
          <LanguageSwitcher />
        </div>
      )}
    </nav>
  );
}
