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
    id: "crm",
    title: "CRM & Lead Operations",
    tagline: "Revenue workspace",
    description:
      "Capture, assign, and convert leads with follow-ups, meetings, client accounts, and a unified contact directory.",
    features: [
      "Leads CRUD, import, convert & recycle bin",
      "Follow-ups with email & Google Meet invites",
      "Client CRM with scheduled meetings",
      "Smart search & location intelligence",
    ],
    benefits:
      "Stop lead leakage — every touchpoint is tracked, assigned, and reportable like Zoho CRM.",
    icon: Brain,
    theme: "blue",
    bentoClass: "md:col-span-1 xl:col-span-4 xl:row-span-1",
    featureLimit: 4,
  },
  {
    id: "recruitment",
    title: "Recruitment Engine",
    tagline: "Jobs to placements",
    description:
      "Publish roles, parse CVs in bulk, run AI matching, move pipeline stages, and close placements with billing.",
    features: [
      "AI job wizard & public apply links",
      "Bulk CV upload & duplicate detection",
      "4-pass AI candidate matching",
      "Interviews, feedback & placements",
    ],
    benefits:
      "Cut time-to-shortlist by 60%+ with AI ranking — comparable to Greenhouse-level ATS depth.",
    icon: LayoutDashboard,
    theme: "emerald",
    bentoClass: "md:col-span-1 xl:col-span-4 xl:col-start-5 xl:row-start-1",
    featureLimit: 4,
  },
  {
    id: "analytics",
    title: "Command & Reports",
    tagline: "HQ-grade visibility",
    description: "Dashboard KPIs, exportable reports, billing records, and multi-tenant HQ analytics for leadership.",
    features: [
      "Real-time recruitment dashboard",
      "Placement & revenue reports",
      "Billing & invoice lifecycle",
      "HQ employer analytics (Enterprise)",
    ],
    benefits:
      "Founder-to-recruiter visibility in one pane — like Workday analytics without the complexity.",
    icon: TrendingUp,
    theme: "purple",
    bentoClass: "md:col-span-1 xl:col-span-4 xl:col-start-9 xl:row-start-1",
    featureLimit: 4,
  },
  {
    id: "platform",
    title: "Platform & RBAC",
    tagline: "Enterprise control",
    description:
      "Team roles, permissions, calendar, inbox, tasks, notifications, and Phase 1 portal bridge built in.",
    features: [
      "Role-based access & team management",
      "Calendar, inbox & task workflows",
      "Org settings & alert scheduler",
      "Portal sync with candidate job board",
    ],
    benefits:
      "Secure multi-tenant isolation with audit trails — how modern HRMS platforms should operate.",
    icon: DollarSign,
    theme: "amber",
    bentoClass: "md:col-span-1 xl:col-span-4 xl:col-start-1 xl:row-start-2",
    featureLimit: 4,
  },
  {
    id: "ai",
    title: "HRYantra AI Layer",
    tagline: "Built into every module",
    description:
      "Brain assistant, smart search, CV parsing, match scoring, and workspace briefs — no bolt-on AI add-ons.",
    features: [
      "HRYantra Brain in-app assistant",
      "AI job creation & title suggestions",
      "Natural-language smart search",
      "CV ATS scoring & match tiers",
    ],
    benefits:
      "Practical AI across hiring — not decorative chatbots. Reduces manual screening and follow-up work.",
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
  const isCompact = module.id === "crm" || Boolean(module.featureLimit);

  return (
    <article
      className={`employers-neu-card group flex h-full flex-col ${isCompact ? "p-5 sm:p-6" : "p-6 sm:p-8 lg:p-9"} ${module.bentoClass}`}
    >
      <div
        className={`relative flex flex-col gap-5 sm:flex-row sm:items-start ${isCompact ? "mb-4" : "mb-6"} ${module.id === "ai" ? "xl:flex-row xl:items-start xl:gap-10" : ""}`}
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
        className={`flex flex-1 flex-col ${module.id === "ai" ? "xl:grid xl:grid-cols-[1.05fr_0.95fr] xl:gap-8" : ""}`}
      >
        <div className="flex flex-1 flex-col">
          <p className={`leading-relaxed text-slate-600 ${isCompact ? "mb-4 text-[13px] sm:text-[14px]" : "mb-5 text-[14px] sm:text-[15px]"}`}>
            {module.description}
          </p>

          {module.id !== "ai" ? (
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
            className={`employers-neu-inset relative flex gap-3 rounded-2xl ${isCompact ? "mb-4 p-3.5" : "mb-6 p-4 sm:p-5"} ${module.id === "ai" ? "xl:mb-0" : "mt-auto"}`}
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

        {module.id === "ai" ? (
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
            lines={[{ text: "Platform Pillars" }]}
          />
          <p className="text-[1.05rem] leading-relaxed text-slate-600 sm:text-[1.1rem]">
            Five connected workspaces — CRM, recruitment, analytics, platform control, and AI — in one
            employer login.
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
