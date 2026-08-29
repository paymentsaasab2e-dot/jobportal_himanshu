'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { useLocale } from 'next-intl';

import { useAuth } from '@/components/auth/AuthContext';
import { GlobalLoader } from '@/components/auth/GlobalLoader';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { getProfileDisplayFullName } from '@/components/dashboard/dashboard-utils';
import { ProfilePageShell } from '@/components/profile/layout';
import { useCvDashboard } from '@/hooks/portal/useCvDashboard';
import { usePortalJobsList, usePortalPersonalizedJobs } from '@/hooks/portal/usePortalJobs';
import { getApiBaseUrl } from '@/lib/api-base';
import { getStoredCandidateId } from '@/lib/auth-storage';
import { AppLocale, localizePath } from '@/lib/i18n';
import { formatJobTitleDisplay } from '@/lib/format-job-title';
import { dispatchProfilePhotoUpdated } from '@/lib/profile-photo';
import type { DashboardData } from '@/components/dashboard/dashboard-types';

type HomeJob = {
  id: string;
  title: string;
  company: string;
  location: string;
};

const HOME_QUOTES = [
  {
    title: 'This summer, every challenge brings you closer to winning.',
    rewards: 'iPhone • iPad • AirPods',
    cta: 'Join Now',
  },
  {
    title: 'Small steps every day build a career you are proud of.',
    rewards: 'Top jobs • Faster callbacks • Better offers',
    cta: 'Start Today',
  },
  {
    title: 'Your next opportunity is one strong application away.',
    rewards: 'Skill growth • Mentorship • Interview readiness',
    cta: 'Apply Smart',
  },
  {
    title: 'Consistency beats luck when you show up every day.',
    rewards: 'Daily progress • Better profile • More visibility',
    cta: 'Keep Going',
  },
] as const;

function mapJob(item: unknown, index: number): HomeJob | null {
  if (!item || typeof item !== 'object') return null;
  const record = item as Record<string, unknown>;
  const id = String(record.id ?? record._id ?? record.jobId ?? '').trim();
  const title = String(record.title ?? record.jobTitle ?? '').trim();
  const company = String(record.company ?? 'Top Employer').trim();
  const location = String(record.location ?? record.workMode ?? 'Remote').trim();
  if (!id || !title) return null;
  return { id: id || `job-${index + 1}`, title, company, location };
}

