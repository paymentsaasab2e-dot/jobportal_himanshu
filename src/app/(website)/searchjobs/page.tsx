'use client';

import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Briefcase, Clock3, MapPin, Search, Sparkles, Wifi } from 'lucide-react';
import { useLocale } from 'next-intl';
import { API_BASE_URL } from '@/lib/api-base';
import { AppLocale } from '@/lib/i18n';
import { formatJobTitleDisplay } from '@/lib/format-job-title';
import { withJobApiLocale } from '@/lib/jobApiLocale';
import { resolvePortalCompanyLogo } from '@/lib/map-portal-job';
import { redactPortalJobListing } from '@/lib/job-public-field-visibility';
import { toPlainJobText } from '@/lib/job-description';
import {
  extractJobCountry,
  isCongoRegionLabel,
  jobMatchesCountry,
} from '@/lib/job-location-filters';

/** HRYANTRA Phase 1 brand palette for this page */
const THEME = {
  cyan: '#2098C8',
  cyanDeep: '#1A8FC4',
  cyanSoft: 'rgba(32,152,200,0.12)',
  cyanBorder: 'rgba(32,152,200,0.28)',
  orange: '#2098C8',
  orangeSoft: 'rgba(252,150,32,0.14)',
  ink: '#0F172A',
  muted: '#64748B',
  pageBg:
    'radial-gradient(ellipse 90% 60% at 10% -10%, rgba(32,152,200,0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 95% 5%, rgba(252,150,32,0.12), transparent 50%), linear-gradient(180deg, #F0F9FC 0%, #F8FAFC 42%, #FFFFFF 100%)',
};

type SearchJob = {
  id: string | number;
  title: string;
  company: string;
  logo: string;
  location: string;
  country: string;
  industry: string;
  department: string;
  salary: string;
  type: string;
  workMode: string;
  postedAtLabel: string;
  description: string;
};

function asText(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

function formatEmploymentType(raw: string): string {
  if (!raw) return '';
  return raw
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function formatWorkMode(raw: string): string {
  if (!raw) return '';
  const key = raw.toLowerCase().replace(/[_-]+/g, ' ').trim();
  if (key.includes('remote')) return 'Remote';
  if (key.includes('hybrid')) return 'Hybrid';
  if (key.includes('onsite') || key.includes('on site') || key.includes('office')) return 'On-site';
  return formatEmploymentType(raw);
}

function formatCurrencySymbol(currency: unknown): string {
  const cur = asText(currency);
  if (!cur) return '$';
  const u = cur.toUpperCase();
  if (u === 'USD' || cur === '$') return '$';
  if (u === 'EUR' || cur === '€') return '€';
  if (u === 'GBP' || cur === '£') return '£';
  if (u === 'INR' || /₹|rupee/i.test(cur)) return '₹';
  if (cur.length <= 4) return cur;
  return '';
}

function formatSalary(job: Record<string, unknown>): string {
  const salaryObj =
    job.salary && typeof job.salary === 'object' && !Array.isArray(job.salary)
      ? (job.salary as Record<string, unknown>)
      : null;

  const amount = asText(salaryObj?.amount);
  if (amount) return amount;

  let min = toFiniteNumber(salaryObj?.min ?? job.salaryMin);
  let max = toFiniteNumber(salaryObj?.max ?? job.salaryMax);
  if (min != null && max != null && min > max) {
    const swap = min;
    min = max;
    max = swap;
  }

  const currencyRaw = salaryObj?.currency ?? job.salaryCurrency ?? 'USD';
  const symbol = formatCurrencySymbol(currencyRaw);
  const suffix = !symbol && asText(currencyRaw) ? ` ${asText(currencyRaw)}` : '';

  if (min == null && max == null) return '';
  if (min != null && max != null) {
    return `${symbol}${min.toLocaleString()} – ${symbol}${max.toLocaleString()}${suffix}`.trim();
  }
  if (min != null) return `${symbol}${min.toLocaleString()}+${suffix}`.trim();
  return `${symbol}${max!.toLocaleString()}${suffix}`.trim();
}

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const postedDate = typeof date === 'string' ? new Date(date) : date;
  if (Number.isNaN(postedDate.getTime())) return '';
  const diffInDays = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) return 'Just now';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  return `${Math.floor(diffInDays / 30)}mo ago`;
}

