'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUpRight,
  BookmarkCheck,
  BriefcaseBusiness,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  LayoutGrid,
  MapPin,
  Search,
  Sparkles,
  Target,
  Video,
} from 'lucide-react';


import DashboardPanel from '@/components/dashboard/DashboardPanel';
import { showSuccessToast } from '@/components/common/toast/toast';
import type { DashboardData, DashboardJob } from '@/components/dashboard/dashboard-types';
import { API_BASE_URL } from '@/lib/profile-completion';
import { GlobalLoader } from '@/components/auth/GlobalLoader';

type ApplicationStatus =
  | 'Under Review'
  | 'Submitted'
  | 'Shortlisted'
  | 'Selected'
  | 'Rejected'
  | 'Assessment'
  | 'Interview'
  | 'Final Decision';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  status: ApplicationStatus | string;
  appliedDate: string;
  matchScore: number;
}

interface InterviewItem {
  id: string;
  jobTitle: string;
  company: string;
  interviewDateTime: string;
  interviewType: 'online' | 'walk-in';
  status: 'Scheduled' | 'Rescheduled' | 'Completed' | 'Cancelled';
  joinUrl?: string;
}

type ActiveSection = 'applications' | 'interviews' | 'savedJobs';

type SavedJobRecord = DashboardJob & {
  savedAt?: string | null;
};

type StatusMeta = {
  chip: string;
  progress: string;
  spotlight: string;
};

const STATUS_OPTIONS: string[] = [
  'All',
  'Under Review',
  'Submitted',
  'Shortlisted',
  'Assessment',
  'Interview',
  'Final Decision',
  'Selected',
  'Rejected',
];

const DATE_OPTIONS = [
  'All Time',
  'Last 7 Days',
  'Last 30 Days',
  'Last 3 Months',
  'Last 6 Months',
  'Last Year',
];

const PAGE_BG =
  'radial-gradient(circle at top left, rgba(40,168,225,0.13), transparent 28%), radial-gradient(circle at 85% 12%, rgba(40,168,223,0.1), transparent 16%), radial-gradient(circle at 18% 82%, rgba(252,150,32,0.08), transparent 18%), linear-gradient(180deg, #f5fafd 0%, #f8fcff 44%, #fcfdff 100%)';

const SAVED_JOBS_STORAGE_PREFIX = 'dashboardSavedJobs';

const MOCK_APPLICATIONS: Application[] = [
  {
    id: 'mock-app-1',
    jobTitle: 'Frontend Developer',
    company: 'Google',
    status: 'Submitted',
    appliedDate: '2026-03-14',
    matchScore: 82,
  },
  {
    id: 'mock-app-2',
    jobTitle: 'UI Engineer',
    company: 'NovaTech',
    status: 'Under Review',
    appliedDate: '2026-03-10',
    matchScore: 76,
  },
  {
    id: 'mock-app-3',
    jobTitle: 'Product Designer',
    company: 'BlueOrbit',
    status: 'Submitted',
    appliedDate: '2026-03-08',
    matchScore: 71,
  },
];

const APPLICATION_STATUS_META: Record<string, StatusMeta> = {
  Submitted: {
    chip: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
    progress: 'bg-slate-500',
    spotlight: 'bg-slate-50 text-slate-700',
  },
  'Under Review': {
    chip: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200/80',
    progress: 'bg-[#28A8E1]',
    spotlight: 'bg-sky-50 text-sky-800',
  },
  Shortlisted: {
    chip: 'bg-cyan-100 text-cyan-800 ring-1 ring-cyan-200/80',
    progress: 'bg-[#28A8DF]',
    spotlight: 'bg-cyan-50 text-cyan-800',
  },
  Assessment: {
    chip: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200/80',
    progress: 'bg-[#FC9620]',
    spotlight: 'bg-orange-50 text-orange-800',
  },
  Interview: {
    chip: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80',
    progress: 'bg-emerald-500',
    spotlight: 'bg-emerald-50 text-emerald-800',
  },
  'Final Decision': {
    chip: 'bg-indigo-100 text-indigo-800 ring-1 ring-indigo-200/80',
    progress: 'bg-indigo-500',
    spotlight: 'bg-indigo-50 text-indigo-800',
  },
  Selected: {
    chip: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80',
    progress: 'bg-emerald-500',
    spotlight: 'bg-emerald-50 text-emerald-800',
  },
  Rejected: {
    chip: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200/80',
    progress: 'bg-rose-500',
    spotlight: 'bg-rose-50 text-rose-800',
  },
};

const INTERVIEW_STATUS_META: Record<InterviewItem['status'], string> = {
  Scheduled: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200/80',
  Rescheduled: 'bg-orange-100 text-orange-800 ring-1 ring-orange-200/80',
  Completed: 'bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200/80',
  Cancelled: 'bg-rose-100 text-rose-800 ring-1 ring-rose-200/80',
};

const PIPELINE_LABELS = ['Applied', 'Review', 'Shortlisted', 'Interview', 'Outcome'] as const;

const COMPANY_THEMES = [
  'from-[#28A8E1] to-[#28A8DF]',
  'from-[#FC9620] to-[#F2B86B]',
  'from-slate-700 to-slate-900',
  'from-emerald-500 to-teal-500',
  'from-indigo-500 to-sky-500',
  'from-fuchsia-500 to-pink-500',
] as const;

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function asNullableString(value: unknown): string | null {
  return asString(value);
}

function asNullableNumber(value: unknown): number | null {
  return asNumber(value);
}

function mergeUnique(items: string[]) {
  return Array.from(new Set(items.filter(Boolean)));
}

function isRecentDate(dateString: string | undefined, days: number) {
  if (!dateString) return false;

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return false;

  const now = Date.now();
  const distance = now - date.getTime();
  return distance <= days * 86400000;
}

function formatSavedJobMeta(job: SavedJobRecord) {
  const parts = [job.location, job.employmentType, job.workMode]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());

  return parts.length > 0 ? parts.join(' • ') : 'Details available on the jobs board';
}

function formatCompactMoney(value: number, currency = 'USD') {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  const formattedValue = formatter.format(value);
  return currency === 'USD' ? `$${formattedValue}` : `${currency} ${formattedValue}`;
}

