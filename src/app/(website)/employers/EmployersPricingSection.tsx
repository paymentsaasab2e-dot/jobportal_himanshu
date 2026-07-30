"use client";

import { useState } from "react";
import { Pricing, type PricingPlan } from "@/components/ui/pricing";
import { EmployerPackageSignupModal } from "./EmployerPackageSignupModal";

type EmployersPricingSectionProps = {
  initialPlans: PricingPlan[];
};

export function EmployersPricingSection({ initialPlans }: EmployersPricingSectionProps) {
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
      <section id="pricing" className="relative overflow-hidden border-y border-slate-200 bg-gradient-to-b from-white via-slate-50 to-white py-4">
        <div
          className="pointer-events-none absolute inset-0 opacity-50"
          aria-hidden
          style={{
            background:
              'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(40,168,225,0.08), transparent 60%)',
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Pricing
            plans={initialPlans}
            title="Plans built for your recruitment CRM"
            description={
              "Start with core CRM, scale into AI matching and enterprise HQ.\nEvery plan includes onboarding, portal sync, and employer workspace access."
            }
            onPlanSelect={handlePlanSelect}
          />
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
