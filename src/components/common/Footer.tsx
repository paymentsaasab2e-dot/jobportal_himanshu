"use client";

import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Twitter } from "lucide-react";

const currentYear = new Date().getFullYear();

const footerLinks = [
  {
    title: "Platform",
    items: [
      { href: "/explore-jobs", label: "Find Jobs" },
      { href: "/courses", label: "Courses & LMS" },
      { href: "/services", label: "Expert Services" },
      { href: "/aicveditor", label: "AI CV Tools" },
    ],
  },
  {
    title: "Company",
    items: [
      { href: "#", label: "About Us" },
      { href: "/employers", label: "For Employers" },
      { href: "/help", label: "Help Center" },
      { href: "#", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    items: [
      { href: "/privacypolicy", label: "Privacy Policy" },
      { href: "#", label: "Terms of Service" },
      { href: "#", label: "Trust & Safety" },
    ],
  },
];

const socialLinks = [
  {
    href: "#",
    label: "LinkedIn",
    icon: Linkedin,
    hover: "hover:text-[var(--brand-primary)] hover:border-[rgba(40,168,225,0.22)] hover:bg-[var(--brand-primary-soft)]",
  },
  {
    href: "#",
    label: "Twitter",
    icon: Twitter,
    hover: "hover:text-[var(--brand-secondary)] hover:border-[rgba(40,168,223,0.22)] hover:bg-[var(--brand-secondary-soft)]",
  },
  {
    href: "#",
    label: "Instagram",
    icon: Instagram,
    hover: "hover:text-[var(--brand-accent)] hover:border-[rgba(252,150,32,0.22)] hover:bg-[var(--brand-accent-soft)]",
  },
  {
    href: "#",
    label: "Facebook",
    icon: Facebook,
    hover: "hover:text-[var(--brand-primary)] hover:border-[rgba(40,168,225,0.22)] hover:bg-[var(--brand-primary-soft)]",
  },
];

export default function Footer() {
  return (
    <footer className="bg-transparent font-sans text-slate-600">
      <div className="mx-auto max-w-[1240px] px-6 py-10">
        <div className="flex flex-col gap-10 lg:flex-row lg:justify-between">
          <div className="flex max-w-sm flex-col gap-4">
            <Link href="/" className="inline-flex transition-opacity hover:opacity-90">
              <Image
                src="/SAASA%20Logo.png"
                alt="SAASA B2E"
                width={140}
                height={40}
                className="h-8 w-auto"
              />
            </Link>

            <p className="text-[14px] font-medium leading-6">
              The modern ecosystem bridging the gap between world-class talent and
              leading employers through AI-driven intelligence.
            </p>

            <div className="mt-1 flex items-center gap-3">
              {socialLinks.map(({ href, label, icon: Icon, hover }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
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
                      href={item.href}
                      className="text-[14px] font-medium transition-colors hover:text-[var(--brand-primary)]"
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

      <div className="border-t border-slate-200/70 bg-white/40">
        <div className="mx-auto flex max-w-[1240px] items-center justify-center px-6 py-4 text-center">
          <p className="text-[13px] font-medium">
            (c) {currentYear} SAASA B2E. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
