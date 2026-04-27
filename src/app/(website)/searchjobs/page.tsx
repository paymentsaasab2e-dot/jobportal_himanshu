'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRight, Briefcase, Clock3, MapPin, Search, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-base';

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
  return {
    id: job.id || job._id || `job-${index}`,
    title: job.jobTitle || job.title || 'Untitled Job',
    company: job.company?.name || job.company?.companyName || job.client?.companyName || job.company || 'Hiring Company',
    logo: job.company?.logoUrl || job.company?.logo || job.client?.logo || job.logo || job.companyLogo || '',
    location: job.location || 'Location not specified',
    salary: formatSalary(job),
    type: job.type || job.employmentType || 'Full-time',
    workMode: job.workMode || job.jobLocationType || 'On-site',
    postedAtLabel: formatTimeAgo(job.postedDate || job.postedAt || job.createdAt || new Date()),
    description: job.overview || job.aboutRole || job.description || 'Explore this opportunity and continue with login/signup to unlock guided matching.',
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
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50">
          <Sparkles className="h-7 w-7 text-sky-600" />
        </div>
        <h2 className="text-center text-2xl font-bold text-slate-900">Login or Signup Required</h2>
        <p className="mt-3 text-center text-[15px] font-medium leading-relaxed text-slate-500">
          Continue with login/signup to unlock full details and guided matching for <span className="font-bold text-slate-700">{jobTitle}</span>.
        </p>
        <div className="mt-8 space-y-3">
          <button
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8DF] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1f97cb]"
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
  );
}

function SearchJobsContent() {
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
        const response = await fetch(`${API_BASE_URL}/jobs?limit=500`, { method: 'GET' });
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
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const hay = `${job.title} ${job.company} ${job.location} ${job.type} ${job.workMode} ${job.description}`.toLowerCase();
      const matchesQuery = !searchQuery || hay.includes(searchQuery);
      const matchesLocation = !locationQuery || job.location.toLowerCase().includes(locationQuery);
      return matchesQuery && matchesLocation;
    });
  }, [jobs, searchQuery, locationQuery]);

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#e0f2fe_0%,#ecf7fd_16%,#fafbfb_38%,#fdf6f0_68%,#fef5ed_100%)] pt-28">
      <section className="mx-auto max-w-[1180px] px-4 pb-16 sm:px-5 lg:px-6">
        <div className="rounded-[36px] border border-white/70 bg-white/80 p-8 shadow-[0_30px_80px_-30px_rgba(40,168,225,0.25)] backdrop-blur-xl">
          <div className="flex flex-col gap-4 border-b border-slate-100 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.26em] text-sky-700">Public job search</p>
              <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Search Jobs</h1>
              <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
                Browse live jobs from the database without logging in. Click any card to continue with login/signup and unlock the guided candidate flow.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm font-semibold text-slate-600">
              <div className="flex items-center gap-2"><Search className="h-4 w-4 text-sky-500 shrink-0" /><span className="text-slate-900">{searchQuery || 'All jobs'}</span></div>
              <div className="mt-1 flex items-center gap-2"><MapPin className="h-4 w-4 text-sky-500 shrink-0" /><span className="text-slate-900">{locationQuery || 'All locations'}</span></div>
            </div>
          </div>

          {loading ? (
            <div className="grid gap-5 py-10 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-72 animate-pulse rounded-[28px] border border-slate-100 bg-slate-50" />
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
                  className="group flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-1 hover:border-sky-300 hover:shadow-xl"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
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
                          <Briefcase className="h-6 w-6 text-slate-300" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg font-black leading-tight text-slate-900 transition-colors group-hover:text-sky-600">{job.title}</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-600">{job.company}</p>
                      </div>
                    </div>
                    <span className="rounded-full bg-sky-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-sky-700">
                      Open
                    </span>
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="inline-flex items-center rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                      <MapPin className="mr-1.5 h-3.5 w-3.5 text-slate-400" /> {job.location}
                    </span>
                    <span className="inline-flex items-center rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                      <Briefcase className="mr-1.5 h-3.5 w-3.5 text-slate-400" /> {job.type}
                    </span>
                    <span className="inline-flex items-center rounded-xl border border-slate-100 bg-slate-50 px-3 py-1.5 text-[11px] font-bold text-slate-600">
                      <Clock3 className="mr-1.5 h-3.5 w-3.5 text-slate-400" /> {job.postedAtLabel}
                    </span>
                  </div>

                  <p className="mt-5 line-clamp-4 text-sm font-medium leading-6 text-slate-500">{job.description}</p>

                  <div className="mt-auto flex items-end justify-between pt-6">
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Salary</p>
                      <p className="mt-1 text-lg font-black text-slate-900">{job.salary}</p>
                    </div>
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-900 text-white transition-all group-hover:bg-sky-500">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
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
    <Suspense fallback={<div className="min-h-screen bg-[linear-gradient(135deg,#e0f2fe_0%,#ecf7fd_16%,#fafbfb_38%,#fdf6f0_68%,#fef5ed_100%)] pt-28" />}>
      <SearchJobsContent />
    </Suspense>
  );
}