function formatSavedSalary(job: SavedJobRecord) {
  if (job.salaryMin == null && job.salaryMax == null) return null;

  if (job.salaryMin != null && job.salaryMax != null) {
    return `${formatCompactMoney(job.salaryMin, job.salaryCurrency ?? undefined)} - ${formatCompactMoney(
      job.salaryMax,
      job.salaryCurrency ?? undefined
    )}`;
  }

  return formatCompactMoney(job.salaryMin ?? job.salaryMax ?? 0, job.salaryCurrency ?? undefined);
}

function mapJobRecord(job: Record<string, unknown>, fallbackId: string): DashboardJob {
  const companyValue = job.company;
  const clientValue = job.client;

  let companyName = 'Unknown Company';
  if (companyValue && typeof companyValue === 'object') {
    companyName =
      asString((companyValue as { name?: unknown }).name) ??
      asString((companyValue as { companyName?: unknown }).companyName) ??
      companyName;
  } else if (typeof companyValue === 'string') {
    companyName = companyValue;
  }

  if (clientValue && typeof clientValue === 'object') {
    companyName =
      asString((clientValue as { companyName?: unknown }).companyName) ?? companyName;
  }

  const companyLogo =
    asString(job.companyLogo) ??
    asString(job.logo) ??
    (companyValue && typeof companyValue === 'object'
      ? asString((companyValue as { logoUrl?: unknown }).logoUrl)
      : null) ??
    (clientValue && typeof clientValue === 'object'
      ? asString((clientValue as { logo?: unknown }).logo)
      : null);

  return {
    id: asString(job.id) ?? fallbackId,
    title: asString(job.jobTitle) ?? asString(job.title) ?? 'Untitled role',
    company: companyName,
    companyLogo,
    location: asNullableString(job.location),
    salaryMin:
      asNullableNumber(job.salaryMin) ??
      asNullableNumber((job.salary as { min?: unknown } | undefined)?.min),
    salaryMax:
      asNullableNumber(job.salaryMax) ??
      asNullableNumber((job.salary as { max?: unknown } | undefined)?.max),
    salaryCurrency:
      asString(job.salaryCurrency) ??
      asString((job.salary as { currency?: unknown } | undefined)?.currency) ??
      'USD',
    employmentType: asString(job.type) ?? asString(job.employmentType) ?? undefined,
    workMode: asString(job.workMode) ?? undefined,
    visaSponsorship:
      typeof job.visaSponsorship === 'boolean' ? job.visaSponsorship : false,
    postedAt: asString(job.postedAt) ?? asString(job.postedDate) ?? new Date().toISOString(),
    matchScore:
      asNullableNumber(job.matchScore) ?? asNullableNumber(job.normalizedScore) ?? null,
  };
}

function isWithinDateFilter(appliedDateStr: string, filter: string): boolean {
  if (filter === 'All Time') return true;
  const applied = new Date(appliedDateStr);
  if (Number.isNaN(applied.getTime())) return true;

  const now = new Date();
  const msPerDay = 86400000;
  let days = 0;

  switch (filter) {
    case 'Last 7 Days':
      days = 7;
      break;
    case 'Last 30 Days':
      days = 30;
      break;
    case 'Last 3 Months':
      days = 90;
      break;
    case 'Last 6 Months':
      days = 180;
      break;
    case 'Last Year':
      days = 365;
      break;
    default:
      return true;
  }

  const cutoff = new Date(now.getTime() - days * msPerDay);
  return applied >= cutoff;
}

function getApplicationStatusMeta(status: string): StatusMeta {
  return (
    APPLICATION_STATUS_META[status] || {
      chip: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
      progress: 'bg-slate-500',
      spotlight: 'bg-slate-50 text-slate-700',
    }
  );
}

function getCompanyInitials(company: string) {
  const initials = company
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  return initials || 'CO';
}

function getCompanyTheme(company: string) {
  const normalized = company.trim().toLowerCase();
  const hash = normalized.split('').reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return COMPANY_THEMES[hash % COMPANY_THEMES.length] ?? COMPANY_THEMES[0];
}

function getApplicationScoreLabel(matchScore: number | null | undefined) {
  return matchScore != null && matchScore > 0 ? `${Math.round(matchScore)}% match` : 'Match pending';
}

function getApplicationPipelineIndex(status: string) {
  const s = status.toLowerCase();
  if (s === 'submitted' || s === 'applied') return 0;
  if (s === 'under review') return 1;
  if (s === 'shortlisted' || s === 'assessment') return 2;
  if (s === 'interview') return 3;
  if (s === 'final decision' || s === 'selected' || s === 'rejected') return 4;
  return 0;
}

function getApplicationAction(
  application: Application,
  matchingInterview: InterviewItem | undefined,
  formatInterviewDateTime: (dateString: string) => string
) {
  if (matchingInterview) {
    return {
      label:
        matchingInterview.interviewType === 'online'
          ? 'Interview slot is confirmed'
          : 'Walk-in interview is scheduled',
      detail: `${formatInterviewDateTime(matchingInterview.interviewDateTime)} · ${matchingInterview.status}`,
      tone: 'bg-sky-50 text-sky-800',
    };
  }

  switch (application.status) {
    case 'Assessment':
      return {
        label: 'Assessment stage is active',
        detail: 'Review the application details and keep your profile updated for the next step.',
        tone: 'bg-orange-50 text-orange-800',
      };
    case 'Interview':
      return {
        label: 'Interview preparation recommended',
        detail: 'Your application is in an interview stage. Keep your profile and resume sharp.',
        tone: 'bg-emerald-50 text-emerald-800',
      };
    case 'Final Decision':
      return {
        label: 'Decision stage reached',
        detail: 'Recruiter feedback is likely next. Keep an eye on notifications and your inbox.',
        tone: 'bg-indigo-50 text-indigo-800',
      };
    case 'Selected':
      return {
        label: 'Application moved successfully',
        detail: 'This role has reached a successful outcome.',
        tone: 'bg-emerald-50 text-emerald-800',
      };
    case 'Rejected':
      return {
        label: 'Use this result as feedback',
        detail: 'Review this application detail page and use it to refine the next one.',
        tone: 'bg-rose-50 text-rose-800',
      };
    case 'Under Review':
    case 'Shortlisted':
      return {
        label: 'Recruiter review is in motion',
        detail: 'No action is required right now. Keep applying to maintain pipeline momentum.',
        tone: 'bg-sky-50 text-sky-800',
      };
    default:
      return {
        label: 'Application delivered successfully',
        detail: 'Track progress here and keep exploring similar opportunities.',
        tone: 'bg-slate-50 text-slate-700',
      };
  }
}

