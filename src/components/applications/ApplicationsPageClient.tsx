'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
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
import { resolvePortalCompanyLogo, resolvePortalCompanyName } from '@/lib/map-portal-job';
import { showSuccessToast } from '@/components/common/toast/toast';
import type { DashboardJob } from '@/components/dashboard/dashboard-types';
import { API_BASE_URL } from '@/lib/profile-completion';
import { usePortalApplications } from '@/hooks/portal/usePortalApplications';
import { useCvDashboard } from '@/hooks/portal/useCvDashboard';
import { usePortalJobsList } from '@/hooks/portal/usePortalJobs';
import type { AppLocale } from '@/lib/i18n';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import { runSuggestionsEngine } from '@/lib/suggestions-engine';

type ApplicationStatus =
  | 'Applied'
  | 'Screening'
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
  /** Set when CRM schedules an interview (Phase 2) and backend syncs portal application timeline. */
  interviewScheduledAt?: string | null;
  interviewJoinUrl?: string | null;
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
  'Applied',
  'Screening',
  'Submitted',
  'Shortlisted',
  'Assessment',
  'Interview',
  'Final Decision',
  'Selected',
  'Rejected',
];

const DATE_FILTER_KEYS = [
  'allTime',
  'last7Days',
  'last30Days',
  'last3Months',
  'last6Months',
  'lastYear',
] as const;

type DateFilterKey = (typeof DATE_FILTER_KEYS)[number];

const PIPELINE_STEP_KEYS = [
  'pipelineApplied',
  'pipelineReview',
  'pipelineShortlisted',
  'pipelineInterview',
  'pipelineOutcome',
] as const;

type TranslateFn = (key: string, values?: Record<string, string | number>) => string;

