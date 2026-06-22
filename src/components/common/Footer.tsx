"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Facebook, Instagram, Linkedin, X } from "lucide-react";

import { useAuth } from "@/components/auth/AuthContext";
import { AppLocale, localizePath, stripLocaleFromPathname } from "@/lib/i18n";

const currentYear = new Date().getFullYear();

interface FooterLinkItem {
  href: string;
  label: string;
  external?: boolean;
}

interface FooterLinkGroup {
  title: string;
  items: FooterLinkItem[];
}

const socialLinks = [
  {
    href: "https://www.linkedin.com/company/hryantra/",
    label: "LinkedIn",
    icon: Linkedin,
    hover: "hover:text-[var(--brand-primary)] hover:border-[rgba(40,168,225,0.22)] hover:bg-[var(--brand-primary-soft)]",
  },
  {
    href: "https://x.com/HRyantra",
    label: "X",
    icon: X,
    hover: "hover:text-[var(--brand-secondary)] hover:border-[rgba(40,168,223,0.22)] hover:bg-[var(--brand-secondary-soft)]",
  },
  {
    href: "https://www.instagram.com/hryantra/",
    label: "Instagram",
    icon: Instagram,
    hover: "hover:text-[var(--brand-accent)] hover:border-[rgba(252,150,32,0.22)] hover:bg-[var(--brand-accent-soft)]",
  },
  {
    href: "https://www.facebook.com/profile.php?id=61576691802751",
    label: "Facebook",
    icon: Facebook,
    hover: "hover:text-[var(--brand-primary)] hover:border-[rgba(40,168,225,0.22)] hover:bg-[var(--brand-primary-soft)]",
  },
];

export default function Footer() {
  const { isAuthenticated: isLoggedIn } = useAuth();
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const t = useTranslations();
  const normalizedPath = stripLocaleFromPathname(pathname || "/");
  const isLandingPage = normalizedPath === "/";
  const isEmployersPage =
    normalizedPath === "/employers" || normalizedPath.startsWith("/employers/");

  const platformLinks = (isLoggedIn && !isLandingPage && !isEmployersPage) ? [
    { href: "/candidate-dashboard", label: t("nav.dashboard") },
    { href: "/explore-jobs", label: t("nav.jobs") },
    { href: "/applications", label: t("nav.applications") },
    { href: "/lms/courses", label: "LMS" },
    { href: "/profile", label: t("nav.profile") },
    { href: "/services", label: t("nav.services") },
  ] : [
    { href: "/", label: t("footer.findJobs") },
    { href: "/courses", label: t("footer.coursesLms") },
    { href: "/services", label: t("footer.expertServices") },
  ];

  const footerLinks: FooterLinkGroup[] = [
    {
      title: t("footer.platform"),
      items: platformLinks,
    },
    {
      title: t("footer.company"),
      items: [
        { href: "/aboutus", label: t("footer.aboutUs") },
        { href: "/employers", label: t("common.forEmployers") },
        { href: "/help", label: t("footer.helpCenter") },
        { href: "/contact", label: t("footer.contact") },
      ],
    },
    {
      title: t("footer.legal"),
      items: [
        { href: "/privacypolicy", label: t("footer.privacyPolicy") },
        { href: "/terms", label: t("footer.termsOfService") },
        { href: "/trust-safety", label: t("footer.trustSafety") },
      ],
    },
  ];

  return (
    <footer className="bg-transparent font-sans text-slate-600">
      <div className="mx-auto max-w-[1680px] px-6 py-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="flex max-w-sm flex-col gap-4">
            <Link href={localizePath("/", locale)} className="inline-flex transition-opacity hover:opacity-90">
              <Image
                src="/SAASA%20Logo.png"
                alt="SAASA B2E"
                width={140}
                height={40}
                className="h-8 w-auto"
              />
            </Link>

            <p className="text-[14px] font-medium leading-6">
              {t("footer.description")}
            </p>

            <div className="mt-1 flex items-center gap-3">
              {socialLinks.map(({ href, label, icon: Icon, hover }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 transition-all ${hover}`}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-8 sm:gap-x-16">
            {footerLinks.map((group) => (
              <div key={group.title} className="flex flex-col">
                <h4 className="mb-4 font-bold tracking-tight text-slate-900">
                  {group.title}
                </h4>
                <nav className="flex flex-col gap-3">
                  {group.items.map((item) => (
                    <Link
                      key={item.label}
                      href={localizePath(item.href, locale)}
                      target={item.external ? "_blank" : undefined}
                      rel={item.external ? "noopener noreferrer" : undefined}
                      className="text-[14px] font-medium transition-colors hover:text-(--brand-primary)"
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
              </div>
            ))}
          </div>
        </div>
      </div>

      {!isEmployersPage && (
      <div className="border-t border-slate-200/70 bg-white/40">
        <div className="mx-auto flex max-w-[1680px] items-center justify-center px-6 py-4 text-center">
          <p className="text-[13px] font-medium">
            (c) {currentYear} SAASA B2E. {t("footer.rightsReserved")}
          </p>
        </div>
      </div>
      )}
    </footer>
  );
}

