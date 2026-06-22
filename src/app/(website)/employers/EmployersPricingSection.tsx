"use client";

import Link from "next/link";
import { Pricing, type PricingPlan } from "@/components/ui/pricing";
import { EMPLOYERS_DEMO_PATH } from "@/lib/employers/constants";
import { localizePath, type AppLocale } from "@/lib/i18n";
import { useLocale } from "next-intl";

const EMPLOYERS_LOGIN_HREF =
  "https://employers.hryantra.com/login?redirect=%2Fleads";

function buildEmployerPlans(locale: AppLocale): PricingPlan[] {
  const contactHref = localizePath("/contact", locale);

  return [
    {
      name: "STARTER",
      price: "149",
      yearlyPrice: "119",
      period: "per month",
      features: [
        "Up to 25 active job postings",
        "AI CV screening & ATS scoring",
        "Candidate pipeline & interviews",
        "Basic analytics dashboard",
        "Email support (48h response)",
      ],
      description: "For small teams hiring their first roles on SAASA B2E.",
      buttonText: "Start Free Trial",
      href: EMPLOYERS_LOGIN_HREF,
      isPopular: false,
    },
    {
      name: "PROFESSIONAL",
      price: "399",
      yearlyPrice: "319",
      period: "per month",
      features: [
        "Unlimited job postings",
        "Full AI recruitment suite",
        "Employee management & onboarding",
        "Performance & payroll modules",
        "Multi-platform job publishing",
        "Priority support (24h response)",
        "Team collaboration & roles",
      ],
      description: "For growing companies running hiring and HR in one place.",
      buttonText: "Get Started",
      href: EMPLOYERS_LOGIN_HREF,
      isPopular: true,
    },
    {
      name: "ENTERPRISE",
      price: "999",
      yearlyPrice: "799",
      period: "per month",
      features: [
        "Everything in Professional",
        "Custom workflows & integrations",
        "Dedicated account manager",
        "SSO & advanced security",
        "SLA-backed uptime",
        "On-premise / private cloud options",
        "Custom contracts & training",
      ],
      description: "For large organizations with complex HR operations.",
      buttonText: "Contact Sales",
      href: contactHref,
      isPopular: false,
    },
  ];
}

export function EmployersPricingSection() {
  const locale = useLocale() as AppLocale;
  const plans = buildEmployerPlans(locale);
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);

  return (
    <section id="pricing" className="border-y border-slate-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Pricing
          plans={plans}
          title="Plans that scale with your hiring"
          description={
            "Simple pricing for teams of every size.\nAll plans include the SAASA B2E employer platform, AI tools, and onboarding support."
          }
        />
      </div>
      <div className="pb-8 text-center">
        <Link
          href={demoHref}
          className="text-sm font-semibold text-sky-600 transition-colors hover:text-sky-700"
        >
          Need a guided walkthrough? Book a demo →
        </Link>
      </div>
    </section>
  );
}