export default function CandidateHomePage() {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const { user, isLoading: authLoading } = useAuth();
  const candidateId = authLoading ? null : user?.id || getStoredCandidateId() || null;
  const photoInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const dashboardQuery = useCvDashboard(candidateId);
  const personalizedJobsQuery = usePortalPersonalizedJobs(candidateId, locale);
  const jobsQuery = usePortalJobsList(locale, 40);
  const dashboardData = (dashboardQuery.data || null) as DashboardData | null;

  const profileName = useMemo(() => {
    if (!dashboardData?.profile) return user?.name || 'Candidate';
    return getProfileDisplayFullName(dashboardData.profile as unknown as Record<string, unknown>);
  }, [dashboardData?.profile, user?.name]);

  const profileCompletion = dashboardData?.profile?.profileCompleteness ?? 0;
  const appliedCount =
    dashboardData?.stats?.totalApplications ?? dashboardData?.applicationCounts?.SUBMITTED ?? 0;
  const reviewingCount =
    dashboardData?.stats?.reviewing ??
    ((dashboardData?.applicationCounts?.UNDER_REVIEW ?? 0) +
      (dashboardData?.applicationCounts?.SHORTLISTED ?? 0) +
      (dashboardData?.applicationCounts?.ASSESSMENT ?? 0));
  const interviewingCount =
    dashboardData?.stats?.interviews ?? dashboardData?.applicationCounts?.INTERVIEW ?? 0;
  const offeredCount =
    dashboardData?.stats?.offersReceived ?? dashboardData?.applicationCounts?.SELECTED ?? 0;
  const profilePhotoUrl = dashboardData?.profile?.profilePhotoUrl || user?.profilePhotoUrl || null;

  const recommendedJobs = useMemo(() => {
    const personalized = (personalizedJobsQuery.data || [])
      .map((job, index) => mapJob(job, index))
      .filter(Boolean) as HomeJob[];
    if (personalized.length > 0) return personalized.slice(0, 6);

    return (jobsQuery.data || [])
      .map((job, index) => mapJob(job, index))
      .filter(Boolean)
      .slice(0, 6) as HomeJob[];
  }, [jobsQuery.data, personalizedJobsQuery.data]);

  const jobsLoading = personalizedJobsQuery.isLoading && jobsQuery.isLoading;
  const loading = authLoading || dashboardQuery.isLoading || jobsLoading;
  const activeQuote = HOME_QUOTES[quoteIndex % HOME_QUOTES.length];

  useEffect(() => {
    const timer = window.setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % HOME_QUOTES.length);
    }, 4200);
    return () => window.clearInterval(timer);
  }, []);

  const triggerPhotoUpload = () => {
    photoInputRef.current?.click();
  };

  const handlePhotoFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.currentTarget.value = '';
    if (!file || !candidateId) return;

    if (!file.type.startsWith('image/')) {
      showErrorToast('Invalid file', 'Please upload an image file.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showErrorToast('File too large', 'Profile photo must be 2MB or less.');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`${getApiBaseUrl()}/profile/photo/${candidateId}`, {
        method: 'POST',
        body: formData,
      });
      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        data?: { profilePhotoUrl?: string | null };
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Unable to upload profile photo.');
      }

      dispatchProfilePhotoUpdated(result.data?.profilePhotoUrl ?? null, getApiBaseUrl());
      await dashboardQuery.refetch();
      showSuccessToast('Profile photo updated');
    } catch (error) {
      showErrorToast(
        'Upload failed',
        error instanceof Error ? error.message : 'Unable to upload profile photo.',
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  if (loading) {
    return <GlobalLoader />;
  }

  if (!candidateId) {
    return (
      <ProfilePageShell>
        <main className="mx-auto max-w-5xl px-6 py-20">
          <div className="rounded-[28px] border border-white/70 bg-white/80 px-8 py-14 text-center shadow-[0_22px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl">
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Please sign in</h1>
            <p className="mt-3 text-slate-600">Sign in to continue.</p>
            <button
              type="button"
              onClick={() => router.push(localizePath('/whatsapp', locale))}
              className="mt-8 rounded-full bg-[#2098C8] px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_26px_rgba(32,152,200,0.35)] transition hover:-translate-y-0.5 hover:opacity-95"
            >
              Continue with WhatsApp
            </button>
          </div>
        </main>
      </ProfilePageShell>
    );
  }

  return (
    <ProfilePageShell>
      <main className="mx-auto max-w-[1240px] px-4 pb-10 pt-4 sm:px-5 lg:px-6">
        <section className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)_244px]">
          <article className="rounded-[24px] border border-white/80 bg-white/90 p-4 shadow-[0_16px_44px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/80 backdrop-blur-sm">
            <div className="text-center">
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoFileChange}
              />
              <div className="mx-auto mb-3 flex w-fit flex-col items-center">
                <div
                  className="group relative flex h-[96px] w-[96px] cursor-pointer items-center justify-center rounded-full transition duration-300 hover:scale-[1.02]"
                  style={{
                    background: `conic-gradient(#2098C8 ${Math.max(
                      6,
                      Math.min(100, profileCompletion),
                    ) * 3.6}deg, #e2e8f0 0deg)`,
                  }}
                  onClick={triggerPhotoUpload}
                  title="Click to upload profile photo"
                >
                  <div className="pointer-events-none absolute inset-0 rounded-full bg-linear-to-tr from-[#2098C8]/25 via-transparent to-transparent opacity-80 transition duration-700 group-hover:rotate-45" />
                  <div className="absolute inset-[6px] rounded-full bg-white" />
                  <div className="relative h-[72px] w-[72px] overflow-hidden rounded-full border border-[#D8E2F2] shadow-[0_0_0_0_rgba(32,152,200,0.35)] transition group-hover:shadow-[0_0_0_8px_rgba(32,152,200,0.08)]">
                    {profilePhotoUrl ? (
                      <Image
                        src={profilePhotoUrl}
                        alt={profileName}
                        width={72}
                        height={72}
                        className="h-[72px] w-[72px] object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-[#EAF7FD] text-sm font-semibold text-[#1578A7]">
                        {profileName.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  {isUploadingPhoto ? (
                    <div className="absolute inset-0 grid place-items-center rounded-full bg-white/70">
                      <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-semibold text-white">
                        Uploading...
                      </span>
                    </div>
                  ) : null}
                </div>
                <p className="mt-1 text-[24px] font-semibold leading-none text-[#F59E0B] transition duration-300 group-hover:scale-105">
                  {profileCompletion}%
                </p>
                <p className="mt-1 text-[11px] font-medium text-slate-500">Click photo to change</p>
              </div>
              <h2 className="line-clamp-2 text-[17px] font-semibold leading-tight text-slate-900">{profileName}</h2>
              <button
                type="button"
                onClick={() => router.push(localizePath('/profile', locale))}
                className="mt-5 w-full rounded-full bg-linear-to-r from-[#2098C8] to-[#1A86B3] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_14px_24px_rgba(47,98,216,0.28)] transition hover:-translate-y-0.5 hover:opacity-95"
              >
                Complete profile
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-[#D9E8FF] bg-linear-to-br from-[#F8FBFF] to-[#EEF5FF] p-3.5">
              <p className="text-xs font-semibold tracking-wide text-slate-700">Application pipeline</p>
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <p className="text-slate-500">Applied</p>
                  <p className="text-[11px] text-slate-400">Submitted roles</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#1D87BA]">{appliedCount}</p>
                </div>
                <div>
                  <p className="text-slate-500">Reviewing</p>
                  <p className="text-[11px] text-slate-400">Shortlists and tests</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#1D87BA]">{reviewingCount}</p>
                </div>
                <div>
                  <p className="text-slate-500">Interviewing</p>
                  <p className="text-[11px] text-slate-400">Live interview stages</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#1D87BA]">{interviewingCount}</p>
                </div>
                <div>
                  <p className="text-slate-500">Offered</p>
                  <p className="text-[11px] text-slate-400">Offers received</p>
                  <p className="mt-1 text-[15px] font-semibold text-[#1D87BA]">{offeredCount}</p>
                </div>
              </div>
            </div>
          </article>

          <div className="space-y-5">
            <article className="rounded-[24px] border border-[rgba(32,152,200,0.22)] bg-linear-to-r from-[#EAF7FD] via-[#E6F4FC] to-[#F2F9FF] p-5 shadow-[0_14px_32px_rgba(32,152,200,0.18)]">
              <p className="text-[33px] leading-none text-[#B9DFF2]">N</p>
              <p
                key={`quote-title-${quoteIndex}`}
                className="text-2xl font-semibold leading-tight tracking-tight text-[#0F2744] transition-opacity duration-300"
              >
                {activeQuote.title}
              </p>
              <p
                key={`quote-reward-${quoteIndex}`}
                className="mt-2 text-sm font-medium text-[#2F5F7A] transition-opacity duration-300"
              >
                {activeQuote.rewards}
              </p>
              <button
                type="button"
                className="mt-4 rounded-full bg-linear-to-r from-[#2098C8] to-[#1A86B3] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_20px_rgba(32,152,200,0.32)] transition hover:-translate-y-0.5 hover:opacity-95"
              >
                {activeQuote.cta}
              </button>
              <div className="mt-3 flex items-center gap-1.5">
                {HOME_QUOTES.map((_, idx) => (
                  <span
                    key={`quote-dot-${idx}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === quoteIndex ? 'w-5 bg-[#2098C8]' : 'w-1.5 bg-[#9FD3EA]'
                    }`}
                  />
                ))}
              </div>
            </article>

            <article className="rounded-[24px] border border-white/80 bg-white/92 p-5 shadow-[0_16px_46px_rgba(15,23,42,0.12)] ring-1 ring-slate-100/80">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-[34px] font-semibold tracking-tight text-slate-900">Recommended jobs for you</h3>
                <button
                  type="button"
                  onClick={() => router.push(localizePath('/explore-jobs', locale))}
                  className="text-sm font-semibold text-[#2098C8] transition hover:text-[#1e47b7]"
                >
                  View all
                </button>
              </div>
              <div className="mb-4 flex gap-5 border-b border-slate-100 pb-2 text-sm">
                <span className="border-b-2 border-slate-900 pb-1 font-semibold text-slate-900">
                  Recommended ({recommendedJobs.length})
                </span>
                <span className="pb-1 text-slate-500">You might like (22)</span>
              </div>
              <div className="space-y-2.5">
                {recommendedJobs.length === 0 ? (
                  <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">
                    Recommendations will appear after your profile sync completes.
                  </p>
                ) : (
                  recommendedJobs.map((job) => (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() =>
                        router.push(
                          `${localizePath('/explore-jobs', locale)}?job=${encodeURIComponent(job.id)}`,
                        )
                      }
                      className="flex w-full items-start justify-between rounded-2xl border border-slate-200/90 bg-white p-3.5 text-left transition hover:-translate-y-0.5 hover:border-[#2098C8]/45 hover:bg-[#F8FCFF] hover:shadow-[0_10px_24px_rgba(32,152,200,0.14)]"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{formatJobTitleDisplay(job.title)}</p>
                        <p className="mt-1 text-xs text-slate-600">
                          {job.company} - {job.location}
                        </p>
                      </div>
                      <span className="rounded-full bg-[#EAF2FF] px-3 py-1 text-xs font-semibold text-[#2098C8]">
                        Apply
                      </span>
                    </button>
                  ))
                )}
              </div>
            </article>
          </div>

          <aside>
            <article className="overflow-hidden rounded-[20px] border border-white/80 bg-white/92 shadow-[0_12px_30px_rgba(15,23,42,0.1)] ring-1 ring-slate-100/80">
              <div className="h-20 bg-linear-to-r from-[#152238] to-[#1E2A44] p-3 text-[11px] font-semibold text-white">
                Top fintech companies for freshers
              </div>
              <div className="p-4">
                <h3 className="text-[30px] font-semibold leading-[1.12] tracking-tight text-slate-900">
                  Best Fintech Companies for Freshers to Work at in India
                </h3>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">
                  India is one of the fastest-growing fintech markets with thousands of startups and
                  opportunities.
                </p>
                <button
                  type="button"
                  onClick={() => router.push(localizePath('/explore-jobs', locale))}
                  className="mt-3 text-sm font-semibold text-[#2098C8] transition hover:text-[#1e47b7]"
                >
                  Read more
                </button>
              </div>
            </article>
          </aside>
        </section>
      </main>
    </ProfilePageShell>
  );
}
