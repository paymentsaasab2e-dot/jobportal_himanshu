"use client";

import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Brain,
  CheckCircle2,
  DollarSign,
  GraduationCap,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import { BlurRevealHeading } from "./BlurRevealText";

type ModuleTheme = "blue" | "emerald" | "purple" | "amber" | "pink";

type CoreModule = {
  id: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  benefits: string;
  icon: LucideIcon;
  theme: ModuleTheme;
  bentoClass: string;
  featureLimit?: number;
};

const themeStyles: Record<
  ModuleTheme,
  {
    accent: string;
    iconBg: string;
    check: string;
    benefitGlow: string;
    buttonHover: string;
  }
> = {
  blue: {
    accent: "text-blue-600",
    iconBg: "employers-neu-icon-well employers-neu-icon-well--blue",
    check: "text-blue-500",
    benefitGlow: "from-blue-500/10 to-transparent",
    buttonHover: "group-hover:text-blue-700",
  },
  emerald: {
    accent: "text-emerald-600",
    iconBg: "employers-neu-icon-well employers-neu-icon-well--emerald",
    check: "text-emerald-500",
    benefitGlow: "from-emerald-500/10 to-transparent",
    buttonHover: "group-hover:text-emerald-700",
  },
  purple: {
    accent: "text-purple-600",
    iconBg: "employers-neu-icon-well employers-neu-icon-well--purple",
    check: "text-purple-500",
    benefitGlow: "from-purple-500/10 to-transparent",
    buttonHover: "group-hover:text-purple-700",
  },
  amber: {
    accent: "text-amber-600",
    iconBg: "employers-neu-icon-well employers-neu-icon-well--amber",
    check: "text-amber-500",
    benefitGlow: "from-amber-500/10 to-transparent",
    buttonHover: "group-hover:text-amber-700",
  },
  pink: {
    accent: "text-pink-600",
    iconBg: "employers-neu-icon-well employers-neu-icon-well--pink",
    check: "text-pink-500",
    benefitGlow: "from-pink-500/10 to-transparent",
    buttonHover: "group-hover:text-pink-700",
  },
};

const coreModules: CoreModule[] = [
  {
    id: "recruitment",
    title: "AI Recruitment System",
    tagline: "Hire Top Talent Fast",
    description:
      "Find, evaluate, and hire the right candidates faster with end-to-end AI-driven recruitment.",
    features: [
      "AI CV screening & ATS scoring",
      "AI Job Description generator",
      "Multi-platform job posting",
      "AI candidate matching & ranking",
      "Interview scheduling + automation",
    ],
    benefits:
      "Reduce hiring time by 70%, eliminate manual screening, get top candidates instantly.",
    icon: Brain,
    theme: "blue",
    bentoClass: "md:col-span-1 xl:col-span-4 xl:row-span-1",
    featureLimit: 4,
  },
  {
    id: "employee",
    title: "Employee Management",
    tagline: "Workforce Operations",
    description:
      "Manage your entire workforce from onboarding to daily operations effortlessly.",
    features: [
      "Digital onboarding & documents",
      "Task & project tracking",
      "Asset allocation & receipts",
      "Attendance (biometric + GPS)",
      "Leave & expense workflows",
    ],
    benefits:
      "Full transparency across teams, reduced HR workload, better employee accountability.",
    icon: LayoutDashboard,
    theme: "emerald",
    bentoClass: "md:col-span-1 xl:col-span-4 xl:col-start-5 xl:row-start-1",
    featureLimit: 4,
  },
  {
    id: "performance",
    title: "Performance & Analytics",
    tagline: "Data-backed growth",
    description: "Measure performance with real data — not assumptions.",
    features: [
      "Task-based performance scoring",
      "Attendance impact analysis",
      "AI recommendations for improvement",
      "Promotion & growth insights",
    ],
    benefits:
      "Identify top performers instantly, improve productivity with data, reduce attrition risk.",
    icon: TrendingUp,
    theme: "purple",
    bentoClass: "md:col-span-1 xl:col-span-4 xl:col-start-9 xl:row-start-1",
    featureLimit: 4,
  },
  {
    id: "payroll",
    title: "Payroll & Compliance",
    tagline: "Zero Manual Errors",
    description:
      "Automate payroll with full compliance seamlessly linked to attendance.",
    features: [
      "Automated salary calculation",
      "Tax & compliance management",
      "Multi-country payroll support",
      "Tally & SAP integration",
      "Payslip automation",
    ],
    benefits:
      "100% accurate payroll, no compliance risks, saves the finance team hours.",
    icon: DollarSign,
    theme: "amber",
    bentoClass: "md:col-span-1 xl:col-span-4 xl:col-start-1 xl:row-start-2",
    featureLimit: 3,
  },
  {
    id: "learning",
    title: "Learning & Development",
    tagline: "Continuous Growth",
    description:
      "Turn employee gaps into growth with AI-driven training and integrated courses.",
    features: [
      "AI-based course recommendations",
      "Integrated LMS (videos, assessments)",
      "Skill-gap detection from feedback",
      "Payment gateway for courses",
    ],
    benefits:
      "Upskill employees automatically, improve hiring success rate, and drive continuous workforce improvement.",
    icon: GraduationCap,
    theme: "pink",
    bentoClass: "md:col-span-2 xl:col-span-8 xl:col-start-5 xl:row-start-2",
  },
];

