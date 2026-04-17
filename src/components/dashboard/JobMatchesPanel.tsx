import { useMemo, useState } from "react";
import Image from "next/image";

import {
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Clock3,
  Sparkles,
} from "lucide-react";

import DashboardPanel from "./DashboardPanel";
import {
  formatCompactSalary,
  formatJobMeta,
  formatRelativeDate,
} from "./dashboard-utils";
import type { DashboardJob, JobFilterKey } from "./dashboard-types";

const LOCAL_COMPANY_LOGO_POOL = [
  "/company-logos/logoipsum-355.svg",
  "/company-logos/logoipsum-374.svg",
  "/company-logos/logoipsum-392.svg",
  "/company-logos/logoipsum-396.svg",
  "/company-logos/logoipsum-399.svg",
  "/company-logos/logoipsum-411.svg",
  "/company-logos/logoipsum-413.svg",
  "/company-logos/logoipsum-424.svg",
] as const;

function getCompanyInitials(company: string) {
  const initials = company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "CO";
}

function getFallbackCompanyLogo(cardIndex: number) {
  if (LOCAL_COMPANY_LOGO_POOL.length === 0) return null;
  return LOCAL_COMPANY_LOGO_POOL[cardIndex % LOCAL_COMPANY_LOGO_POOL.length] ?? null;
}

function CompanyLogoBadge({
  company,
  logoUrl,
  fallbackIndex,
}: {
  company: string;
  logoUrl?: string | null;
  fallbackIndex: number;
}) {
  const [failedSources, setFailedSources] = useState<string[]>([]);
  const logoSources = useMemo(() => {
    const remoteLogoUrl = logoUrl?.trim() || null;
    const fallbackLogoUrl = getFallbackCompanyLogo(fallbackIndex);

    return [remoteLogoUrl, fallbackLogoUrl].filter(
      (source, index, array): source is string =>
        Boolean(source) && array.indexOf(source) === index
    );
  }, [fallbackIndex, logoUrl]);

  const activeLogoUrl =
    logoSources.find((source) => !failedSources.includes(source)) ?? null;
  const showImage = Boolean(activeLogoUrl);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-[16px] border border-slate-200/80 bg-white shadow-[inset_0_1px_0_rgba(255,255,255,0.96)]">
      {showImage ? (
        <span className="relative block h-full w-full">
          <Image
            src={activeLogoUrl}
            alt={`${company} logo`}
            fill
            className="object-cover"
            unoptimized
            onError={() => {
              if (!activeLogoUrl) return;

              setFailedSources((currentSources) =>
                currentSources.includes(activeLogoUrl)
                  ? currentSources
                  : [...currentSources, activeLogoUrl]
              );
            }}
          />
        </span>
      ) : (
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#28A8E1]">
          {getCompanyInitials(company)}
        </span>
      )}
    </div>
  );
}

const FILTER_PILLS: Array<{ key: JobFilterKey; label: string }> = [
  { key: "remote", label: "Remote Only" },
  { key: "highestMatch", label: "Highest Match" },
  { key: "salary100k", label: "Salary >$100k" },
  { key: "recent", label: "Freshly Posted" },
  { key: "visaFriendly", label: "Visa Friendly" },
];

interface JobMatchesPanelProps {
  jobs: DashboardJob[];
  loading: boolean;
  savedJobIds: string[];
  activeFilters: JobFilterKey[];
  isBadgeHighlighted?: boolean;
  onToggleFilter: (filter: JobFilterKey) => void;
  onToggleSave: (jobId: string) => void;
  onApply: (jobId: string) => void;
  onViewAll: () => void;
}

