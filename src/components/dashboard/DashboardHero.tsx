import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Sparkles } from "lucide-react";

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
}

export default function DashboardHero({
  eyebrow,
  heading,
  subheading,
  stats,
  onOpenMatches,
}: DashboardHeroProps) {
  return (
    <DashboardPanel className="relative overflow-hidden px-4 py-4 sm:px-5 sm:py-5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(40,168,225,0.16),transparent_36%),radial-gradient(circle_at_bottom_right,rgba(40,168,223,0.1),transparent_28%),radial-gradient(circle_at_82%_18%,rgba(252,150,32,0.08),transparent_18%)]" />
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-[var(--brand-primary-glow)] blur-3xl" />

      <div className="relative space-y-4">
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
          <h1 className="application-detail-title max-w-3xl">
            {heading}
          </h1>
          <p className="application-detail-helper max-w-2xl">
            {subheading}
          </p>
        </div>

        <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0">
          <div className="grid min-w-[38rem] grid-cols-4 gap-2 sm:min-w-0">
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
                className={`min-w-0 rounded-[18px] border border-white/80 bg-white/90 px-3 py-3 shadow-[0_8px_20px_rgba(15,23,42,0.04)] ${
                  onClick
                    ? "group cursor-pointer text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(40,168,225,0.22)] hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(40,168,225,0.24)]"
                    : ""
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
                      {label}
                    </p>
                    <p className="profile-page-value mt-2 font-semibold tracking-tight">
                      {value}
                    </p>
                  </div>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] transition-colors duration-200 group-hover:bg-[rgba(40,168,225,0.18)]">
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <p className="profile-page-empty leading-5">{helper}</p>
                  {onClick ? (
                    <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-slate-300 transition-all duration-200 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--brand-primary)]" />
                  ) : null}
                </div>
              </Tag>
            );
          })}
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
