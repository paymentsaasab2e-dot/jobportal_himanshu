"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Facebook, Instagram, Linkedin, X } from "lucide-react";

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
    className:
      "border-[#0A66C2]/25 bg-[#0A66C2]/10 text-[#0A66C2] hover:border-[#0A66C2]/40 hover:bg-[#0A66C2]/18",
  },
  {
    href: "https://x.com/HRyantra",
    label: "X",
    icon: X,
    className:
      "border-slate-800/20 bg-slate-900/5 text-slate-900 hover:border-slate-800/35 hover:bg-slate-900/10",
  },
  {
    href: "https://www.instagram.com/hryantra/",
    label: "Instagram",
    icon: Instagram,
    className:
      "border-[#E4405F]/25 bg-[#E4405F]/10 text-[#E4405F] hover:border-[#E4405F]/40 hover:bg-[#E4405F]/18",
  },
  {
    href: "https://www.facebook.com/profile.php?id=61576691802751",
    label: "Facebook",
    icon: Facebook,
    className:
      "border-[#1877F2]/25 bg-[#1877F2]/10 text-[#1877F2] hover:border-[#1877F2]/40 hover:bg-[#1877F2]/18",
  },
];

const BOOK_DEMO_HREF =
  "mailto:support@saasab2e.com?subject=Book%20a%20SAASA%20B2E%20Employer%20Demo";

export default function Footer() {
  const pathname = usePathname();
  const locale = useLocale() as AppLocale;
  const t = useTranslations();
  const normalizedPath = stripLocaleFromPathname(pathname || "/");
  const isEmployersPage =
    normalizedPath === "/employers" || normalizedPath.startsWith("/employers/");

  const footerLinks: FooterLinkGroup[] = [
    {
      title: t("footer.platform"),
      items: [
        { href: "/", label: t("footer.findJobs") },
        { href: "/courses", label: t("footer.coursesLms") },
        { href: "/services", label: t("footer.expertServices") },
        { href: "/help", label: t("footer.helpCenter") },
      ],
    },
    {
      title: t("footer.company"),
      items: [
        { href: "/aboutus", label: t("footer.aboutUs") },
        { href: "https://saasab2e.com/", label: t("footer.saasaB2e"), external: true },
        { href: "/", label: t("footer.employee") },
        { href: "/employers", label: t("footer.employer") },
        { href: BOOK_DEMO_HREF, label: t("footer.bookADemo"), external: true },
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
              {socialLinks.map(({ href, label, icon: Icon, className }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white transition-all ${className}`}
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
                  {group.items.map((item) => {
                    const isAbsolute =
                      item.external ||
                      item.href.startsWith("http") ||
                      item.href.startsWith("mailto:");
                    return (
                      <Link
                        key={item.label}
                        href={isAbsolute ? item.href : localizePath(item.href, locale)}
                        target={item.external && item.href.startsWith("http") ? "_blank" : undefined}
                        rel={item.external && item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                        className="text-[14px] font-medium transition-colors hover:text-(--brand-primary)"
                      >
                        {item.label}
                      </Link>
                    );
                  })}
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

