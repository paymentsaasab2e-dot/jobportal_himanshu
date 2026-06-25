"use client";

import Link from "next/link";
import { Pricing, type PricingPlan } from "@/components/ui/pricing";
import { EMPLOYERS_DEMO_PATH } from "@/lib/employers/constants";
import { localizePath, type AppLocale } from "@/lib/i18n";
import { useLocale } from "next-intl";
import { useMemo } from "react";

const EMPLOYERS_LOGIN_HREF =
  "https://employers.hryantra.com/login?redirect=%2Fleads";

function remapPlansForLocale(
  plans: PricingPlan[],
  locale: AppLocale
): PricingPlan[] {
  const contactHref = localizePath("/contact", locale);
  return plans.map((plan) => ({
    ...plan,
    href:
      plan.buttonText === "Contact Sales" ? contactHref : EMPLOYERS_LOGIN_HREF,
  }));
}

type EmployersPricingSectionProps = {
  initialPlans: PricingPlan[];
};

export function EmployersPricingSection({
  initialPlans,
}: EmployersPricingSectionProps) {
  const locale = useLocale() as AppLocale;
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);
  const plans = useMemo(
    () => remapPlansForLocale(initialPlans, locale),
    [initialPlans, locale]
  );

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