function normalizeCompareText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** True when text is empty, tiny, or basically just the job title. */
function isWeakJobBlurb(text: string, title: string): boolean {
  const plain = toPlainJobText(text).trim();
  if (!plain) return true;
  if (plain.length < 24) return true;
  const normPlain = normalizeCompareText(plain);
  const normTitle = normalizeCompareText(title);
  if (!normTitle) return plain.length < 40;
  if (normPlain === normTitle) return true;
  if (normPlain === `${normTitle}.` || normPlain.startsWith(`${normTitle} `) && normPlain.length < normTitle.length + 12) {
    return true;
  }
  // "The HR Manager will..." can be fine — only reject near-exact title echoes.
  const words = normPlain.split(' ').filter(Boolean);
  if (words.length <= 3 && normPlain.includes(normTitle)) return true;
  return false;
}

function pickBestBlurb(candidates: unknown[], title: string): string {
  let best = '';
  for (const raw of candidates) {
    const plain = toPlainJobText(asText(raw)).trim();
    if (!plain || isWeakJobBlurb(plain, title)) continue;
    if (plain.length > best.length) best = plain;
  }
  return best;
}

function buildDescription(job: Record<string, unknown>): string {
  const title = asText(job.title || job.jobTitle);

  const fromNarrative = pickBestBlurb(
    [
      job.description,
      job.jobDescription,
      job.jobDescriptionHtml,
      job.overview,
      job.aboutRole,
      job.jobSummary,
      job.responsibilities,
    ],
    title,
  );
  if (fromNarrative) return fromNarrative;

  if (Array.isArray(job.keyResponsibilities) && job.keyResponsibilities.length) {
    const joined = job.keyResponsibilities
      .map((item) => toPlainJobText(String(item)))
      .filter(Boolean)
      .slice(0, 3)
      .join(' · ');
    if (!isWeakJobBlurb(joined, title)) return joined;
  }

  if (Array.isArray(job.requirements) && job.requirements.length) {
    const joined = job.requirements
      .map((item) => toPlainJobText(String(item)))
      .filter(Boolean)
      .slice(0, 2)
      .join(' · ');
    if (!isWeakJobBlurb(joined, title)) return joined;
  }

  if (Array.isArray(job.skills) && job.skills.length) {
    const skills = job.skills.map((s) => asText(s)).filter(Boolean).slice(0, 6);
    if (skills.length) return `Key skills: ${skills.join(', ')}.`;
  }

  return title
    ? `Open the ${title} role to view full details and apply.`
    : 'Open this role to view full details.';
}

function buildLocation(job: Record<string, unknown>): string {
  const direct = asText(job.location);
  if (direct) return direct;
  const parts = [asText(job.city), asText(job.state), asText(job.country)].filter(Boolean);
  return parts.join(', ');
}

function mapJob(job: any, index: number): SearchJob {
  const redacted = redactPortalJobListing(job, {
    showClientNamePublicly: job.showClientNamePublicly !== false,
    publicFieldVisibility: job.publicFieldVisibility,
  }) as Record<string, unknown>;

  const title = asText(redacted.title || redacted.jobTitle);
  const company = asText(redacted.company);
  const location = buildLocation(redacted);
  const country = asText(redacted.country);
  const industry = [
    asText(redacted.industry),
    asText(redacted.jobCategory),
    asText(redacted.industryType),
  ]
    .filter(Boolean)
    .join(' ');
  const department = [
    asText(redacted.department),
    asText(redacted.departmentName),
    asText(redacted.jobDepartment),
  ]
    .filter(Boolean)
    .join(' ');
  const salary = formatSalary(redacted);
  const type = formatEmploymentType(asText(redacted.type || redacted.employmentType));
  const workMode = formatWorkMode(asText(redacted.workMode || redacted.jobLocationType));
  const description = buildDescription(redacted);
  const logoRaw = resolvePortalCompanyLogo(redacted, '');
  const logo =
    company && logoRaw && logoRaw !== '/perosn_icon.png' && !logoRaw.includes('perosn_icon')
      ? logoRaw
      : '';

  return {
    id: (redacted.id as string) || (redacted._id as string) || job.id || job._id || `job-${index}`,
    title: title || 'Untitled role',
    company,
    logo,
    location,
    country,
    industry,
    department,
    salary,
    type,
    workMode,
    postedAtLabel: formatTimeAgo(job.postedDate || job.postedAt || job.createdAt || new Date()),
    description,
  };
}