function CompanyMark({ company }: { company: string }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-gradient-to-br ${getCompanyTheme(
        company
      )} text-[13px] font-semibold uppercase tracking-[0.08em] text-white shadow-[0_14px_28px_rgba(15,23,42,0.14)]`}
    >
      {getCompanyInitials(company)}
    </div>
  );
}

function MetricTile({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: typeof BriefcaseBusiness;
}) {
  return (
    <div className="rounded-[18px] border border-white/75 bg-white/78 px-3.5 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
            {label}
          </p>
          <p className="mt-1.5 text-lg font-semibold tracking-tight text-slate-950 sm:text-xl">
            {value}
          </p>
        </div>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
          <Icon className="h-4 w-4" strokeWidth={2.1} />
        </span>
      </div>
      <p className="mt-2 text-[11px] font-medium leading-5 text-slate-500">{helper}</p>
    </div>
  );
}

function SegmentedControl({
  activeSection,
  applicationCount,
  interviewCount,
  savedJobsCount,
  onChange,
}: {
  activeSection: ActiveSection;
  applicationCount: number;
  interviewCount: number;
  savedJobsCount: number;
  onChange: (section: ActiveSection) => void;
}) {
  return (
    <div className="dashboard-scrollbar inline-flex max-w-full items-center overflow-x-auto rounded-full border border-white/80 bg-white/72 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      {([
        { key: 'applications', label: 'Applications', count: applicationCount },
        { key: 'interviews', label: 'Interviews', count: interviewCount },
        { key: 'savedJobs', label: 'Saved Jobs', count: savedJobsCount },
      ] as const).map((item) => {
        const active = activeSection === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              active
                ? 'bg-[#28A8E1] text-white shadow-[0_10px_18px_rgba(40,168,225,0.18)]'
                : 'text-slate-600 hover:bg-slate-100/80'
            }`}
          >
            {item.label}
            <span
              className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                active ? 'bg-white/18 text-white' : 'bg-slate-100 text-slate-500'
              }`}
            >
              {item.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function FilterPillRow({
  label,
  options,
  activeValue,
  onChange,
}: {
  label: string;
  options: string[];
  activeValue: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
      <p className="shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <div className="dashboard-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {options.map((option) => {
          const active = option === activeValue;
          return (
            <button
              key={option}
              type="button"
              onClick={() => onChange(option)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                active
                  ? 'bg-[#28A8E1] text-white shadow-[0_10px_18px_rgba(40,168,225,0.16)]'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LoadingSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <DashboardPanel key={`applications-skeleton-${index}`} className="animate-pulse p-4 sm:p-5">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-[18px] bg-slate-200" />
              <div className="min-w-0 flex-1 space-y-2">
                <div className="h-4 w-2/3 rounded-full bg-slate-200" />
                <div className="h-3 w-1/3 rounded-full bg-slate-200" />
              </div>
            </div>
            <div className="h-16 rounded-[18px] bg-slate-100" />
            <div className="h-14 rounded-[18px] bg-slate-100" />
            <div className="flex gap-2">
              <div className="h-8 flex-1 rounded-full bg-slate-100" />
              <div className="h-8 w-24 rounded-full bg-slate-100" />
            </div>
            <div className="h-10 rounded-xl bg-slate-200" />
          </div>
        </DashboardPanel>
      ))}
    </div>
  );
}

export default function ApplicationsPageClient() {
  const router = useRouter();
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState('All Time');
  const [displayedApplicationsCount, setDisplayedApplicationsCount] = useState(6);

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [minLoadingTimeFinished, setMinLoadingTimeFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingTimeFinished(true), 1500);
    return () => clearTimeout(timer);
  }, []);
  const [candidateMissing, setCandidateMissing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [savedJobsLoading, setSavedJobsLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [savedJobSourceJobs, setSavedJobSourceJobs] = useState<DashboardJob[]>([]);
  const [backendSavedJobs, setBackendSavedJobs] = useState<DashboardData['savedJobs']>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardData['stats'] | null>(null);
  const [interviews, setInterviews] = useState<InterviewItem[]>([]);

  useEffect(() => {
    const resolvedCandidateId =
      typeof window !== 'undefined' ? sessionStorage.getItem('candidateId') : null;

    setCandidateId(resolvedCandidateId);

    if (!resolvedCandidateId) {
      setCandidateMissing(true);
      setLoading(false);
      setSavedJobsLoading(false);
      setApplications([]);
      setSavedJobSourceJobs([]);
      setBackendSavedJobs([]);
      return;
    }

    setCandidateMissing(false);
  }, []);

  useEffect(() => {
    if (!candidateId) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setFetchError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/applications/${candidateId}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        const payload: unknown = await response.json().catch(() => ({}));
        const success = Boolean((payload as { success?: unknown })?.success);
        const data = (payload as { data?: unknown })?.data;

        if (!response.ok) {
          const message =
            (payload as { message?: string })?.message ||
            `Could not load applications (${response.status})`;
          throw new Error(message);
        }

        if (!cancelled && success && Array.isArray(data)) {
          const loadedApplications = data as Application[];
          setApplications(loadedApplications);
        } else if (!cancelled) {
          setApplications([]);
        }
      } catch (error) {
        if (!cancelled) {
          setFetchError(error instanceof Error ? error.message : 'Failed to load applications');
          setApplications([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) return;

    const stored = localStorage.getItem(`${SAVED_JOBS_STORAGE_PREFIX}:${candidateId}`);
    if (!stored) {
      setSavedJobIds([]);
      return;
    }

    try {
      const parsed = JSON.parse(stored) as unknown;
      if (Array.isArray(parsed)) {
        setSavedJobIds(parsed.filter((item): item is string => typeof item === 'string'));
      } else {
        setSavedJobIds([]);
      }
    } catch (error) {
      console.error('Could not parse saved jobs from local storage:', error);
      setSavedJobIds([]);
    }
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) return;

    localStorage.setItem(
      `${SAVED_JOBS_STORAGE_PREFIX}:${candidateId}`,
      JSON.stringify(savedJobIds)
    );
  }, [candidateId, savedJobIds]);

  useEffect(() => {
    if (!candidateId) return;

    let cancelled = false;

    const loadSavedJobSources = async () => {
      setSavedJobsLoading(true);

      const nextBackendSavedJobs: DashboardData['savedJobs'] = [];
      const nextAvailableJobs: DashboardJob[] = [];

      const dashboardRequest = fetch(`${API_BASE_URL}/cv/dashboard/${candidateId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const jobsRequest = (async () => {
        // Important: do NOT call personalized matching on Applications page.
        // Personalized endpoint runs the job-matching pipeline and should only
        // be used from Dashboard / Explore Jobs pages.
        const response = await fetch(`${API_BASE_URL}/jobs?limit=80`, { method: 'GET' });
        const result = (await response.json()) as {
          success?: boolean;
          data?: { jobs?: unknown[] } | unknown[];
        };

        if (!response.ok || !result.success) {
          throw new Error('Failed to load saved job sources');
        }

        const rawJobs = Array.isArray(result.data)
          ? result.data
          : Array.isArray((result.data as { jobs?: unknown[] } | undefined)?.jobs)
          ? (result.data as { jobs?: unknown[] }).jobs || []
          : [];

        return rawJobs
          .filter((job): job is Record<string, unknown> => typeof job === 'object' && job !== null)
          .map((job, index) => mapJobRecord(job, `saved-job-${index + 1}`));
      })();

      const [dashboardResult, jobsResult] = await Promise.allSettled([
        dashboardRequest,
        jobsRequest,
      ]);

      if (dashboardResult.status === 'fulfilled') {
        try {
          const payload = (await dashboardResult.value.json()) as {
            success?: boolean;
            data?: DashboardData;
          };

          if (dashboardResult.value.ok && payload.success && payload.data) {
            if (payload.data.stats) {
              setDashboardStats(payload.data.stats);
            }
            if (Array.isArray(payload.data.savedJobs)) {
              nextBackendSavedJobs.push(...payload.data.savedJobs);
            }
          }
        } catch (error) {
          console.error('Could not parse dashboard saved jobs:', error);
        }
      }

      if (jobsResult.status === 'fulfilled') {
        nextAvailableJobs.push(...jobsResult.value);
      } else {
        console.error('Could not load saved job cards:', jobsResult.reason);
      }

      if (!cancelled) {
        setBackendSavedJobs(nextBackendSavedJobs);
        setSavedJobSourceJobs(nextAvailableJobs);
        setSavedJobsLoading(false);
      }
    };

    void loadSavedJobSources();

    return () => {
      cancelled = true;
    };
  }, [candidateId]);

  useEffect(() => {
    const backendSavedIds = backendSavedJobs.map((job) => job.id);
    if (backendSavedIds.length === 0) return;

    setSavedJobIds((previous) => mergeUnique([...previous, ...backendSavedIds]));
  }, [backendSavedJobs]);

  const filteredApplications = useMemo(() => {
    return applications.filter((application) => {
      const matchesSearch =
        searchQuery === '' ||
        application.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        application.company.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'All' || application.status === statusFilter;
      const matchesDate = isWithinDateFilter(application.appliedDate, dateFilter);

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [applications, searchQuery, statusFilter, dateFilter]);

  const savedJobs = useMemo<SavedJobRecord[]>(() => {
    const combinedIds = mergeUnique(savedJobIds);

    const sourceJobsById = new Map(savedJobSourceJobs.map((job) => [job.id, job]));
    const backendSavedById = new Map(backendSavedJobs.map((job) => [job.id, job]));

    return combinedIds
      .map((jobId) => {
        const sourceJob = sourceJobsById.get(jobId);
        const backendSavedJob = backendSavedById.get(jobId);

        if (sourceJob) {
          return {
            ...sourceJob,
            title: sourceJob.title || backendSavedJob?.title || 'Untitled role',
            company: sourceJob.company || backendSavedJob?.company || 'Unknown Company',
            location: sourceJob.location ?? backendSavedJob?.location ?? null,
            savedAt: backendSavedJob?.savedAt ?? null,
          };
        }

        if (backendSavedJob) {
          return {
            id: backendSavedJob.id,
            title: backendSavedJob.title,
            company: backendSavedJob.company,
            companyLogo: null,
            location: backendSavedJob.location,
            salaryMin: null,
            salaryMax: null,
            salaryCurrency: 'USD',
            employmentType: undefined,
            workMode: undefined,
            visaSponsorship: false,
            postedAt: backendSavedJob.savedAt || new Date().toISOString(),
            matchScore: null,
            savedAt: backendSavedJob.savedAt,
          };
        }

        return null;
      })
      .filter((job): job is NonNullable<typeof job> => job !== null) as SavedJobRecord[];
  }, [backendSavedJobs, savedJobIds, savedJobSourceJobs]);

  const filteredInterviews = useMemo(() => {
    return interviews.filter((interview) => {
      const matchesSearch =
        searchQuery === '' ||
        interview.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        interview.company.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    });
  }, [interviews, searchQuery]);

  const filteredSavedJobs = useMemo(() => {
    return savedJobs.filter((job) => {
      const query = searchQuery.trim().toLowerCase();
      if (!query) return true;

      return (
        job.title.toLowerCase().includes(query) ||
        job.company.toLowerCase().includes(query) ||
        (job.location || '').toLowerCase().includes(query)
      );
    });
  }, [savedJobs, searchQuery]);

  const displayedApplications = filteredApplications.slice(0, displayedApplicationsCount);

  const applicationSummary = useMemo(() => {
    // If we have dashboard stats, use them as primary "real" source
    if (dashboardStats) {
      return {
        total: dashboardStats.totalApplications,
        reviewing: dashboardStats.reviewing,
        interviews: dashboardStats.interviews,
        selected: dashboardStats.offersReceived ?? 0,
      };
    }

    return {
      total: applications.length,
      reviewing: applications.filter((application) =>
        ['Under Review', 'Shortlisted', 'Assessment'].includes(application.status)
      ).length,
      interviews: applications.filter((application) => application.status === 'Interview').length,
      selected: applications.filter((application) => application.status === 'Selected').length,
    };
  }, [applications, dashboardStats]);

  const interviewSummary = useMemo(() => {
    return {
      total: interviews.length,
      scheduled: interviews.filter((interview) =>
        ['Scheduled', 'Rescheduled'].includes(interview.status)
      ).length,
      online: interviews.filter((interview) => interview.interviewType === 'online').length,
      completed: interviews.filter((interview) => interview.status === 'Completed').length,
    };
  }, [interviews]);

  const savedJobsSummary = useMemo(() => {
    return {
      total: savedJobs.length,
      strongMatch: savedJobs.filter((job) => (job.matchScore ?? 0) >= 75).length,
      remote: savedJobs.filter((job) => (job.workMode || '').toUpperCase().includes('REMOTE'))
        .length,
      recent: savedJobs.filter((job) => isRecentDate(job.postedAt, 14)).length,
    };
  }, [savedJobs]);

  const heroMetrics = useMemo(() => {
    if (activeSection === 'savedJobs') {
      return [
        {
          id: 'saved-total',
          label: 'Saved',
          value: String(savedJobsSummary.total),
          helper: 'Roles bookmarked for later',
          icon: BookmarkCheck,
        },
        {
          id: 'saved-strong',
          label: 'High Match',
          value: String(savedJobsSummary.strongMatch),
          helper: 'Saved roles with strong fit',
          icon: Sparkles,
        },
        {
          id: 'saved-remote',
          label: 'Remote',
          value: String(savedJobsSummary.remote),
          helper: 'Remote-friendly saved roles',
          icon: MapPin,
        },
        {
          id: 'saved-recent',
          label: 'Fresh',
          value: String(savedJobsSummary.recent),
          helper: 'Recently posted opportunities',
          icon: Clock3,
        },
      ];
    }

    if (activeSection === 'interviews') {
      return [
        {
          id: 'scheduled',
          label: 'Scheduled',
          value: String(interviewSummary.scheduled),
          helper: 'Upcoming interview slots',
          icon: CalendarRange,
        },
        {
          id: 'online',
          label: 'Online',
          value: String(interviewSummary.online),
          helper: 'Remote interview sessions',
          icon: Video,
        },
        {
          id: 'completed',
          label: 'Completed',
          value: String(interviewSummary.completed),
          helper: 'Interview rounds finished',
          icon: CheckCircle2,
        },
        {
          id: 'total-interviews',
          label: 'Total',
          value: String(interviewSummary.total),
          helper: 'Interview records tracked',
          icon: Target,
        },
      ];
    }

    return [
      {
        id: 'applied',
        label: 'Applied',
        value: String(applicationSummary.total),
        helper: 'Roles already submitted',
        icon: BriefcaseBusiness,
      },
      {
        id: 'reviewing',
        label: 'Reviewing',
        value: String(applicationSummary.reviewing),
        helper: 'Under review and shortlist stages',
        icon: FileSearch,
      },
      {
        id: 'interviewing',
        label: 'Interviews',
        value: String(applicationSummary.interviews),
        helper: 'Roles in interview rounds',
        icon: CalendarRange,
      },
      {
        id: 'selected',
        label: 'Success',
        value: String(applicationSummary.selected),
        helper: 'Roles marked selected',
        icon: CheckCircle2,
      },
    ];
  }, [activeSection, applicationSummary, interviewSummary, savedJobsSummary]);

  const featuredInterview = filteredInterviews[0] ?? null;

  const featuredSavedJob = useMemo(() => {
    if (filteredSavedJobs.length === 0) return null;

    return [...filteredSavedJobs].sort((left, right) => {
      const scoreDifference = (right.matchScore ?? 0) - (left.matchScore ?? 0);
      if (scoreDifference !== 0) return scoreDifference;

      const rightTime = new Date(right.savedAt || right.postedAt).getTime();
      const leftTime = new Date(left.savedAt || left.postedAt).getTime();
      const timeDifference = rightTime - leftTime;

      if (Number.isFinite(timeDifference) && timeDifference !== 0) {
        return timeDifference;
      }

      return left.title.localeCompare(right.title);
    })[0];
  }, [filteredSavedJobs]);

  const featuredApplication = useMemo(() => {
    if (filteredApplications.length === 0) return null;

    const interviewBackedApplication = filteredApplications.find((application) =>
      interviews.some(
        (interview) =>
          interview.jobTitle.toLowerCase() === application.jobTitle.toLowerCase() ||
          interview.company.toLowerCase() === application.company.toLowerCase()
      )
    );

    if (interviewBackedApplication) return interviewBackedApplication;

    return (
      filteredApplications.find((application) =>
        ['Assessment', 'Interview', 'Final Decision', 'Under Review', 'Shortlisted'].includes(
          application.status
        )
      ) ?? filteredApplications[0]
    );
  }, [filteredApplications, interviews]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatInterviewDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const hasActiveFilters =
    activeSection === 'applications'
      ? searchQuery !== '' || statusFilter !== 'All' || dateFilter !== 'All Time'
      : searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setDateFilter('All Time');
  };

  const handleLoadMore = () => {
    setDisplayedApplicationsCount((currentCount) => currentCount + 6);
  };

  const handleToggleSavedJob = (jobId: string) => {
    const wasSaved = savedJobIds.includes(jobId);
    setSavedJobIds((previous) =>
      previous.includes(jobId)
        ? previous.filter((item) => item !== jobId)
        : [...previous, jobId]
    );
    showSuccessToast(wasSaved ? 'Job removed from saved jobs' : 'Job saved');
  };

  const renderApplicationCard = (application: Application) => {
    const matchingInterview = interviews.find(
      (interview) =>
        interview.jobTitle.toLowerCase() === application.jobTitle.toLowerCase() ||
        interview.company.toLowerCase() === application.company.toLowerCase()
    );
    const statusMeta = getApplicationStatusMeta(application.status);
    const pipelineIndex = getApplicationPipelineIndex(application.status);
    const progressWidth = ['12%', '32%', '56%', '78%', '100%'][pipelineIndex] ?? '12%';
    const action = getApplicationAction(application, matchingInterview, formatInterviewDateTime);

    return (
      <DashboardPanel key={application.id} className="h-full p-4 sm:p-5">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <CompanyMark company={application.company} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight text-slate-950">
                  {application.jobTitle}
                </p>
                <p className="mt-1 truncate text-sm font-medium text-slate-500">
                  {application.company}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusMeta.chip}`}>
                {application.status}
              </span>
              <span className="rounded-full bg-[var(--brand-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-accent)]">
                {getApplicationScoreLabel(application.matchScore)}
              </span>
            </div>
          </div>

          <div className={`rounded-[18px] px-3.5 py-3 ${action.tone}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">
              Next action
            </p>
            <p className="mt-1 text-sm font-semibold">{action.label}</p>
            <p className="mt-1 text-[12px] leading-5 opacity-80">{action.detail}</p>
          </div>

          <div className="rounded-[18px] border border-slate-100/90 bg-slate-50/85 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                Progress
              </p>
              <p className="text-[11px] font-semibold text-slate-600">
                {application.status}
              </p>
            </div>

            <div className="mt-2 h-1.5 rounded-full bg-white">
              <div
                className={`h-full rounded-full ${statusMeta.progress}`}
                style={{ width: progressWidth }}
              />
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1">
              {PIPELINE_LABELS.map((label, index) => {
                const active = pipelineIndex >= index;
                return (
                  <div key={label} className="text-center">
                    <div className="mx-auto mb-1 h-1.5 w-1.5 rounded-full bg-slate-200">
                      <div
                        className={`h-full w-full rounded-full ${
                          active ? statusMeta.progress : 'bg-transparent'
                        }`}
                      />
                    </div>
                    <p
                      className={`text-[10px] font-medium ${
                        active ? 'text-slate-700' : 'text-slate-400'
                      }`}
                    >
                      {label}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
              <Clock3 className="h-3 w-3" strokeWidth={2.1} />
              Applied {formatDate(application.appliedDate)}
            </span>
            {matchingInterview ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
                <CalendarRange className="h-3 w-3" strokeWidth={2.1} />
                {matchingInterview.status}
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex gap-2">
            {matchingInterview?.interviewType === 'online' && matchingInterview.joinUrl ? (
              <button
                type="button"
                onClick={() => {
                  window.open(matchingInterview.joinUrl, '_blank', 'noopener,noreferrer');
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(40,168,225,0.22)] bg-white px-3 py-2 text-[12px] font-semibold text-[var(--brand-primary)] transition-all duration-200 hover:bg-[var(--brand-primary-soft)]"
              >
                Join interview
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => router.push(`/applications/${application.id}`)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
            >
              View status
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.1} />
            </button>
          </div>
        </div>
      </DashboardPanel>
    );
  };

  const renderSavedJobCard = (job: SavedJobRecord) => {
    const matchLabel =
      job.matchScore != null && job.matchScore > 0
        ? `${Math.round(job.matchScore)}% match`
        : 'Saved role';
    const savedLabel = job.savedAt ? `Saved ${formatDate(job.savedAt)}` : 'Saved in your list';
    const postedLabel = isRecentDate(job.postedAt, 7)
      ? 'Posted recently'
      : `Posted ${formatDate(job.postedAt)}`;
    const salaryLabel = formatSavedSalary(job);

    return (
      <DashboardPanel key={job.id} className="h-full p-4 sm:p-5">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <CompanyMark company={job.company} />
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold tracking-tight text-slate-950">
                  {job.title}
                </p>
                <p className="mt-1 truncate text-sm font-medium text-slate-500">{job.company}</p>
                <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {formatSavedJobMeta(job)}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-[var(--brand-accent-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-accent)]">
              {matchLabel}
            </span>
          </div>

          <div className="rounded-[18px] border border-slate-100/90 bg-slate-50/85 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              Why keep this role
            </p>
            <p className="mt-1 text-sm font-semibold text-slate-900">
              {job.matchScore != null && job.matchScore >= 75
                ? 'This role still looks like a strong fit for your profile.'
                : 'You bookmarked this role to revisit when you are ready to apply.'}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">
              Open the jobs board to review the latest details and apply when the timing feels right.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
              <BookmarkCheck className="h-3 w-3" strokeWidth={2.1} />
              {savedLabel}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
              <Clock3 className="h-3 w-3" strokeWidth={2.1} />
              {postedLabel}
            </span>
            {salaryLabel ? (
              <span className="inline-flex rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
                {salaryLabel}
              </span>
            ) : null}
            {job.visaSponsorship ? (
              <span className="inline-flex rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-1 text-[var(--brand-primary)]">
                Visa friendly
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex gap-2">
            <button
              type="button"
              onClick={() => handleToggleSavedJob(job.id)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition-all duration-200 hover:border-[rgba(40,168,225,0.22)] hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)]"
            >
              Remove saved
              <BookmarkCheck className="h-3.5 w-3.5" strokeWidth={2.1} />
            </button>
            <button
              type="button"
              onClick={() => router.push('/explore-jobs')}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
            >
              Apply now
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
            </button>
          </div>
        </div>
      </DashboardPanel>
    );
  };

  if (candidateMissing) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
        <main className="w-full grow overflow-x-hidden">
          <div className="mx-auto max-w-[1320px] px-6 py-14 lg:px-8">
            <DashboardPanel className="px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                <BriefcaseBusiness className="h-7 w-7" strokeWidth={2.2} />
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-slate-950">
                Sign in to see your applications
              </h1>
              <p className="mx-auto mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-500">
                Verify your WhatsApp number so we can load only your application history,
                interview schedule, and next recommended actions.
              </p>
              <button
                type="button"
                onClick={() => router.push('/whatsapp/verify')}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(40,168,225,0.2)] transition-all duration-200 hover:bg-[#28A8DF]"
              >
                Continue with WhatsApp
              </button>
            </DashboardPanel>
          </div>
        </main>
      </div>
    );
  }

  if (loading || !minLoadingTimeFinished) {
    return <GlobalLoader />;
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>

      <main className="w-full grow overflow-x-hidden pt-2 sm:pt-4 lg:pt-6">
        <div className="mx-auto max-w-[1180px] px-4 pt-0 pb-2 sm:px-5 sm:pb-3 lg:px-6 lg:pb-4">
          <div className="space-y-1.5">
            <DashboardPanel className="relative overflow-hidden px-4 py-1.5 sm:px-5 sm:py-2 lg:px-6 lg:py-3">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(40,168,225,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(252,150,32,0.08),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(40,168,223,0.1),transparent_30%)]" />

              <div className="relative flex flex-col gap-1 xl:flex-row xl:items-start xl:justify-between">
                <div className="max-w-2xl space-y-1">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-primary-soft)] bg-white/72 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-primary)] shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                    Application command center
                  </div>

                  <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => router.back()}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                      title="Go Back"
                    >
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m15 18-6-6 6-6" />
                      </svg>
                    </button>
                    <h1 className="text-[1.8rem] font-semibold tracking-tight text-slate-950 sm:text-[2.1rem]">
                      {activeSection === 'applications'
                        ? 'My Applications'
                        : activeSection === 'interviews'
                        ? 'Interview Tracker'
                        : 'Saved Jobs'}
                    </h1>
                  </div>
                    <p className="max-w-2xl text-[13px] font-medium leading-6 text-slate-600 sm:text-sm">
                      {activeSection === 'applications'
                        ? 'Track every role, understand its current stage, and move quickly on the applications that need attention.'
                        : activeSection === 'interviews'
                        ? 'Keep your interview schedule, formats, and next actions in one cleaner view.'
                        : 'Revisit the roles you bookmarked, compare fit signals, and jump back into the jobs board when you want to apply.'}
                    </p>
                  </div>

                  <SegmentedControl
                    activeSection={activeSection}
                    applicationCount={applications.length}
                    interviewCount={interviews.length}
                    savedJobsCount={savedJobs.length}
                    onChange={setActiveSection}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2 xl:w-[460px]">
                  {heroMetrics.map((metric) => (
                    <MetricTile
                      key={metric.id}
                      label={metric.label}
                      value={metric.value}
                      helper={metric.helper}
                      icon={metric.icon}
                    />
                  ))}
                </div>
              </div>
            </DashboardPanel>

            {fetchError ? (
              <DashboardPanel className="border border-rose-100 bg-rose-50/90 px-4 py-3 text-sm font-medium text-rose-800">
                {fetchError}
              </DashboardPanel>
            ) : null}

            {activeSection === 'applications' && featuredApplication ? (
              <DashboardPanel className="px-4 py-2 sm:px-5 sm:py-2">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <CompanyMark company={featuredApplication.company} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
                        Needs attention
                      </p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                        {featuredApplication.jobTitle}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {featuredApplication.company}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:max-w-[420px] lg:items-end">
                    <p className={`rounded-full px-3 py-1 text-[11px] font-semibold ${getApplicationStatusMeta(featuredApplication.status).chip}`}>
                      {featuredApplication.status}
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push(`/applications/${featuredApplication.id}`)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                    >
                      Open application
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                    </button>
                  </div>
                </div>
              </DashboardPanel>
            ) : null}

            {activeSection === 'interviews' && featuredInterview ? (
              <DashboardPanel className="px-4 py-2 sm:px-5 sm:py-2">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
                      Upcoming interview
                    </p>
                    <h2 className="text-lg font-semibold tracking-tight text-slate-950">
                      {featuredInterview.jobTitle}
                    </h2>
                    <p className="text-sm font-medium text-slate-500">{featuredInterview.company}</p>
                    <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
                        <CalendarRange className="h-3 w-3" strokeWidth={2.1} />
                        {formatInterviewDateTime(featuredInterview.interviewDateTime)}
                      </span>
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
                        {featuredInterview.interviewType === 'online' ? (
                          <Video className="h-3 w-3" strokeWidth={2.1} />
                        ) : (
                          <MapPin className="h-3 w-3" strokeWidth={2.1} />
                        )}
                        {featuredInterview.interviewType === 'online' ? 'Online' : 'Walk-in'}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {featuredInterview.interviewType === 'online' && featuredInterview.joinUrl ? (
                      <button
                        type="button"
                        onClick={() =>
                          window.open(featuredInterview.joinUrl, '_blank', 'noopener,noreferrer')
                        }
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(40,168,225,0.22)] bg-white px-4 py-2 text-[12px] font-semibold text-[var(--brand-primary)] transition-all duration-200 hover:bg-[var(--brand-primary-soft)]"
                      >
                        Join interview
                        <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                      </button>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => router.push(`/interviews/${featuredInterview.id}`)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                    >
                      View details
                      <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                    </button>
                  </div>
                </div>
              </DashboardPanel>
            ) : null}

            {activeSection === 'savedJobs' && featuredSavedJob ? (
              <DashboardPanel className="px-4 py-2 sm:px-5 sm:py-2">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <CompanyMark company={featuredSavedJob.company} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-accent)]">
                        Saved spotlight
                      </p>
                      <h2 className="mt-1 text-lg font-semibold tracking-tight text-slate-950">
                        {featuredSavedJob.title}
                      </h2>
                      <p className="mt-1 text-sm font-medium text-slate-500">
                        {featuredSavedJob.company}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        {formatSavedJobMeta(featuredSavedJob)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:max-w-[420px] lg:items-end">
                    <p className="rounded-full bg-[var(--brand-accent-soft)] px-3 py-1 text-[11px] font-semibold text-[var(--brand-accent)]">
                      {featuredSavedJob.matchScore != null && featuredSavedJob.matchScore > 0
                        ? `${Math.round(featuredSavedJob.matchScore)}% match`
                        : 'Saved for later'}
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push('/explore-jobs')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                    >
                      Open jobs board
                      <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                    </button>
                  </div>
                </div>
              </DashboardPanel>
            ) : null}

            <DashboardPanel className="px-4 py-2 sm:px-5">
              <div className="flex flex-col gap-2">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="relative xl:max-w-[440px] xl:flex-1">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(event) => setSearchQuery(event.target.value)}
                      placeholder={
                        activeSection === 'applications'
                          ? 'Search by job title or company'
                          : activeSection === 'interviews'
                          ? 'Search interviews by role or company'
                          : 'Search saved jobs by role, company, or location'
                      }
                      className="w-full rounded-[18px] border border-slate-200/80 bg-slate-50/85 py-3 pl-11 pr-4 text-sm font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[rgba(40,168,225,0.28)] focus:bg-white focus:ring-4 focus:ring-[rgba(40,168,225,0.08)]"
                    />
                  </div>

                  {activeSection === 'applications' ? (
                    <div className="flex-1 space-y-3">
                      <FilterPillRow
                        label="Status"
                        options={STATUS_OPTIONS}
                        activeValue={statusFilter}
                        onChange={setStatusFilter}
                      />
                      <FilterPillRow
                        label="Timeline"
                        options={DATE_OPTIONS}
                        activeValue={dateFilter}
                        onChange={setDateFilter}
                      />
                    </div>
                  ) : activeSection === 'interviews' ? (
                    <div className="flex items-center gap-2 rounded-full bg-slate-100/85 px-3 py-2 text-[11px] font-semibold text-slate-500">
                      <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2.2} />
                      Search updates your interview list in real time
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full bg-slate-100/85 px-3 py-2 text-[11px] font-semibold text-slate-500">
                      <BookmarkCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                      Saved jobs stay synced with the dashboard bookmarks
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-[12px] font-medium text-slate-500">
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--brand-primary-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-primary)]">
                      {activeSection === 'applications'
                        ? `${filteredApplications.length} applications`
                        : activeSection === 'interviews'
                        ? `${filteredInterviews.length} interviews`
                        : `${filteredSavedJobs.length} saved jobs`}
                    </span>
                    {activeSection === 'applications' ? (
                      <span className="text-slate-400">
                        Showing {Math.min(displayedApplications.length, filteredApplications.length)} of{' '}
                        {filteredApplications.length}
                      </span>
                    ) : activeSection === 'savedJobs' ? (
                      <span className="text-slate-400">
                        Showing {filteredSavedJobs.length} of {savedJobs.length}
                      </span>
                    ) : null}
                  </div>

                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-all duration-200 hover:border-[rgba(40,168,225,0.22)] hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)]"
                    >
                      Clear filters
                      <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                    </button>
                  ) : null}
                </div>
              </div>
            </DashboardPanel>

            {activeSection === 'applications' ? (
              loading ? (
                <LoadingSkeleton />
              ) : displayedApplications.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {displayedApplications.map((application) => renderApplicationCard(application))}
                  </div>

                  {displayedApplicationsCount < filteredApplications.length ? (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-[rgba(40,168,225,0.22)] hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)]"
                      >
                        Load more applications
                        <ChevronRight className="h-4 w-4" strokeWidth={2.1} />
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <DashboardPanel className="px-6 py-12 text-center sm:px-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-100 text-slate-400">
                    <BriefcaseBusiness className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                    {applications.length === 0 ? 'No applications yet' : 'No applications found'}
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
                    {applications.length === 0
                      ? 'Browse jobs and apply - your application history will show up here.'
                      : 'We could not find any applications matching your current search or filters.'}
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    {applications.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => router.push('/explore-jobs')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                      >
                        Explore jobs
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
                      </button>
                    ) : null}
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
                      >
                        Reset filters
                      </button>
                    ) : null}
                  </div>
                </DashboardPanel>
              )
            ) : activeSection === 'savedJobs' ? (
              savedJobsLoading ? (
                <LoadingSkeleton count={3} />
              ) : filteredSavedJobs.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredSavedJobs.map((job) => renderSavedJobCard(job))}
                </div>
              ) : (
                <DashboardPanel className="px-6 py-12 text-center sm:px-10">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-100 text-slate-400">
                    <BookmarkCheck className="h-7 w-7" strokeWidth={1.8} />
                  </div>
                  <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                    {savedJobs.length === 0 ? 'No saved jobs yet' : 'No saved jobs found'}
                  </h2>
                  <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
                    {savedJobs.length === 0
                      ? 'Save roles from the dashboard and they will appear here for quick follow-up.'
                      : 'We could not find any saved jobs matching your current search.'}
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/explore-jobs')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                    >
                      Explore jobs
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
                    </button>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
                      >
                        Reset search
                      </button>
                    ) : null}
                  </div>
                </DashboardPanel>
              )
            ) : filteredInterviews.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {filteredInterviews.map((interview) => (
                  <DashboardPanel key={interview.id} className="h-full p-4 sm:p-5">
                    <div className="flex h-full flex-col gap-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-3">
                          <CompanyMark company={interview.company} />
                          <div className="min-w-0">
                            <p className="truncate text-lg font-semibold tracking-tight text-slate-950">
                              {interview.jobTitle}
                            </p>
                            <p className="mt-1 truncate text-sm font-medium text-slate-500">
                              {interview.company}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            INTERVIEW_STATUS_META[interview.status]
                          }`}
                        >
                          {interview.status}
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-[16px] bg-slate-50/90 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Scheduled
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {formatInterviewDateTime(interview.interviewDateTime)}
                          </p>
                        </div>
                        <div className="rounded-[16px] bg-slate-50/90 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            Format
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-900">
                            {interview.interviewType === 'online' ? 'Online interview' : 'Walk-in interview'}
                          </p>
                        </div>
                      </div>

                      <div className="rounded-[18px] border border-slate-100/90 bg-slate-50/85 px-3.5 py-3 text-sm font-medium text-slate-600">
                        {interview.interviewType === 'online'
                          ? 'Meeting access is available when you are ready to join.'
                          : 'Keep interview documents and location details handy before the visit.'}
                      </div>

                      <div className="mt-auto grid grid-cols-2 gap-2">
                        {interview.interviewType === 'online' ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (interview.joinUrl) {
                                window.open(interview.joinUrl, '_blank', 'noopener,noreferrer');
                              }
                            }}
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-3 py-2.5 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                          >
                            Join
                            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-500"
                            disabled
                          >
                            Walk-in
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => router.push(`/interviews/${interview.id}`)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 transition-all duration-200 hover:border-[rgba(40,168,225,0.22)] hover:bg-[var(--brand-primary-soft)] hover:text-[var(--brand-primary)]"
                        >
                          View details
                          <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                        </button>
                      </div>
                    </div>
                  </DashboardPanel>
                ))}
              </div>
            ) : (
              <DashboardPanel className="px-6 py-12 text-center sm:px-10">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[22px] bg-slate-100 text-slate-400">
                  <CalendarRange className="h-7 w-7" strokeWidth={1.8} />
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight text-slate-950">
                  No interviews scheduled
                </h2>
                <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
                  You do not have any interview events in view right now. Keep applying to increase
                  your chances.
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/explore-jobs')}
                  className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                >
                  Explore jobs
                  <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
                </button>
              </DashboardPanel>
            )}
          </div>
        </div>
      </main>

    </div>
  );
}
