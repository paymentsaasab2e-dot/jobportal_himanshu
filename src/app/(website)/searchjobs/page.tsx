'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Briefcase, Clock3, MapPin, Search, Sparkles } from 'lucide-react';
import { useLocale } from 'next-intl';
import { API_BASE_URL } from '@/lib/api-base';
import { AppLocale } from '@/lib/i18n';
import { withJobApiLocale } from '@/lib/jobApiLocale';
import { resolvePortalCompanyLogo, resolvePortalCompanyName } from '@/lib/map-portal-job';
import { redactPortalJobListing } from '@/lib/job-public-field-visibility';

/** HRYANTRA Phase 1 brand palette for this page */
const THEME = {
  cyan: '#28A8E1',
  cyanDeep: '#1A8FC4',
  cyanSoft: 'rgba(40,168,225,0.12)',
  cyanBorder: 'rgba(40,168,225,0.28)',
  orange: '#FC9620',
  orangeSoft: 'rgba(252,150,32,0.14)',
  ink: '#0F172A',
  muted: '#64748B',
  pageBg:
    'radial-gradient(ellipse 90% 60% at 10% -10%, rgba(40,168,225,0.18), transparent 55%), radial-gradient(ellipse 70% 50% at 95% 5%, rgba(252,150,32,0.12), transparent 50%), linear-gradient(180deg, #F0F9FC 0%, #F8FAFC 42%, #FFFFFF 100%)',
};

type SearchJob = {
  id: string | number;
  title: string;
  company: string;
  logo: string;
  location: string;
  salary: string;
  type: string;
  workMode: string;
  postedAtLabel: string;
  description: string;
};

function formatSalary(job: any) {
  const amount = job?.salary?.amount;
  if (amount) return String(amount);

  const min = job?.salary?.min ?? job?.salaryMin ?? null;
  const max = job?.salary?.max ?? job?.salaryMax ?? null;
  const currency = job?.salary?.currency ?? job?.salaryCurrency ?? '$';
  const currencySymbol = currency === 'USD' ? '$' : currency === 'EUR' ? 'EUR ' : currency === 'GBP' ? 'GBP ' : `${currency} `;

  if (!min && !max) return 'Salary not specified';
  if (min && max) return `${currencySymbol}${min.toLocaleString()} - ${currencySymbol}${max.toLocaleString()}`;
  if (min) return `${currencySymbol}${min.toLocaleString()}+`;
  return `${currencySymbol}${max?.toLocaleString()}`;
}

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const postedDate = typeof date === 'string' ? new Date(date) : date;
  const diffInDays = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) return 'Just now';
  if (diffInDays === 1) return '1 day ago';
  if (diffInDays < 7) return `${diffInDays} days ago`;
  if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
  return `${Math.floor(diffInDays / 30)}mo ago`;
}