function SearchJobsAuthModal({
  isOpen,
  onClose,
  jobTitle,
}: {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
}) {
  const router = useRouter();

  if (!isOpen) return null;

  const handleContinue = () => {
    sessionStorage.setItem('postLoginRedirect', '/whatsapp');
    router.push('/whatsapp');
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_28px_80px_-24px_rgba(15,23,42,0.45)]">
        <div
          className="h-1.5 w-full"
          style={{ background: `linear-gradient(90deg, ${THEME.cyan}, ${THEME.orange})` }}
        />
        <div className="p-8">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
            style={{ background: THEME.cyanSoft, color: THEME.cyanDeep }}
          >
            <Sparkles className="h-7 w-7" />
          </div>
          <h2 className="text-center text-2xl font-bold text-slate-900">Login or Signup Required</h2>
          <p className="mt-3 text-center text-[15px] font-medium leading-relaxed text-slate-500">
            Continue with login/signup to unlock full details and guided matching for{' '}
            <span className="font-bold text-slate-700">{jobTitle}</span>.
          </p>
          <div className="mt-8 space-y-3">
            <button
              onClick={handleContinue}
              className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:brightness-95"
              style={{ background: THEME.cyan }}
            >
              Continue to Login/Signup
              <ArrowRight className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-[15px] font-semibold text-slate-600 transition-all hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaChip({
  icon,
  label,
  tone = 'cyan',
  className = '',
}: {
  icon: ReactNode;
  label: string;
  tone?: 'cyan' | 'orange';
  className?: string;
}) {
  if (!label) return null;
  return (
    <span
      className={`inline-flex min-w-0 max-w-full items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold text-slate-600 ${className}`}
      style={{
        borderColor: tone === 'orange' ? 'rgba(252,150,32,0.28)' : THEME.cyanBorder,
        background: tone === 'orange' ? THEME.orangeSoft : 'rgba(240,249,252,0.9)',
      }}
    >
      <span className="mr-1.5 shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </span>
  );
}

function SearchJobsContent() {
  const locale = useLocale() as AppLocale;
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<SearchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<SearchJob | null>(null);

  const searchQuery = searchParams.get('q')?.trim().toLowerCase() || '';
  const locationQuery = searchParams.get('location')?.trim().toLowerCase() || '';
  const industryQuery = searchParams.get('industry')?.trim().toLowerCase() || '';
  const departmentQuery = searchParams.get('department')?.trim().toLowerCase() || '';

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      try {
        setLoading(true);
        const response = await fetch(withJobApiLocale(`${API_BASE_URL}/jobs?limit=500`, locale), {
          method: 'GET',
        });
        const result = await response.json();
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to load jobs');
        }

        const rawData = result?.data || [];
        const rawJobs = Array.isArray(rawData) ? rawData : rawData.jobs || [];
        if (!cancelled) {
          setJobs(rawJobs.map(mapJob));
        }
      } catch (error) {
        console.error('Failed to load public search jobs:', error);
        if (!cancelled) setJobs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadJobs();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const hay = `${job.title} ${job.company} ${job.location} ${job.country} ${job.industry} ${job.department} ${job.type} ${job.workMode} ${job.description}`.toLowerCase();
      const matchesQuery = !searchQuery || hay.includes(searchQuery);
      const matchesLocation =
        !locationQuery ||
        job.location.toLowerCase().includes(locationQuery) ||
        job.country.toLowerCase().includes(locationQuery) ||
        jobMatchesCountry(
          { location: job.location, country: job.country },
          locationQuery,
        ) ||
        (isCongoRegionLabel(locationQuery) &&
          isCongoRegionLabel(extractJobCountry(job)));
      const matchesIndustry =
        !industryQuery || job.industry.toLowerCase().includes(industryQuery);
      const matchesDepartment =
        !departmentQuery || job.department.toLowerCase().includes(departmentQuery);
      return matchesQuery && matchesLocation && matchesIndustry && matchesDepartment;
    });
  }, [jobs, searchQuery, locationQuery, industryQuery, departmentQuery]);

  return (
    <div className="min-h-screen pt-28" style={{ background: THEME.pageBg }}>
      <section className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-5 lg:px-6">
        <div
          className="overflow-hidden rounded-[32px] border bg-white/90 shadow-[0_24px_64px_-28px_rgba(26,143,196,0.28)] backdrop-blur-xl"
          style={{ borderColor: THEME.cyanBorder }}
        >
          <div
            className="h-1.5 w-full"
            style={{
              background: `linear-gradient(90deg, ${THEME.cyan} 0%, ${THEME.cyanDeep} 45%, ${THEME.orange} 100%)`,
            }}
          />

          <div className="p-8">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p
                  className="text-[11px] font-black uppercase tracking-[0.26em]"
                  style={{ color: THEME.cyanDeep }}
                >
                  Public job search
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                  Search Jobs
                </h1>
                <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
                  Browse live jobs from the database without logging in. Click any card to continue
                  with login/signup and unlock the guided candidate flow.
                </p>
              </div>
              <div
                className="rounded-2xl border px-5 py-4 text-sm font-semibold"
                style={{
                  borderColor: THEME.cyanBorder,
                  background: THEME.cyanSoft,
                  color: THEME.muted,
                }}
              >
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 shrink-0" style={{ color: THEME.cyan }} />
                  <span className="text-slate-900">{searchQuery || 'All jobs'}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" style={{ color: THEME.orange }} />
                  <span className="text-slate-900">{locationQuery || 'All locations'}</span>
                </div>
              </div>
            </div>

            {loading ? (
              <div className="grid gap-5 py-10 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-72 animate-pulse rounded-[28px] border bg-slate-50"
                    style={{ borderColor: THEME.cyanBorder }}
                  />
                ))}
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="py-16 text-center">
                <h2 className="text-2xl font-bold text-slate-900">No jobs found</h2>
                <p className="mt-3 text-slate-500">Try another title or location in the homepage search.</p>
              </div>
            ) : (
              <div className="grid auto-rows-fr gap-5 py-8 md:grid-cols-2 xl:grid-cols-3">
                {filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="group grid h-full grid-rows-[auto_auto_1fr_auto] gap-4 rounded-[24px] border border-slate-200/90 bg-white p-5 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#2098C8] hover:shadow-[0_20px_40px_-20px_rgba(32,152,200,0.35)]"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-slate-50"
                        style={{ borderColor: THEME.cyanBorder }}
                      >
                        {job.logo ? (
                          <img
                            src={job.logo}
                            alt={formatJobTitleDisplay(job.title)}
                            className="h-full w-full object-contain bg-white"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <Briefcase className="h-5 w-5" style={{ color: THEME.cyan }} />
                        )}
                      </div>
                      <h2 className="min-w-0 flex-1 line-clamp-2 text-base font-black leading-snug text-slate-900 transition-colors group-hover:text-[#1A8FC4]">
                        {formatJobTitleDisplay(job.title)}
                      </h2>
                      <span
                        className="shrink-0 self-start rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em]"
                        style={{ background: THEME.cyanSoft, color: THEME.cyanDeep }}
                      >
                        Open
                      </span>
                    </div>

                    <div className="space-y-2.5">
                      {job.location ? (
                        <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-slate-500">
                          <MapPin className="h-3.5 w-3.5 shrink-0" style={{ color: THEME.cyan }} />
                          <span className="truncate">{job.location}</span>
                        </p>
                      ) : null}
                      <div className="flex flex-wrap items-center gap-1.5">
                        <MetaChip
                          icon={<Briefcase className="h-3.5 w-3.5" style={{ color: THEME.cyan }} />}
                          label={job.type}
                          className="shrink-0"
                        />
                        <MetaChip
                          icon={<Wifi className="h-3.5 w-3.5" style={{ color: THEME.cyan }} />}
                          label={job.workMode}
                          className="shrink-0"
                        />
                        <MetaChip
                          icon={<Clock3 className="h-3.5 w-3.5" style={{ color: THEME.orange }} />}
                          label={job.postedAtLabel}
                          tone="orange"
                          className="shrink-0"
                        />
                      </div>
                    </div>

                    <p className="line-clamp-3 min-h-[4.5rem] text-sm font-medium leading-6 text-slate-500">
                      {job.description}
                    </p>

                    <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Salary
                        </p>
                        <p
                          className="mt-0.5 truncate text-base font-black"
                          style={{ color: THEME.cyanDeep }}
                        >
                          {job.salary || 'Not specified'}
                        </p>
                      </div>
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2098C8] text-white shadow-[0_8px_18px_-8px_rgba(32,152,200,0.75)] transition-all group-hover:scale-105 group-hover:bg-[#1A8FC4]">
                        <ArrowRight className="h-4 w-4" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <SearchJobsAuthModal
        isOpen={Boolean(selectedJob)}
        onClose={() => setSelectedJob(null)}
        jobTitle={selectedJob?.title || 'this job'}
      />
    </div>
  );
}

export default function SearchJobsPage() {
  return (
    <Suspense fallback={<div className="min-h-screen pt-28" style={{ background: THEME.pageBg }} />}>
      <SearchJobsContent />
    </Suspense>
  );
}
