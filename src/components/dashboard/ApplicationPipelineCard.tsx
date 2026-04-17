import {
  CheckCircle2,
  CircleDashed,
  Gift,
  SearchCheck,
  SendHorizonal,
  Sparkles,
} from "lucide-react";

import DashboardPanel from "./DashboardPanel";
import type { DashboardData } from "./dashboard-types";

interface ApplicationPipelineCardProps {
  stats: DashboardData["stats"] | null;
  applicationCounts?: DashboardData["applicationCounts"];
  onViewApplications: () => void;
}

export default function ApplicationPipelineCard({
  stats,
  applicationCounts,
  onViewApplications,
}: ApplicationPipelineCardProps) {
  const reviewingCount =
    (applicationCounts?.UNDER_REVIEW || 0) +
    (applicationCounts?.SHORTLISTED || 0) +
    (applicationCounts?.ASSESSMENT || 0);

  const pipeline = [
    {
      label: "Applied",
      count: stats?.totalApplications || 0,
      helper: "Submitted roles",
      icon: SendHorizonal,
    },
    {
      label: "Reviewing",
      count: reviewingCount,
      helper: "Shortlists and tests",
      icon: SearchCheck,
    },
    {
      label: "Interviewing",
      count: stats?.interviews || 0,
      helper: "Live interview stages",
      icon: Sparkles,
    },
    {
      label: "Offered",
      count: stats?.offersReceived || 0,
      helper: "Offers received",
      icon: Gift,
    },
  ];

  return (
    <DashboardPanel className="p-3.5 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold tracking-tight text-slate-950">
              Application pipeline
            </h2>
            <p className="mt-1 text-[12px] font-medium text-slate-500">
              A compact view of where your applications are moving.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewApplications}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-700 transition-all duration-200 hover:border-[rgba(40,168,225,0.24)] hover:bg-[var(--brand-primary-soft)]"
          >
            Open tracker
          </button>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {pipeline.map((step) => {
            const active = step.count > 0;
            const Icon = step.icon;

            return (
              <div
                key={step.label}
                className="rounded-[18px] bg-slate-50/88 px-2.5 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.82)]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-xl ${
                      active
                        ? "bg-[var(--brand-primary)] text-white shadow-[0_10px_18px_rgba(40,168,225,0.18)]"
                        : "bg-white text-slate-400"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.1} />
                  </span>
                  <p className="text-lg font-semibold tracking-tight text-slate-950">
                    {step.count}
                  </p>
                </div>
                <p className="mt-2 text-[13px] font-semibold text-slate-900">
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] font-medium leading-5 text-slate-500">
                  {step.helper}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-[18px] bg-[linear-gradient(135deg,rgba(231,130,16,0.98),rgba(252,150,32,0.94),rgba(255,184,92,0.92))] px-3 py-2.5 text-white shadow-[0_14px_28px_rgba(252,150,32,0.22)]">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/16 text-white">
                {stats?.activeApplications ? (
                  <CheckCircle2 className="h-4 w-4" strokeWidth={2.1} />
                ) : (
                  <CircleDashed className="h-4 w-4" strokeWidth={2.1} />
                )}
              </span>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent-soft)]">
                  Active momentum
                </p>
                <p className="mt-1 text-[12px] font-medium leading-5 text-white">
                  {stats?.activeApplications
                    ? `${stats.activeApplications} live applications are moving through your funnel.`
                    : "No active applications yet. Start applying to light up the pipeline."}
                </p>
              </div>
            </div>
            <p className="text-[12px] font-medium text-white/80">
              Rejections: <span className="font-semibold text-white">{stats?.rejected || 0}</span>
            </p>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
