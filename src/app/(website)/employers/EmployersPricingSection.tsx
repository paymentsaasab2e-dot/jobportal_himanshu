"use client";

import Link from "next/link";
import { useState } from "react";
import { Pricing, type PricingPlan } from "@/components/ui/pricing";
import { EMPLOYERS_DEMO_PATH } from "@/lib/employers/constants";
import { localizePath, type AppLocale } from "@/lib/i18n";
import { useLocale } from "next-intl";
import { EmployerPackageSignupModal } from "./EmployerPackageSignupModal";

type EmployersPricingSectionProps = {
  initialPlans: PricingPlan[];
};

export function EmployersPricingSection({ initialPlans }: EmployersPricingSectionProps) {
  const locale = useLocale() as AppLocale;
  const demoHref = localizePath(EMPLOYERS_DEMO_PATH, locale);
  const [selectedPlan, setSelectedPlan] = useState<PricingPlan | null>(null);
  const [billingMonthly, setBillingMonthly] = useState(true);
  const [signupOpen, setSignupOpen] = useState(false);

  const handlePlanSelect = (plan: PricingPlan, billing: { isMonthly: boolean }) => {
    setSelectedPlan(plan);
    setBillingMonthly(billing.isMonthly);
    setSignupOpen(true);
  };

  return (
    <>
      <section id="pricing" className="border-y border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Pricing
            plans={initialPlans}
            title="Plans that scale with your hiring"
            description={
              "Simple pricing for teams of every size.\nAll plans include the SAASA B2E employer platform, AI tools, and onboarding support."
            }
            onPlanSelect={handlePlanSelect}
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

      <EmployerPackageSignupModal
        open={signupOpen}
        plan={selectedPlan}
        isMonthly={billingMonthly}
        onClose={() => {
          setSignupOpen(false);
          setSelectedPlan(null);
        }}
      />
    </>
  );
}