export default function JobMatchesPanel({
  jobs,
  loading,
  savedJobIds,
  activeFilters,
  isBadgeHighlighted = false,
  onToggleFilter,
  onToggleSave,
  onApply,
  onViewAll,
}: JobMatchesPanelProps) {
  return (
    <DashboardPanel className="p-3.5 sm:p-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div
              className={`dashboard-status-pill inline-flex items-center gap-1.5 rounded-full border border-transparent bg-[var(--brand-primary-soft)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)] [&>*]:relative [&>*]:z-[1] ${
                isBadgeHighlighted ? "dashboard-status-pill-active" : ""
              }`}
            >
              <Sparkles className="h-3 w-3" strokeWidth={2.2} />
              AI matched roles
            </div>
            <h2 className="mt-2.5 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
              Top job matches
            </h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">
              Prioritized roles you have not applied to yet, with full hiring context restored.
            </p>
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="inline-flex items-center gap-1.5 rounded-full bg-[#28A8E1] px-3 py-1.5 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.22)] transition-all duration-200 hover:bg-[#28A8DF]"
          >
            Browse all jobs
            <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.2} />
          </button>
        </div>

        <div className="dashboard-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
          {FILTER_PILLS.map((pill) => {
            const active = activeFilters.includes(pill.key);
            return (
              <button
                key={pill.key}
                type="button"
                onClick={() => onToggleFilter(pill.key)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[#28A8E1] text-white shadow-[0_10px_18px_rgba(40,168,225,0.16)] hover:bg-[#28A8DF]"
                    : "bg-slate-100/85 text-slate-600 hover:bg-slate-200/75"
                }`}
              >
                {pill.label}
              </button>
            );
          })}
        </div>

        <div className="dashboard-scrollbar max-h-[560px] space-y-2 overflow-y-auto pr-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <div
                key={`job-skeleton-${index}`}
                className="animate-pulse rounded-[20px] bg-slate-100/85 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-[16px] bg-slate-200" />
                  <div className="flex-1 space-y-2.5">
                    <div className="h-3.5 w-1/3 rounded-full bg-slate-200" />
                    <div className="h-3 w-1/4 rounded-full bg-slate-200" />
                    <div className="h-3 w-1/2 rounded-full bg-slate-200" />
                  </div>
                </div>
              </div>
            ))
          ) : jobs.length === 0 ? (
            <div className="rounded-[20px] bg-slate-100/80 px-4 py-7 text-center">
              <p className="text-sm font-semibold text-slate-900">
                No roles match this filter mix yet.
              </p>
              <p className="mt-2 text-[12px] font-medium text-slate-500">
                Clear a pill or open the full jobs board to expand your search.
              </p>
            </div>
          ) : (
            jobs.map((job, index) => {
              const isSaved = savedJobIds.includes(job.id);
              const matchScore =
                job.matchScore != null && Number.isFinite(job.matchScore)
                  ? Math.round(Math.min(100, Math.max(0, job.matchScore)))
                  : null;

              return (
                <div
                  key={job.id}
                  className="rounded-[20px] bg-slate-50/90 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] transition-all duration-200 hover:bg-white"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <CompanyLogoBadge
                      key={`${job.id}-${job.company}-${job.companyLogo ?? "fallback"}-${index}`}
                      company={job.company}
                      logoUrl={job.companyLogo}
                      fallbackIndex={index}
                    />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-950">
                            {job.title}
                          </p>
                          <p className="mt-0.5 text-[13px] font-medium text-slate-700">
                            {job.company}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] font-medium uppercase tracking-[0.05em] text-slate-500">
                            {formatJobMeta(job)}
                          </p>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          {matchScore != null ? (
                            <span className="inline-flex rounded-full bg-[var(--brand-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-accent)]">
                              {matchScore}% match
                            </span>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => onToggleSave(job.id)}
                            aria-label={isSaved ? "Remove job from saved" : "Save job for later"}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-all duration-200 ${
                              isSaved
                                ? "border-[var(--brand-primary)] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]"
                                : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700"
                            }`}
                          >
                            {isSaved ? (
                              <BookmarkCheck className="h-4 w-4" strokeWidth={2.1} />
                            ) : (
                              <Bookmark className="h-4 w-4" strokeWidth={2.1} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => onApply(job.id)}
                            className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.22)] transition-all duration-200 hover:bg-[#28A8DF]"
                          >
                            Apply now
                          </button>
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                          <Clock3 className="h-3 w-3" strokeWidth={2.2} />
                          {formatRelativeDate(job.postedAt)}
                        </span>
                        <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 shadow-sm">
                          {formatCompactSalary(
                            job.salaryMin,
                            job.salaryMax,
                            job.salaryCurrency,
                            job.salaryAmount
                          )}
                        </span>
                        {job.visaSponsorship ? (
                          <span className="inline-flex rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-primary)]">
                            Visa friendly
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardPanel>
  );
}