function mapJob(job: any, index: number): SearchJob {
  const redacted = redactPortalJobListing(job, {
    showClientNamePublicly: job.showClientNamePublicly !== false,
    publicFieldVisibility: job.publicFieldVisibility,
  });
  const title = String(redacted.title || redacted.jobTitle || '').trim();
  const company = String(redacted.company || resolvePortalCompanyName(redacted) || '').trim();
  const location = String(redacted.location || '').trim();
  const salary =
    redacted.salaryMin != null || redacted.salaryMax != null || redacted.salary
      ? formatSalary(redacted)
      : '';
  const type = String(redacted.type || redacted.employmentType || '').trim();
  const workMode = String(redacted.workMode || redacted.jobLocationType || '').trim();
  const description = String(
    redacted.overview || redacted.aboutRole || redacted.description || '',
  ).trim();

  return {
    id: redacted.id || redacted._id || job.id || job._id || `job-${index}`,
    title,
    company,
    logo: resolvePortalCompanyLogo(redacted, ''),
    location,
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

function SearchJobsContent() {
  const locale = useLocale() as AppLocale;
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<SearchJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<SearchJob | null>(null);

  const searchQuery = searchParams.get('q')?.trim().toLowerCase() || '';
  const locationQuery = searchParams.get('location')?.trim().toLowerCase() || '';

  useEffect(() => {
    let cancelled = false;

    async function loadJobs() {
      try {
        setLoading(true);
        const response = await fetch(withJobApiLocale(`${API_BASE_URL}/jobs?limit=500`, locale), { method: 'GET' });
        const result = await response.json();
        if (!response.ok || !result?.success) {
          throw new Error(result?.message || 'Failed to load jobs');
        }

        const rawData = result?.data || [];
        const rawJobs = Array.isArray(rawData) ? rawData : (rawData.jobs || []);
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
      const hay = `${job.title} ${job.company} ${job.location} ${job.type} ${job.workMode} ${job.description}`.toLowerCase();
      const matchesQuery = !searchQuery || hay.includes(searchQuery);
      const matchesLocation = !locationQuery || job.location.toLowerCase().includes(locationQuery);
      return matchesQuery && matchesLocation;
    });
  }, [jobs, searchQuery, locationQuery]);

  return (
    <div className="min-h-screen pt-28" style={{ background: THEME.pageBg }}>
      <section className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-5 lg:px-6">
        <div
          className="overflow-hidden rounded-[32px] border bg-white/90 shadow-[0_24px_64px_-28px_rgba(26,143,196,0.28)] backdrop-blur-xl"
          style={{ borderColor: THEME.cyanBorder }}
        >
          <div
            className="h-1.5 w-full"
            style={{ background: `linear-gradient(90deg, ${THEME.cyan} 0%, ${THEME.cyanDeep} 45%, ${THEME.orange} 100%)` }}
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
              <div className="grid gap-5 py-8 md:grid-cols-2 xl:grid-cols-3">
                {filteredJobs.map((job) => (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => setSelectedJob(job)}
                    className="group flex h-full flex-col rounded-[28px] border border-slate-200/90 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-[#28A8E1] hover:shadow-[0_20px_40px_-20px_rgba(40,168,225,0.35)]"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div
                          className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border bg-slate-50"
                          style={{ borderColor: THEME.cyanBorder }}
                        >
                          {job.logo ? (
                            <img
                              src={job.logo}
                              alt={job.company}
                              className="h-full w-full object-contain bg-white"
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <Briefcase className="h-6 w-6" style={{ color: THEME.cyan }} />
                          )}
                        </div>
                        <div>
                          <h2 className="text-lg font-black leading-tight text-slate-900 transition-colors group-hover:text-[#1A8FC4]">
                            {job.title}
                          </h2>
                          <p className="mt-1 text-sm font-semibold text-slate-600">{job.company}</p>
                        </div>
                      </div>
                      <span
                        className="rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em]"
                        style={{ background: THEME.cyanSoft, color: THEME.cyanDeep }}
                      >
                        Open
                      </span>
                    </div>

                    <div className="mt-5 flex flex-wrap gap-2">
                      <span
                        className="inline-flex items-center rounded-xl border px-3 py-1.5 text-[11px] font-bold text-slate-600"
                        style={{ borderColor: THEME.cyanBorder, background: 'rgba(240,249,252,0.9)' }}
                      >
                        <MapPin className="mr-1.5 h-3.5 w-3.5" style={{ color: THEME.cyan }} /> {job.location}
                      </span>
                      <span
                        className="inline-flex items-center rounded-xl border px-3 py-1.5 text-[11px] font-bold text-slate-600"
                        style={{ borderColor: THEME.cyanBorder, background: 'rgba(240,249,252,0.9)' }}
                      >
                        <Briefcase className="mr-1.5 h-3.5 w-3.5" style={{ color: THEME.cyan }} /> {job.type}
                      </span>
                      <span
                        className="inline-flex items-center rounded-xl border px-3 py-1.5 text-[11px] font-bold text-slate-600"
                        style={{ borderColor: 'rgba(252,150,32,0.28)', background: THEME.orangeSoft }}
                      >
                        <Clock3 className="mr-1.5 h-3.5 w-3.5" style={{ color: THEME.orange }} />{' '}
                        {job.postedAtLabel}
                      </span>
                    </div>

                    <p className="mt-5 line-clamp-4 text-sm font-medium leading-6 text-slate-500">
                      {job.description}
                    </p>

                    <div className="mt-auto flex items-end justify-between pt-6">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                          Salary
                        </p>
                        <p className="mt-1 text-lg font-black" style={{ color: THEME.cyanDeep }}>
                          {job.salary}
                        </p>
                      </div>
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#28A8E1] text-white shadow-[0_8px_18px_-8px_rgba(40,168,225,0.75)] transition-all group-hover:bg-[#1A8FC4] group-hover:scale-105">
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
    <Suspense
      fallback={
        <div className="min-h-screen pt-28" style={{ background: THEME.pageBg }} />
      }
    >
      <SearchJobsContent />
    </Suspense>
  );
}