const PAGE_BG =
  'linear-gradient(135deg, #e0f2fe 0%, #ecf7fd 12%, #fafbfb 30%, #fdf6f0 55%, #fef5ed 85%, #fef5ed 100%)';

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
    status: 'Screening',
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
  Applied: {
    chip: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
    progress: 'bg-slate-500',
    spotlight: 'bg-slate-50 text-slate-700',
  },
  Submitted: {
    chip: 'bg-slate-100 text-slate-700 ring-1 ring-slate-200/80',
    progress: 'bg-slate-500',
    spotlight: 'bg-slate-50 text-slate-700',
  },
  Screening: {
    chip: 'bg-sky-100 text-sky-800 ring-1 ring-sky-200/80',
    progress: 'bg-[#28A8E1]',
    spotlight: 'bg-sky-50 text-sky-800',
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

function formatSavedJobMeta(job: SavedJobRecord, t: TranslateFn) {
  const parts = [job.location, job.employmentType, job.workMode]
    .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
    .map((part) => part.trim());

  return parts.length > 0 ? parts.join(' • ') : t('detailsOnJobsBoard');
}

function formatCompactMoney(value: number, currency?: string | null) {
  const formatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });
  const formattedValue = formatter.format(value);
  const sym =
    !currency || currency === 'USD'
      ? '$'
      : currency.length <= 4 && /^[A-Z$€£₹]{1,4}$/i.test(currency)
        ? currency === 'INR'
          ? '₹'
          : currency
        : null;
  if (sym) return `${sym}${formattedValue}`;
  if (/₹|rupee/i.test(currency || '')) return `₹${formattedValue}`;
  return currency ? `${formattedValue} ${currency}` : `$${formattedValue}`;
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
  return {
    id: asString(job.id) ?? fallbackId,
    title: asString(job.jobTitle) ?? asString(job.title) ?? 'Untitled role',
    company: resolvePortalCompanyName(job),
    companyLogo: resolvePortalCompanyLogo(job, ''),
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

function isWithinDateFilter(appliedDateStr: string, filter: DateFilterKey): boolean {
  if (filter === 'allTime') return true;
  const applied = new Date(appliedDateStr);
  if (Number.isNaN(applied.getTime())) return true;

  const now = new Date();
  const msPerDay = 86400000;
  let days = 0;

  switch (filter) {
    case 'last7Days':
      days = 7;
      break;
    case 'last30Days':
      days = 30;
      break;
    case 'last3Months':
      days = 90;
      break;
    case 'last6Months':
      days = 180;
      break;
    case 'lastYear':
      days = 365;
      break;
    default:
      return true;
  }

  const cutoff = new Date(now.getTime() - days * msPerDay);
  return applied >= cutoff;
}

function translateApplicationStatus(status: string, t: TranslateFn) {
  const statusMap: Record<string, string> = {
    Applied: t('statusApplied'),
    Submitted: t('statusSubmitted'),
    Screening: t('statusScreening'),
    'Under Review': t('statusUnderReview'),
    Shortlisted: t('statusShortlisted'),
    Assessment: t('statusAssessment'),
    Interview: t('statusInterview'),
    'Final Decision': t('statusFinalDecision'),
    Selected: t('statusSelected'),
    Rejected: t('statusRejected'),
  };

  return statusMap[status] ?? status;
}

function translateInterviewStatus(status: InterviewItem['status'], t: TranslateFn) {
  const statusMap: Record<InterviewItem['status'], string> = {
    Scheduled: t('interviewScheduled'),
    Rescheduled: t('interviewRescheduled'),
    Completed: t('interviewCompleted'),
    Cancelled: t('interviewCancelled'),
  };

  return statusMap[status] ?? status;
}

function getDateFilterLabel(filter: DateFilterKey, t: TranslateFn) {
  const labelMap: Record<DateFilterKey, string> = {
    allTime: t('dateAllTime'),
    last7Days: t('dateLast7Days'),
    last30Days: t('dateLast30Days'),
    last3Months: t('dateLast3Months'),
    last6Months: t('dateLast6Months'),
    lastYear: t('dateLastYear'),
  };

  return labelMap[filter];
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

function getApplicationPipelineIndex(status: string) {
  const s = status.toLowerCase();
  if (s === 'submitted' || s === 'applied') return 0;
  if (s === 'screening' || s === 'under review') return 1;
  if (s === 'shortlisted' || s === 'assessment') return 2;
  if (s === 'interview') return 3;
  if (s === 'final decision' || s === 'selected' || s === 'rejected') return 4;
  return 0;
}

function getApplicationScoreLabel(matchScore: number | null | undefined, t: TranslateFn) {
  if (matchScore == null || matchScore <= 0) return null;
  return t('matchPercent', { score: Math.round(matchScore) });
}

function getApplicationAction(
  application: Application,
  matchingInterview: InterviewItem | undefined,
  formatInterviewDateTime: (dateString: string) => string,
  t: TranslateFn
) {
  if (matchingInterview) {
    return {
      label:
        matchingInterview.interviewType === 'online'
          ? t('actionInterviewOnline')
          : t('actionInterviewWalkIn'),
      detail: `${formatInterviewDateTime(matchingInterview.interviewDateTime)} · ${translateInterviewStatus(matchingInterview.status, t)}`,
      tone: 'bg-sky-50 text-sky-800',
    };
  }

  switch (application.status) {
    case 'Assessment':
      return {
        label: t('actionAssessment'),
        detail: t('actionAssessmentDetail'),
        tone: 'bg-orange-50 text-orange-800',
      };
    case 'Interview':
      return {
        label: t('actionInterviewPrep'),
        detail: t('actionInterviewPrepDetail'),
        tone: 'bg-emerald-50 text-emerald-800',
      };
    case 'Final Decision':
      return {
        label: t('actionFinalDecision'),
        detail: t('actionFinalDecisionDetail'),
        tone: 'bg-indigo-50 text-indigo-800',
      };
    case 'Selected':
      return {
        label: t('actionSelected'),
        detail: t('actionSelectedDetail'),
        tone: 'bg-emerald-50 text-emerald-800',
      };
    case 'Rejected':
      return {
        label: t('actionRejected'),
        detail: t('actionRejectedDetail'),
        tone: 'bg-rose-50 text-rose-800',
      };
    case 'Screening':
    case 'Under Review':
    case 'Shortlisted':
      return {
        label: t('actionReview'),
        detail: t('actionReviewDetail'),
        tone: 'bg-sky-50 text-sky-800',
      };
    default:
      return {
        label: t('actionDefault'),
        detail: t('actionDefaultDetail'),
        tone: 'bg-slate-50 text-slate-700',
      };
  }
}

function CompanyMark({ company }: { company: string }) {
  return (
    <div
      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] bg-linear-to-br ${getCompanyTheme(
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
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
            {label}
          </p>
          <p className="profile-page-value mt-1.5 font-semibold tracking-tight">
            {value}
          </p>
        </div>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
          <Icon className="h-4 w-4" strokeWidth={2.1} />
        </span>
      </div>
      <p className="profile-page-empty mt-2 leading-5">{helper}</p>
    </div>
  );
}

function SegmentedControl({
  activeSection,
  applicationCount,
  interviewCount,
  savedJobsCount,
  tabLabels,
  onChange,
}: {
  activeSection: ActiveSection;
  applicationCount: number;
  interviewCount: number;
  savedJobsCount: number;
  tabLabels: { applications: string; interviews: string; savedJobs: string };
  onChange: (section: ActiveSection) => void;
}) {
  return (
    <div className="dashboard-scrollbar inline-flex max-w-full items-center overflow-x-auto rounded-full border border-white/80 bg-white/72 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
      {([
        { key: 'applications', label: tabLabels.applications, count: applicationCount },
        { key: 'interviews', label: tabLabels.interviews, count: interviewCount },
        { key: 'savedJobs', label: tabLabels.savedJobs, count: savedJobsCount },
      ] as const).map((item) => {
        const active = activeSection === item.key;

        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key)}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[0.8125rem] font-semibold transition-all duration-200 ${
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
  options: { value: string; label: string }[];
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
          const active = option.value === activeValue;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-200 ${
                active
                  ? 'bg-[#28A8E1] text-white shadow-[0_10px_18px_rgba(40,168,225,0.16)]'
                  : 'bg-slate-100/90 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {option.label}
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
  const t = useTranslations('applicationsPage');
  const locale = useLocale() as AppLocale;
  const dateLocale = locale === 'fr' ? 'fr-FR' : 'en-US';
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [dateFilter, setDateFilter] = useState<DateFilterKey>('allTime');
  const [displayedApplicationsCount, setDisplayedApplicationsCount] = useState(6);

  const applicationsQuery = usePortalApplications(candidateId);
  const applications = (applicationsQuery.data as Application[] | undefined) ?? [];
  const loading = applicationsQuery.isLoading && applications.length === 0;
  const fetchError =
    applicationsQuery.error instanceof Error
      ? applicationsQuery.error.message
      : applicationsQuery.isError
        ? t('loadFailed')
        : null;
  const isRefreshingApplications = applicationsQuery.isFetching && applications.length > 0;

  const [candidateMissing, setCandidateMissing] = useState(false);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const cvDashboardQuery = useCvDashboard(candidateId);
  const jobsListQuery = usePortalJobsList(locale, 80);
  const backendSavedJobs = cvDashboardQuery.data?.savedJobs ?? [];
  const dashboardStats = cvDashboardQuery.data?.stats ?? null;
  const savedJobSourceJobs = useMemo(() => {
    const rawJobs = jobsListQuery.data ?? [];
    return rawJobs
      .filter((job): job is Record<string, unknown> => typeof job === 'object' && job !== null)
      .map((job, index) => mapJobRecord(job, `saved-job-${index + 1}`));
  }, [jobsListQuery.data]);
  const savedJobsLoading =
    activeSection === 'savedJobs' &&
    savedJobSourceJobs.length === 0 &&
    backendSavedJobs.length === 0 &&
    (cvDashboardQuery.isLoading || jobsListQuery.isLoading);
  const interviews = useMemo<InterviewItem[]>(() => {
    return applications
      .filter(
        (app) =>
          app.status === 'Interview' || Boolean(app.interviewScheduledAt)
      )
      .map((app) => {
        const when =
          app.interviewScheduledAt && !Number.isNaN(Date.parse(app.interviewScheduledAt))
            ? app.interviewScheduledAt
            : `${app.appliedDate}T12:00:00.000Z`;
        const joinUrl = app.interviewJoinUrl?.trim() || undefined;
        return {
          id: app.id,
          jobTitle: app.jobTitle,
          company: app.company,
          interviewDateTime: when,
          interviewType: joinUrl ? ('online' as const) : ('walk-in' as const),
          status: 'Scheduled' as const,
          joinUrl,
        };
      });
  }, [applications]);

  useEffect(() => {
    if (!candidateId || applications.length === 0) return;
    runSuggestionsEngine({ userId: candidateId, applications });
  }, [applications, candidateId]);

  useEffect(() => {
    const resolvedCandidateId =
      typeof window !== 'undefined'
        ? sessionStorage.getItem('candidateId') || localStorage.getItem('candidateId')
        : null;

    if (typeof window !== 'undefined' && resolvedCandidateId && !sessionStorage.getItem('candidateId')) {
      sessionStorage.setItem('candidateId', resolvedCandidateId);
    }

    setCandidateId(resolvedCandidateId);

    if (!resolvedCandidateId) {
      setCandidateMissing(true);
      return;
    }

    setCandidateMissing(false);
  }, []);

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
        ['Screening', 'Under Review', 'Shortlisted', 'Assessment'].includes(application.status)
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

  const dateFilterOptions = useMemo(
    () =>
      DATE_FILTER_KEYS.map((key) => ({
        value: key,
        label: getDateFilterLabel(key, t),
      })),
    [t]
  );

  const heroMetrics = useMemo(() => {
    if (activeSection === 'savedJobs') {
      return [
        {
          id: 'saved-total',
          label: t('metricSaved'),
          value: String(savedJobsSummary.total),
          helper: t('metricSavedHelper'),
          icon: BookmarkCheck,
        },
        {
          id: 'saved-strong',
          label: t('metricHighMatch'),
          value: String(savedJobsSummary.strongMatch),
          helper: t('metricHighMatchHelper'),
          icon: Sparkles,
        },
        {
          id: 'saved-remote',
          label: t('metricRemote'),
          value: String(savedJobsSummary.remote),
          helper: t('metricRemoteHelper'),
          icon: MapPin,
        },
        {
          id: 'saved-recent',
          label: t('metricFresh'),
          value: String(savedJobsSummary.recent),
          helper: t('metricFreshHelper'),
          icon: Clock3,
        },
      ];
    }

    if (activeSection === 'interviews') {
      return [
        {
          id: 'scheduled',
          label: t('metricScheduled'),
          value: String(interviewSummary.scheduled),
          helper: t('metricScheduledHelper'),
          icon: CalendarRange,
        },
        {
          id: 'online',
          label: t('metricOnline'),
          value: String(interviewSummary.online),
          helper: t('metricOnlineHelper'),
          icon: Video,
        },
        {
          id: 'completed',
          label: t('metricCompleted'),
          value: String(interviewSummary.completed),
          helper: t('metricCompletedHelper'),
          icon: CheckCircle2,
        },
        {
          id: 'total-interviews',
          label: t('metricTotal'),
          value: String(interviewSummary.total),
          helper: t('metricTotalHelper'),
          icon: Target,
        },
      ];
    }

    return [
      {
        id: 'applied',
        label: t('metricApplied'),
        value: String(applicationSummary.total),
        helper: t('metricAppliedHelper'),
        icon: BriefcaseBusiness,
      },
      {
        id: 'reviewing',
        label: t('metricReviewing'),
        value: String(applicationSummary.reviewing),
        helper: t('metricReviewingHelper'),
        icon: FileSearch,
      },
      {
        id: 'selected',
        label: t('metricSuccess'),
        value: String(applicationSummary.selected),
        helper: t('metricSuccessHelper'),
        icon: CheckCircle2,
      },
    ];
  }, [activeSection, applicationSummary, interviewSummary, savedJobsSummary, t]);

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(dateLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatInterviewDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString(dateLocale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const hasActiveFilters =
    activeSection === 'applications'
      ? searchQuery !== '' || statusFilter !== 'All' || dateFilter !== 'allTime'
      : searchQuery !== '';

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('All');
    setDateFilter('allTime');
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
    showSuccessToast(wasSaved ? t('jobRemovedFromSaved') : t('jobSaved'));
  };

  const renderApplicationCard = (application: Application) => {
    /**
     * Match by application id only. Interviews are derived from applications, so each row's
     * `id` is the source `application.id`. Matching by job title / company also pulled in
     * interviews from a *different* application at the same company, which made the "Next
     * action" pill say "interview scheduled" for an application whose real backend status was
     * still "Under Review", visibly desyncing the chip and progress bar.
     */
    const matchingInterview = interviews.find((interview) => interview.id === application.id);
    const statusMeta = getApplicationStatusMeta(application.status);
    const pipelineIndex = getApplicationPipelineIndex(application.status);
    const progressWidth = ['12%', '32%', '56%', '78%', '100%'][pipelineIndex] ?? '12%';
    const action = getApplicationAction(application, matchingInterview, formatInterviewDateTime, t);
    const statusLabel = translateApplicationStatus(application.status, t);
    const matchLabel = getApplicationScoreLabel(application.matchScore, t);

    return (
      <DashboardPanel key={application.id} className="h-full p-4 sm:p-5">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <CompanyMark company={application.company} />
              <div className="min-w-0">
                <p className="profile-page-value truncate font-semibold tracking-tight">
                  {application.jobTitle}
                </p>
                <p className="application-detail-meta mt-1 truncate">
                  {application.company}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${statusMeta.chip}`}>
                {statusLabel}
              </span>
              {matchLabel ? (
                <span className="rounded-full bg-(--brand-accent-soft) px-2.5 py-1 text-[11px] font-semibold text-(--brand-accent)">
                  {matchLabel}
                </span>
              ) : null}
            </div>
          </div>

          <div className={`rounded-[18px] px-3.5 py-3 ${action.tone}`}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] opacity-80">
              {t('nextAction')}
            </p>
            <p className="profile-page-value mt-1 font-semibold">{action.label}</p>
            <p className="mt-1 text-[12px] leading-5 opacity-80">{action.detail}</p>
          </div>

          <div className="rounded-[18px] border border-slate-100/90 bg-slate-50/85 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                {t('progress')}
              </p>
              <p className="text-[11px] font-semibold text-slate-600">
                {statusLabel}
              </p>
            </div>

            <div className="mt-2 h-1.5 rounded-full bg-white">
              <div
                className={`h-full rounded-full ${statusMeta.progress}`}
                style={{ width: progressWidth }}
              />
            </div>

            <div className="mt-3 grid grid-cols-5 gap-1">
              {PIPELINE_STEP_KEYS.map((labelKey, index) => {
                const active = pipelineIndex >= index;
                return (
                  <div key={labelKey} className="text-center">
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
                      {t(labelKey)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
              <Clock3 className="h-3 w-3" strokeWidth={2.1} />
              {t('appliedOn', { date: formatDate(application.appliedDate) })}
            </span>
            {matchingInterview ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 shadow-sm ring-1 ring-slate-100">
                <CalendarRange className="h-3 w-3" strokeWidth={2.1} />
                {translateInterviewStatus(matchingInterview.status, t)}
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
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[rgba(40,168,225,0.22)] bg-white px-3 py-2 text-[12px] font-semibold text-(--brand-primary) transition-all duration-200 hover:bg-(--brand-primary-soft)"
              >
                {t('joinInterviewShort')}
                <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
              </button>
            ) : null}

            <button
              type="button"
              onClick={() => router.push(`/applications/${application.id}`)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
            >
              {t('viewStatus')}
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
        ? t('matchPercent', { score: Math.round(job.matchScore) })
        : t('savedRole');
    const savedLabel = job.savedAt
      ? t('savedOn', { date: formatDate(job.savedAt) })
      : t('savedInList');
    const postedLabel = isRecentDate(job.postedAt, 7)
      ? t('postedRecently')
      : t('postedOn', { date: formatDate(job.postedAt) });
    const salaryLabel = formatSavedSalary(job);

    return (
      <DashboardPanel key={job.id} className="h-full p-4 sm:p-5">
        <div className="flex h-full flex-col gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <CompanyMark company={job.company} />
              <div className="min-w-0">
                <p className="profile-page-value truncate font-semibold tracking-tight">
                  {job.title}
                </p>
                <p className="application-detail-meta mt-1 truncate">{job.company}</p>
                <p className="mt-1 truncate text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {formatSavedJobMeta(job, t)}
                </p>
              </div>
            </div>

            <span className="rounded-full bg-(--brand-accent-soft) px-2.5 py-1 text-[11px] font-semibold text-(--brand-accent)">
              {matchLabel}
            </span>
          </div>

          <div className="rounded-[18px] border border-slate-100/90 bg-slate-50/85 px-3.5 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400">
              {t('whyKeepRole')}
            </p>
            <p className="profile-page-value mt-1 font-semibold">
              {job.matchScore != null && job.matchScore >= 75
                ? t('strongFitSaved')
                : t('bookmarkedSaved')}
            </p>
            <p className="mt-1 text-[12px] leading-5 text-slate-500">
              {t('savedJobDetail')}
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
              <span className="inline-flex rounded-full bg-(--brand-primary-soft) px-2.5 py-1 text-(--brand-primary)">
                {t('visaFriendly')}
              </span>
            ) : null}
          </div>

          <div className="mt-auto flex gap-2">
            <button
              type="button"
              onClick={() => handleToggleSavedJob(job.id)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-700 transition-all duration-200 hover:border-[rgba(40,168,225,0.22)] hover:bg-(--brand-primary-soft) hover:text-(--brand-primary)"
            >
              {t('removeSaved')}
              <BookmarkCheck className="h-3.5 w-3.5" strokeWidth={2.1} />
            </button>
            <button
              type="button"
              onClick={() =>
                router.push(`/explore-jobs?job=${encodeURIComponent(job.id)}`)
              }
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-3 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
            >
              {t('applyNow')}
              <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
            </button>
          </div>
        </div>
      </DashboardPanel>
    );
  };

  if (candidateMissing) {
    return (
      <div className="flex min-h-screen flex-col" style={{ background: PAGE_BG }}>
        <main className="profile-page-typography applications-page w-full grow overflow-x-hidden">
          <div className="mx-auto max-w-[1180px] px-4 py-14 sm:px-5 lg:px-6">
            <DashboardPanel className="px-6 py-10 text-center sm:px-10">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-(--brand-primary-soft) text-(--brand-primary)">
                <BriefcaseBusiness className="h-7 w-7" strokeWidth={2.2} />
              </div>
              <h1 className="application-detail-title mt-5">
                {t('signInTitle')}
              </h1>
              <p className="application-detail-helper mx-auto mt-3 max-w-2xl">
                {t('signInBody')}
              </p>
              <button
                type="button"
                onClick={() => router.push('/whatsapp/verify')}
                className="mt-8 inline-flex items-center justify-center rounded-full bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(40,168,225,0.2)] transition-all duration-200 hover:bg-[#28A8DF]"
              >
                {t('continueWhatsapp')}
              </button>
            </DashboardPanel>
          </div>
        </main>
      </div>
    );
  }

  if (loading) {
    return <GlobalLoader />;
  }

  return (
    <div className="flex min-h-screen flex-col" style={{ background: PAGE_BG }}>

      <main className="profile-page-typography applications-page w-full grow overflow-x-hidden pt-2 sm:pt-4 lg:pt-6">
        <div className="mx-auto max-w-[1180px] px-4 pt-0 pb-2 sm:px-5 sm:pb-3 lg:px-6 lg:pb-4">
          <div className="space-y-1.5">
            <DashboardPanel className="relative overflow-hidden px-4 py-1.5 sm:px-5 sm:py-2 lg:px-6 lg:py-3">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(40,168,225,0.16),transparent_34%),radial-gradient(circle_at_82%_18%,rgba(252,150,32,0.08),transparent_18%),radial-gradient(circle_at_bottom_right,rgba(40,168,223,0.1),transparent_30%)]" />

              <div className="relative flex flex-col gap-4">
                <div className="max-w-2xl space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-(--brand-primary-soft) bg-white/72 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-(--brand-primary) shadow-sm">
                    <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
                    {t('badge')}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => router.back()}
                        className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-900"
                        title={t('goBack')}
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
                      <h1 className="application-detail-title">
                        {activeSection === 'applications'
                          ? t('titleApplications')
                          : activeSection === 'interviews'
                            ? t('titleInterviews')
                            : t('titleSavedJobs')}
                      </h1>
                    </div>
                    <p className="application-detail-helper max-w-2xl">
                      {activeSection === 'applications'
                        ? t('subtitleApplications')
                        : activeSection === 'interviews'
                          ? t('subtitleInterviews')
                          : t('subtitleSavedJobs')}
                    </p>
                  </div>

                  <SegmentedControl
                    activeSection={activeSection}
                    applicationCount={applications.length}
                    interviewCount={interviews.length}
                    savedJobsCount={savedJobs.length}
                    tabLabels={{
                      applications: t('tabApplications'),
                      interviews: t('tabInterviews'),
                      savedJobs: t('tabSavedJobs'),
                    }}
                    onChange={setActiveSection}
                  />
                </div>

                <div className="-mx-1 overflow-x-auto px-1 sm:mx-0 sm:overflow-visible sm:px-0">
                  <div className="grid min-w-[38rem] grid-cols-4 gap-2 sm:min-w-0">
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
              </div>
            </DashboardPanel>

            {fetchError ? (
              <DashboardPanel className="border border-rose-100 bg-rose-50/90 px-4 py-3 text-[0.8125rem] font-medium text-rose-800">
                {fetchError}
              </DashboardPanel>
            ) : null}

            {activeSection === 'savedJobs' && featuredSavedJob ? (
              <DashboardPanel className="px-4 py-2 sm:px-5 sm:py-2">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex min-w-0 items-start gap-3">
                    <CompanyMark company={featuredSavedJob.company} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-(--brand-accent)">
                        {t('savedSpotlight')}
                      </p>
                      <h2 className="profile-page-section-title mt-1">
                        {featuredSavedJob.title}
                      </h2>
                      <p className="application-detail-meta mt-1">
                        {featuredSavedJob.company}
                      </p>
                      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                        {formatSavedJobMeta(featuredSavedJob, t)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 lg:max-w-[420px] lg:items-end">
                    <p className="rounded-full bg-(--brand-accent-soft) px-3 py-1 text-[11px] font-semibold text-(--brand-accent)">
                      {featuredSavedJob.matchScore != null && featuredSavedJob.matchScore > 0
                        ? t('matchPercent', { score: Math.round(featuredSavedJob.matchScore) })
                        : t('savedForLater')}
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(
                          `/explore-jobs?job=${encodeURIComponent(featuredSavedJob.id)}`,
                        )
                      }
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-4 py-2 text-[12px] font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                    >
                      {t('openJobsBoard')}
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
                          ? t('searchApplications')
                          : activeSection === 'interviews'
                          ? t('searchInterviews')
                          : t('searchSavedJobs')
                      }
                      className="profile-modal-field w-full rounded-[18px] border border-slate-200/80 bg-slate-50/85 py-3 pr-4 text-[0.8125rem] font-medium text-slate-900 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-[rgba(40,168,225,0.28)] focus:bg-white focus:ring-4 focus:ring-[rgba(40,168,225,0.08)]"
                      style={{ paddingLeft: '3.1rem' }}
                    />
                  </div>

                  {activeSection === 'applications' ? (
                    <div className="flex-1 space-y-3">
                      <FilterPillRow
                        label={t('timeline')}
                        options={dateFilterOptions}
                        activeValue={dateFilter}
                        onChange={(value) => setDateFilter(value as DateFilterKey)}
                      />
                    </div>
                  ) : activeSection === 'interviews' ? (
                    <div className="flex items-center gap-2 rounded-full bg-slate-100/85 px-3 py-2 text-[11px] font-semibold text-slate-500">
                      <LayoutGrid className="h-3.5 w-3.5" strokeWidth={2.2} />
                      {t('interviewsSearchHint')}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 rounded-full bg-slate-100/85 px-3 py-2 text-[11px] font-semibold text-slate-500">
                      <BookmarkCheck className="h-3.5 w-3.5" strokeWidth={2.2} />
                      {t('savedJobsSearchHint')}
                    </div>
                  )}
                </div>

                {hasActiveFilters ? (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-all duration-200 hover:border-[rgba(40,168,225,0.22)] hover:bg-(--brand-primary-soft) hover:text-(--brand-primary)"
                    >
                      {t('clearFilters')}
                      <ChevronRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                    </button>
                  </div>
                ) : null}
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
                        className="inline-flex items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-[rgba(40,168,225,0.22)] hover:bg-(--brand-primary-soft) hover:text-(--brand-primary)"
                      >
                        {t('loadMoreApplications')}
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
                  <h2 className="application-detail-title mt-5">
                    {applications.length === 0 ? t('noApplicationsYet') : t('noApplicationsFound')}
                  </h2>
                  <p className="application-detail-helper mx-auto mt-3 max-w-md">
                    {applications.length === 0
                      ? t('noApplicationsYetBody')
                      : t('noApplicationsFoundBody')}
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    {applications.length === 0 ? (
                      <button
                        type="button"
                        onClick={() => router.push('/explore-jobs')}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                      >
                        {t('exploreJobs')}
                        <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
                      </button>
                    ) : null}
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
                      >
                        {t('resetFilters')}
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
                  <h2 className="application-detail-title mt-5">
                    {savedJobs.length === 0 ? t('noSavedJobsYet') : t('noSavedJobsFound')}
                  </h2>
                  <p className="application-detail-helper mx-auto mt-3 max-w-md">
                    {savedJobs.length === 0
                      ? t('noSavedJobsYetBody')
                      : t('noSavedJobsFoundBody')}
                  </p>
                  <div className="mt-6 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => router.push('/explore-jobs')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                    >
                      {t('exploreJobs')}
                      <ArrowUpRight className="h-4 w-4" strokeWidth={2.1} />
                    </button>
                    {hasActiveFilters ? (
                      <button
                        type="button"
                        onClick={clearFilters}
                        className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition-all duration-200 hover:bg-slate-50"
                      >
                        {t('resetSearch')}
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
                            <p className="profile-page-value truncate font-semibold tracking-tight">
                              {interview.jobTitle}
                            </p>
                            <p className="application-detail-meta mt-1 truncate">
                              {interview.company}
                            </p>
                          </div>
                        </div>

                        <span
                          className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                            INTERVIEW_STATUS_META[interview.status]
                          }`}
                        >
                          {translateInterviewStatus(interview.status, t)}
                        </span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <div className="rounded-[16px] bg-slate-50/90 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {t('interviewScheduledLabel')}
                          </p>
                          <p className="profile-page-value mt-1 font-semibold">
                            {formatInterviewDateTime(interview.interviewDateTime)}
                          </p>
                        </div>
                        <div className="rounded-[16px] bg-slate-50/90 px-3 py-2.5">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                            {t('interviewFormat')}
                          </p>
                          <p className="profile-page-value mt-1 font-semibold">
                            {interview.interviewType === 'online' ? t('onlineInterview') : t('walkInInterview')}
                          </p>
                        </div>
                      </div>

                      <div className="application-detail-helper rounded-[18px] border border-slate-100/90 bg-slate-50/85 px-3.5 py-3">
                        {interview.interviewType === 'online'
                          ? t('meetingAccessOnline')
                          : t('walkInPrep')}
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
                            {t('join')}
                            <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={2.1} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-500"
                            disabled
                          >
                            {t('walkIn')}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => router.push(`/interviews/${interview.id}`)}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-semibold text-slate-700 transition-all duration-200 hover:border-[rgba(40,168,225,0.22)] hover:bg-(--brand-primary-soft) hover:text-(--brand-primary)"
                        >
                          {t('viewDetails')}
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
                <h2 className="application-detail-title mt-5">
                  {t('noInterviewsScheduled')}
                </h2>
                <p className="application-detail-helper mx-auto mt-3 max-w-md">
                  {t('noInterviewsBody')}
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/explore-jobs')}
                  className="mt-6 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-5 py-3 text-sm font-semibold text-white shadow-[0_10px_22px_rgba(40,168,225,0.18)] transition-all duration-200 hover:bg-[#28A8DF]"
                >
                  {t('exploreJobs')}
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
