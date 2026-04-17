import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  FileText,
  Sparkles,
  Target,
  UserRoundPen,
} from "lucide-react";

import DashboardPanel from "./DashboardPanel";

export interface DashboardHeroStat {
  id: string;
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  onClick?: () => void;
}

interface DashboardHeroProps {
  eyebrow: string;
  heading: string;
  subheading: string;
  stats: DashboardHeroStat[];
  onOpenMatches: () => void;
  onExploreJobs: () => void;
  onViewApplications: () => void;
  onBrowseCourses: () => void;
  onEditProfile: () => void;
}

function QuickActionButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex items-center justify-between gap-2 rounded-[16px] border border-white/70 bg-white/74 px-3 py-2.5 text-left shadow-[0_8px_18px_rgba(15,23,42,0.04)] transition-all duration-200 hover:border-[rgba(40,168,225,0.24)] hover:bg-white"
    >
      <span className="flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
          <Icon className="h-4 w-4" strokeWidth={2.1} />
        </span>
        <span className="text-[13px] font-medium text-slate-800">{label}</span>
      </span>
      <ArrowUpRight className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]" />
    </button>
  );
}

export default function DashboardHero({
  eyebrow,
  heading,
  subheading,
  stats,
  onOpenMatches,
  onExploreJobs,
  onViewApplications,
  onBrowseCourses,
  onEditProfile,
}: DashboardHeroProps) {
  return (
    <DashboardPanel className="relative overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(40,168,225,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(40,168,223,0.1),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(252,150,32,0.08),transparent_18%)]" />
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[var(--brand-primary-glow)] blur-3xl" />

      <div className="relative grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(300px,0.95fr)] xl:items-start">
        <div className="space-y-4">
          <button
            type="button"
            onClick={onOpenMatches}
            className="dashboard-status-pill inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-accent-soft)] bg-white/74 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-accent)] shadow-sm transition-all duration-200 hover:cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(40,168,225,0.28)] [&>*]:relative [&>*]:z-[1]"
            aria-label="Jump to top job matches"
          >
            <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
            {eyebrow}
          </button>

          <div className="space-y-2.5">
            <h1 className="max-w-3xl text-[1.55rem] font-bold tracking-tight text-slate-950 sm:text-[1.8rem] xl:text-[2.1rem] xl:leading-[1.12]">
              {heading}
            </h1>
            <p className="max-w-2xl text-[13px] font-medium leading-6 text-slate-600 sm:text-sm">
              {subheading}
            </p>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-4">
            {stats.map(({ id, label, value, helper, icon: Icon, onClick }) => {
              const Tag = onClick ? "button" : "div";

              return (
                <Tag
                  key={id}
                  {...(onClick
                    ? {
                        type: "button" as const,
                        onClick,
                      }
                    : {})}
                  className={`rounded-[18px] border border-white/74 bg-white/74 px-3.5 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${
                    onClick
                      ? "group cursor-pointer text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(40,168,225,0.22)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(40,168,225,0.24)]"
                      : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                        {label}
                      </p>
                      <p className="mt-2 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
                        {value}
                      </p>
                    </div>
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950/[0.035] text-[var(--brand-primary)] transition-colors duration-200 group-hover:bg-[var(--brand-primary-soft)]">
                      <Icon className="h-4 w-4" strokeWidth={2.2} />
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-[11px] font-medium leading-5 text-slate-500">{helper}</p>
                    {onClick ? (
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]" />
                    ) : null}
                  </div>
                </Tag>
              );
            })}
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-2">
          <QuickActionButton
            label="Explore live jobs"
            icon={BriefcaseBusiness}
            onClick={onExploreJobs}
          />
          <QuickActionButton
            label="Track applications"
            icon={Target}
            onClick={onViewApplications}
          />
          <QuickActionButton
            label="Continue learning"
            icon={FileText}
            onClick={onBrowseCourses}
          />
          <QuickActionButton
            label="Refine your profile"
            icon={UserRoundPen}
            onClick={onEditProfile}
          />
        </div>
      </div>
    </DashboardPanel>
  );
}