function NeumorphicModuleCard({ module }: { module: CoreModule }) {
  const styles = themeStyles[module.theme];
  const Icon = module.icon;
  const visibleFeatures = module.featureLimit
    ? module.features.slice(0, module.featureLimit)
    : module.features;
  const isCompact = module.id === "recruitment" || Boolean(module.featureLimit);

  return (
    <article
      className={`employers-neu-card group flex h-full flex-col ${isCompact ? "p-5 sm:p-6" : "p-6 sm:p-8 lg:p-9"} ${module.bentoClass}`}
    >
      <div
        className={`relative flex flex-col gap-5 sm:flex-row sm:items-start ${isCompact ? "mb-4" : "mb-6"} ${module.id === "learning" ? "xl:flex-row xl:items-start xl:gap-10" : ""}`}
      >
        <div className="flex items-start gap-3 sm:gap-4">
          <div
            className={`flex shrink-0 items-center justify-center rounded-2xl ${isCompact ? "h-11 w-11" : "h-14 w-14"} ${styles.iconBg}`}
          >
            <Icon className={`${isCompact ? "h-6 w-6" : "h-7 w-7"} ${styles.check}`} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <BlurRevealHeading
              as="h3"
              className={`font-bold tracking-tight text-slate-800 ${isCompact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"}`}
              lines={[{ text: module.title }]}
            />
            <p
              className={`mt-1.5 text-[10px] font-bold uppercase tracking-[0.22em] sm:text-[11px] ${styles.accent}`}
            >
              {module.tagline}
            </p>
          </div>
        </div>
      </div>

      <div
        className={`flex flex-1 flex-col ${module.id === "learning" ? "xl:grid xl:grid-cols-[1.05fr_0.95fr] xl:gap-8" : ""}`}
      >
        <div className="flex flex-1 flex-col">
          <p className={`leading-relaxed text-slate-600 ${isCompact ? "mb-4 text-[13px] sm:text-[14px]" : "mb-5 text-[14px] sm:text-[15px]"}`}>
            {module.description}
          </p>

          {module.id !== "learning" ? (
            <ul className={`space-y-2.5 ${isCompact ? "mb-4" : "mb-6"}`}>
              {visibleFeatures.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${styles.check}`} strokeWidth={2.5} />
                  <span className="text-[13px] font-medium leading-snug text-slate-700 sm:text-[14px]">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div
            className={`employers-neu-inset relative flex gap-3 rounded-2xl ${isCompact ? "mb-4 p-3.5" : "mb-6 p-4 sm:p-5"} ${module.id === "learning" ? "xl:mb-0" : "mt-auto"}`}
          >
            <div
              className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${styles.benefitGlow} opacity-80`}
              aria-hidden
            />
            <TrendingUp className={`relative z-[1] mt-0.5 h-5 w-5 shrink-0 ${styles.check}`} />
            <div className="relative z-[1]">
              <strong className="mb-1 block text-[13px] font-semibold text-slate-800">
                Real Benefits
              </strong>
              <span className="block text-[13px] leading-relaxed text-slate-600 sm:text-[14px]">
                {module.benefits}
              </span>
            </div>
          </div>
        </div>

        {module.id === "learning" ? (
          <div className="space-y-3">
            {module.features.map((feature) => (
              <div
                key={feature}
                className="employers-neu-inset flex items-center gap-3 rounded-xl px-4 py-3.5"
              >
                <CheckCircle2 className={`h-5 w-5 shrink-0 ${styles.check}`} strokeWidth={2.5} />
                <span className="text-[13px] font-semibold text-slate-700 sm:text-[14px]">
                  {feature}
                </span>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <button
        type="button"
        className={`employers-neu-button mt-5 inline-flex w-fit items-center gap-2 rounded-full px-5 py-2.5 text-[13px] font-semibold text-slate-700 transition-all sm:text-[14px] ${styles.buttonHover}`}
      >
        See Workflow
        <ArrowRight className="h-4 w-4" />
      </button>
    </article>
  );
}

export function EmployersCoreModulesBento() {
  return (
    <section id="modules" className="employers-neu-section relative pb-16 pt-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto mb-16 max-w-2xl text-center sm:mb-20">
          <BlurRevealHeading
            as="h2"
            className="mb-6 text-4xl font-extrabold tracking-tight text-slate-800 md:text-5xl"
            lines={[{ text: "Core Modules" }]}
          />
          <p className="text-[1.05rem] leading-relaxed text-slate-600 sm:text-[1.1rem]">
            Everything you need to run your workforce securely, accurately, and rapidly.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6 xl:grid-cols-12 xl:grid-rows-[auto_auto]">
          {coreModules.map((module) => (
            <NeumorphicModuleCard key={module.id} module={module} />
          ))}
        </div>
      </div>
    </section>
  );
}
