"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/components/auth/AuthContext";
import { BookMarked, BriefcaseBusiness, Gauge, Target } from "lucide-react";
import { GlobalLoader } from "@/components/auth/GlobalLoader";
import ApplicationSuccessModal from "@/components/modals/ApplicationSuccessModal";
import ProfileCompletionDrawer from "@/components/profile/ProfileCompletionDrawer";
import { showSuccessToast } from "@/components/common/toast/toast";
import ApplicationPipelineCard from "@/components/dashboard/ApplicationPipelineCard";
import DashboardHero, { type DashboardHeroStat } from "@/components/dashboard/DashboardHero";
import JobMatchesPanel from "@/components/dashboard/JobMatchesPanel";
import ProfileOverviewCard from "@/components/dashboard/ProfileOverviewCard";
import { PendingEarnCard } from "@/components/dashboard/PendingEarnCard";
import { dispatchTokenEarn } from "@/lib/token-earn-events";
import { recordCandidateNotification, notifyBellRefresh } from "@/lib/notifications";
import RecommendedCoursesPanel from "@/components/dashboard/RecommendedCoursesPanel";
import {
  collectProfileSkillNames,
  getDashboardName,
  getDynamicGreeting,
  rankUploadedCoursesForProfile,
  type UploadedLmsCourse,
} from "@/components/dashboard/dashboard-utils";
import { fetchCourses } from "@/app/lms/api/client";
import { fetchPublicCourses } from "@/lib/public-courses-api";
import { resolvePortalCompanyLogo, isClientNamePubliclyVisible } from "@/lib/map-portal-job";
import { redactPortalJobListing } from "@/lib/job-public-field-visibility";
import type {
  DashboardData,
  DashboardJob,
  JobFilterKey,
} from "@/components/dashboard/dashboard-types";
import {
  API_BASE_URL,
  fetchProfileCompleteness,
  syncProfileToCommonDatabase,
  type ProfileCompletenessResponse,
} from "@/lib/profile-completion";
import { getAuthHeaders, getStoredCandidateId, syncAuthStorage } from "@/lib/auth-storage";
import { useCvDashboard, useInvalidateCvDashboard } from "@/hooks/portal/useCvDashboard";
import { usePortalJobsList, usePortalPersonalizedJobs } from "@/hooks/portal/usePortalJobs";
import { clearPendingJobApply, readPendingJobApply } from "@/lib/job-apply-flow";
import { useTabVisibilityRefresh } from "@/hooks/useTabVisibilityRefresh";
import { dispatchProfilePhotoUpdated } from "@/lib/profile-photo";
import { AppLocale, localizePath } from "@/lib/i18n";
import {
  localizeDisplayText,
  localizeLocationText,
  localizeSkillName,
} from "@/lib/displayContentLocale";
import { ProfilePageShell } from "@/components/profile/layout";
import { getMissingProfileSections } from "@/lib/profile-section-routes";
import { useTokensOptional } from "@/components/tokens/TokensContext";
import { useQueryClient } from "@tanstack/react-query";
import { portalQueryKeys } from "@/lib/query/portal-query-keys";
import {
  isDashboardSessionCacheFresh,
  readDashboardSessionCache,
  writeDashboardSessionCache,
} from "@/lib/dashboard-session-cache";

const SAVED_JOBS_STORAGE_PREFIX = "dashboardSavedJobs";

function asString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function asNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
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

function getDateLocale(locale: AppLocale) {
  return locale === "fr" ? "fr-FR" : "en-GB";
}

function formatAppliedDate(locale: AppLocale, value?: string | null) {
  const date = value ? new Date(value) : new Date();
  if (Number.isNaN(date.getTime())) return new Date().toLocaleDateString(getDateLocale(locale));
  return date.toLocaleDateString(getDateLocale(locale));
}

function asUploadedCourses(value: unknown): UploadedLmsCourse[] {
  if (Array.isArray(value)) return value as UploadedLmsCourse[];
  if (value && typeof value === "object") {
    const rows = (value as { courses?: unknown }).courses;
    if (Array.isArray(rows)) return rows as UploadedLmsCourse[];
  }
  return [];
}

function mapJobRecord(job: Record<string, unknown>, fallbackId: string): DashboardJob {
  const redacted = redactPortalJobListing(job, {
    showClientNamePublicly: job.showClientNamePublicly !== false,
    publicFieldVisibility:
      job.publicFieldVisibility && typeof job.publicFieldVisibility === "object"
        ? (job.publicFieldVisibility as Record<string, boolean>)
        : null,
  });

  return {
    id: asString(redacted.id) ?? asString(redacted._id) ?? asString(job.id) ?? asString(job._id) ?? fallbackId,
    title: asString(redacted.title) ?? asString(redacted.jobTitle) ?? "",
    company: String(redacted.company || ''),
    companyLogo: isClientNamePubliclyVisible(redacted)
      ? resolvePortalCompanyLogo(redacted, '')
      : '',
    location: asNullableString(redacted.location),
    salaryMin:
      asNullableNumber(redacted.salaryMin) ??
      asNullableNumber((redacted.salary as { min?: unknown } | undefined)?.min),
    salaryMax:
      asNullableNumber(redacted.salaryMax) ??
      asNullableNumber((redacted.salary as { max?: unknown } | undefined)?.max),
    salaryCurrency:
      asString(redacted.salaryCurrency) ??
      asString((redacted.salary as { currency?: unknown } | undefined)?.currency) ??
      "USD",
    salaryAmount:
      asString((redacted.salary as { amount?: unknown } | undefined)?.amount) ?? null,
    experienceLevel:
      asString(redacted.experienceRequired) ??
      asString(redacted.experienceLevel) ??
      asString(redacted.experience) ??
      null,
    employmentType:
      asString(redacted.type) ?? asString(redacted.employmentType) ?? undefined,
    workMode: asString(redacted.workMode) ?? undefined,
    visaSponsorship:
      typeof job.visaSponsorship === "boolean" ? job.visaSponsorship : false,
    postedAt:
      asString(job.postedAt) ??
      asString(job.postedDate) ??
      new Date().toISOString(),
    matchScore:
      asNullableNumber(job.matchScore) ??
      asNullableNumber(job.normalizedScore) ??
      null,
  };
}

export default function CandidateDashboardPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const t = useTranslations();
  const tGreeting = useTranslations("candidateDashboard.greeting");
  const tCourses = useTranslations("candidateDashboard.courses");
  const tProfileSections = useTranslations("candidateDashboard.profileSections");
  const jobMatchesRef = useRef<HTMLDivElement>(null);
  const matchesHighlightTimeoutRef = useRef<number | null>(null);
  const matchesArrivalTimeoutRef = useRef<number | null>(null);
  const pendingApplyInFlightRef = useRef<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const dashboardQuery = useCvDashboard(candidateId);
  const invalidateCvDashboard = useInvalidateCvDashboard();
  const dashboardData = dashboardQuery.data ?? null;
  const loading = dashboardQuery.isLoading && !dashboardData;
  const tokensCtx = useTokensOptional();
  const welcomeToastShownRef = useRef(false);
  const generalJobsQuery = usePortalJobsList(locale);
  const personalizedJobsQuery = usePortalPersonalizedJobs(candidateId, locale);
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [uploadedCourses, setUploadedCourses] = useState<UploadedLmsCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);

  const [isMatchesBadgeHighlighted, setIsMatchesBadgeHighlighted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<JobFilterKey[]>([
    "highestMatch",
  ]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isDeletingPhoto, setIsDeletingPhoto] = useState(false);
  const [pendingApplyBanner, setPendingApplyBanner] = useState<{
    tone: "success" | "info" | "error";
    title: string;
    description: string;
  } | null>(null);
  const [submittedApplicationModal, setSubmittedApplicationModal] = useState<{
    jobTitle: string;
    company: string;
    appliedDate: string;
    applicationId?: string;
  } | null>(null);
  const [profileCompletionDetails, setProfileCompletionDetails] =
    useState<ProfileCompletenessResponse | null>(null);
  const [profileSnapshot, setProfileSnapshot] = useState<Record<string, unknown> | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      syncAuthStorage();
      const idFromUser = user?.id || null;
      const idFromStorage = getStoredCandidateId();
      setCandidateId(idFromUser || idFromStorage);
    }
  }, [authLoading, isAuthenticated, user]);

  // Paint dashboard from session cache immediately (Events-style)
  useEffect(() => {
    if (!candidateId) return;
    const cached = readDashboardSessionCache(candidateId);
    if (!cached?.dashboard) return;
    queryClient.setQueryData(portalQueryKeys.cvDashboard(candidateId), cached.dashboard);
    if (cached.completeness) setProfileCompletionDetails(cached.completeness);
    if (cached.snapshot) setProfileSnapshot(cached.snapshot);
  }, [candidateId, queryClient]);

  // Persist successful loads into session cache
  useEffect(() => {
    if (!candidateId || !dashboardData) return;
    writeDashboardSessionCache({
      candidateId,
      dashboard: dashboardData,
      completeness: profileCompletionDetails,
      snapshot: profileSnapshot,
    });
  }, [candidateId, dashboardData, profileCompletionDetails, profileSnapshot]);

  useEffect(() => {
    if (!dashboardData?.stats) return;
    const bal = dashboardData.stats.tokenBalance;
    if (typeof bal === 'number') {
      tokensCtx?.setBalance(bal);
    }
    if (
      dashboardData.stats.welcomeTokensGranted &&
      !welcomeToastShownRef.current &&
      dashboardData.stats.welcomeTokenAmount
    ) {
      welcomeToastShownRef.current = true;
      dispatchTokenEarn({
        amount: dashboardData.stats.welcomeTokenAmount,
        title: 'Welcome bonus unlocked',
        subtitle: 'Thanks for joining — keep earning by completing your profile.',
        tokenBalance: typeof bal === 'number' ? bal : undefined,
      });
    }
  }, [dashboardData?.stats, tokensCtx]);

  // After dashboard syncs lifecycle earns, reload claimed keys once per candidate session.
  useEffect(() => {
    if (!candidateId || !dashboardData?.stats) return;
    const key = `saasa:earn-lifecycle-refreshed:${candidateId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    void tokensCtx?.refresh?.();
  }, [candidateId, dashboardData?.stats, tokensCtx]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setCoursesLoading(true);
      try {
        let rows: UploadedLmsCourse[] = [];
        try {
          rows = asUploadedCourses(await fetchCourses());
        } catch {
          rows = [];
        }
        if (!rows.length) {
          const publicRows = await fetchPublicCourses().catch(() => []);
          rows = publicRows.map((row) => ({
            id: row.id,
            title: row.title,
            description: row.description,
            category: row.category,
            level: row.level || row.skillLevel,
            thumbnailUrl: row.thumbnailUrl,
            instructorName: row.instructorName,
            estimatedHours: row.estimatedHours,
            duration: row.duration,
            tags: row.tags,
          }));
        }
        if (!cancelled) setUploadedCourses(rows);
      } catch {
        if (!cancelled) setUploadedCourses([]);
      } finally {
        if (!cancelled) setCoursesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [candidateId, isAuthenticated]);

  useEffect(() => {
    return () => {
      if (matchesHighlightTimeoutRef.current != null) {
        window.clearTimeout(matchesHighlightTimeoutRef.current);
      }
      if (matchesArrivalTimeoutRef.current != null) {
        window.clearTimeout(matchesArrivalTimeoutRef.current);
      }
    };
  }, []);

  const triggerMatchesBadgeHighlight = useCallback(() => {
    if (matchesHighlightTimeoutRef.current != null) {
      window.clearTimeout(matchesHighlightTimeoutRef.current);
    }

    setIsMatchesBadgeHighlighted(true);
    matchesHighlightTimeoutRef.current = window.setTimeout(() => {
      setIsMatchesBadgeHighlighted(false);
      matchesHighlightTimeoutRef.current = null;
    }, 1800);
  }, []);

  const refreshProfileSnapshot = useCallback(
    async (id?: string, signal?: AbortSignal) => {
      const resolvedCandidateId = id || candidateId || user?.id;
      if (!resolvedCandidateId) return null;

      try {
        const base = String(API_BASE_URL || '').replace(/\/$/, '');
        const response = await fetch(`${base}/profile/${resolvedCandidateId}`, {
          method: "GET",
          headers: getAuthHeaders(),
          signal,
        });
        const result = (await response.json()) as {
          success?: boolean;
          data?: Record<string, unknown>;
        };
        if (response.ok && result.success && result.data) {
          setProfileSnapshot(result.data);
          return result.data;
        }
      } catch (error) {
        // Abort / offline / backend restart — keep cached UI, don't throw to Next overlay
        if (error instanceof DOMException && error.name === 'AbortError') return null;
        if (error instanceof TypeError) return null;
        console.warn("Profile snapshot soft-refresh skipped:", error);
      }
      return null;
    },
    [candidateId, user?.id],
  );

  const refreshProfileCompleteness = useCallback(
    async (id?: string) => {
      const resolvedCandidateId =
        id || candidateId || user?.id;
 
      if (!resolvedCandidateId) return null;

      try {
        const details = await fetchProfileCompleteness(resolvedCandidateId);
        setProfileCompletionDetails(details);
        const earns = (details as {
          tokenEarns?: Array<{ amount?: number; earnKey?: string }>;
          tokenBalance?: number;
        })?.tokenEarns;
        if (Array.isArray(earns) && earns.length > 0) {
          const total = earns.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
          if (total > 0) {
            dispatchTokenEarn({
              amount: total,
              title: 'Profile rewards unlocked',
              subtitle: 'You completed profile sections and earned tokens automatically.',
              tokenBalance: (details as { tokenBalance?: number }).tokenBalance,
              items: earns.map((e) => ({
                label: e.earnKey?.replace(/^earn\.profile\./, '') || 'Profile',
                amount: e.amount,
              })),
            });
            const bal = (details as { tokenBalance?: number }).tokenBalance;
            if (typeof bal === 'number' && tokensCtx) {
              tokensCtx.setBalance(bal);
            } else {
              void tokensCtx?.refresh?.();
            }
          }
        }
        return details;
      } catch (error) {
        if (error instanceof TypeError) return null;
        console.warn("Profile completeness soft-refresh skipped:", error);
        return null;
      }
    },
    [candidateId, user?.id, tokensCtx]
  );

  const dashboardRefetchRef = useRef(dashboardQuery.refetch);
  dashboardRefetchRef.current = dashboardQuery.refetch;

  const fetchDashboardData = useCallback(
    async (_id?: string) => {
      await dashboardRefetchRef.current();
    },
    [],
  );

  useEffect(() => {
    if (!candidateId) return;
    const cached = readDashboardSessionCache(candidateId);
    const fresh = isDashboardSessionCacheFresh(cached);
    const delay = fresh ? 800 : 0;
    const controller = new AbortController();

    const timer = window.setTimeout(() => {
      // When session cache is fresh, soft-pull quietly; don't blank UI on network blips
      void refreshProfileCompleteness(candidateId);
      void refreshProfileSnapshot(candidateId, controller.signal);
      if (fresh) {
        void dashboardRefetchRef.current().catch(() => null);
      }
    }, delay);
    const syncTimer = window.setTimeout(() => {
      void syncProfileToCommonDatabase(candidateId).catch(() => null);
    }, 2500 + delay);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
      window.clearTimeout(syncTimer);
    };
  }, [candidateId, refreshProfileCompleteness, refreshProfileSnapshot]);

  useEffect(() => {
    if (!candidateId || !isAuthenticated) return;

    const pendingApply = readPendingJobApply();
    if (!pendingApply?.jobId) return;
    if (pendingApplyInFlightRef.current === pendingApply.jobId) return;

    let cancelled = false;
    pendingApplyInFlightRef.current = pendingApply.jobId;

    const submitPendingApplication = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/applications`, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify({
            candidateId,
            jobId: pendingApply.jobId,
            screeningAnswers: {
              submittedVia: "phase2_job_link_redirect",
              applyLinkToken: pendingApply.token,
              tenantDbName: pendingApply.tenantDbName || null,
            },
          }),
        });

        const result = (await response.json().catch(() => ({}))) as {
          message?: string;
          data?: { applicationId?: string; appliedAt?: string; job?: { title?: string; company?: string } };
        };
        const message = String(result?.message || "").trim();

        if (!response.ok) {
          if (message.toLowerCase().includes("already applied")) {
            clearPendingJobApply();
            if (!cancelled) {
              setPendingApplyBanner({
                tone: "info",
                title: t("candidateDashboard.applicationAlreadySubmittedTitle"),
                description: t("candidateDashboard.applicationAlreadySubmittedDescription", {
                  jobTitle: pendingApply.jobTitle,
                  company: pendingApply.company
                }),
              });
              showSuccessToast(t("candidateDashboard.applicationAlreadySubmittedTitle"));
              void fetchDashboardData(candidateId);
            }
            return;
          }
          throw new Error(message || "Unable to submit your application right now.");
        }

        clearPendingJobApply();
        if (!cancelled) {
          const appliedDate = formatAppliedDate(locale, result?.data?.appliedAt);
          const resolvedJobTitle = String(result?.data?.job?.title || pendingApply.jobTitle || "Job");
          const resolvedCompany = String(result?.data?.job?.company || pendingApply.company || "Company");
          setPendingApplyBanner({
            tone: "success",
            title: t("candidateDashboard.applicationSubmittedTitle"),
            description: t("candidateDashboard.applicationSubmittedDescription", {
              jobTitle: resolvedJobTitle,
              company: resolvedCompany
            }),
          });
          setSubmittedApplicationModal({
            jobTitle: resolvedJobTitle,
            company: resolvedCompany,
            appliedDate,
            applicationId: result?.data?.applicationId,
          });
          showSuccessToast(t("candidateDashboard.applicationSubmittedTitle"));
          void fetchDashboardData(candidateId);
        }
      } catch (error) {
        if (!cancelled) {
          setPendingApplyBanner({
            tone: "error",
            title: t("candidateDashboard.applicationPendingTitle"),
            description:
              error instanceof Error
                ? error.message
                : t("candidateDashboard.applicationPendingDescription"),
          });
        }
      } finally {
        pendingApplyInFlightRef.current = null;
      }
    };

    void submitPendingApplication();

    return () => {
      cancelled = true;
    };
  }, [candidateId, fetchDashboardData, isAuthenticated, locale, t]);

  useTabVisibilityRefresh(() => {
    if (!isAuthenticated) return;
    syncAuthStorage();
    const id = candidateId || user?.id || getStoredCandidateId();
    if (!id) return;
    if (!candidateId) setCandidateId(id);
    const cached = readDashboardSessionCache(id);
    if (isDashboardSessionCacheFresh(cached)) {
      // Soft background refresh only — keep painted UI
      void refreshProfileCompleteness(id);
      void dashboardRefetchRef.current().catch(() => null);
      return;
    }
    void syncProfileToCommonDatabase(id).catch(() => null);
    void refreshProfileCompleteness(id);
    void refreshProfileSnapshot(id);
    void fetchDashboardData(id);
  }, isAuthenticated);

  useEffect(() => {
    if (!candidateId || !profileCompletionDetails) return;

    if (profileCompletionDetails.percentage >= 100) {
      setIsProfileDrawerOpen(false);
      return;
    }

    const dismissKey = `${candidateId}:profileDrawerSignature`;
    const currentSignature = profileCompletionDetails.sections
      .filter((section) => !section.isComplete)
      .map((section) => `${section.key}:${section.missingFields.join(",")}`)
      .join("|");

    const dismissedSignature = localStorage.getItem(dismissKey);
    if (dismissedSignature !== currentSignature) {
      // setIsProfileDrawerOpen(true); // Disable auto-open by default as requested
    }
  }, [candidateId, profileCompletionDetails]);

  // Dashboard data is now fetched in the consolidated effect above
  // Removing the redundant effect that was previously at this location

  useEffect(() => {
    if (!candidateId) return;

    const fetchCvAnalysis = async () => {
      try {
        let response = await fetch(`${API_BASE_URL}/cv-analysis/${candidateId}`, {
          method: "GET",
          headers: getAuthHeaders(),
        });

        if (response.status === 404) {
          await fetch(`${API_BASE_URL}/cv-analysis/analyze`, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify({ candidateId }),
          });

          response = await fetch(`${API_BASE_URL}/cv-analysis/${candidateId}`, {
            method: "GET",
            headers: getAuthHeaders(),
          });
        }

        const result = (await response.json()) as {
          success?: boolean;
          data?: { cv_score?: number };
        };

        if (response.ok && result.success && result.data?.cv_score != null) {
          void dashboardQuery.refetch();
        }
      } catch (error) {
        console.error("Error fetching CV analysis:", error);
      }
    };

    void fetchCvAnalysis();
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) return;

    const generalRawJobs = generalJobsQuery.data ?? [];
    const personalizedRawJobs = personalizedJobsQuery.data ?? [];

    const idOf = (job: unknown): string => {
      if (!job || typeof job !== "object") return "";
      const j = job as Record<string, unknown>;
      return String(j.id ?? j._id ?? j.jobId ?? "");
    };

    const personalizedById = new Map<string, Record<string, unknown>>();
    for (const job of personalizedRawJobs) {
      const id = idOf(job);
      if (id && job && typeof job === "object") {
        personalizedById.set(id, job as Record<string, unknown>);
      }
    }

    const merged: Record<string, unknown>[] = [];
    const seen = new Set<string>();
    for (const job of personalizedRawJobs) {
      const id = idOf(job);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      if (job && typeof job === "object") merged.push(job as Record<string, unknown>);
    }
    for (const job of generalRawJobs) {
      const id = idOf(job);
      if (!id || seen.has(id) || !job || typeof job !== "object") continue;
      seen.add(id);
      const personalizedMatch = personalizedById.get(id);
      merged.push(
        personalizedMatch
          ? {
              ...(job as Record<string, unknown>),
              ...personalizedMatch,
              title:
                asString((job as Record<string, unknown>).title) ??
                asString(personalizedMatch.title) ??
                asString(personalizedMatch.jobTitle),
              jobTitle:
                asString((job as Record<string, unknown>).title) ??
                asString(personalizedMatch.title) ??
                asString(personalizedMatch.jobTitle),
              location:
                asNullableString((job as Record<string, unknown>).location) ??
                asNullableString(personalizedMatch.location),
            }
          : (job as Record<string, unknown>)
      );
    }

    setJobs(merged.map((job, index) => mapJobRecord(job, `job-${index + 1}`)));
  }, [candidateId, generalJobsQuery.data, personalizedJobsQuery.data]);

  const jobsLoading =
    jobs.length === 0 &&
    (generalJobsQuery.isLoading || personalizedJobsQuery.isLoading);

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
        setSavedJobIds(parsed.filter((item): item is string => typeof item === "string"));
      }
    } catch (error) {
      console.error("Could not parse saved jobs from local storage:", error);
    }
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) return;

    const backendSavedIds = (dashboardData?.savedJobs || []).map((job) => job.id);
    if (backendSavedIds.length === 0) return;

    setSavedJobIds((previous) => mergeUnique([...previous, ...backendSavedIds]));
  }, [candidateId, dashboardData?.savedJobs]);

  useEffect(() => {
    if (!candidateId) return;
    localStorage.setItem(
      `${SAVED_JOBS_STORAGE_PREFIX}:${candidateId}`,
      JSON.stringify(savedJobIds)
    );
  }, [candidateId, savedJobIds]);

  const handlePhotoUpload = async (file: File) => {
    const resolvedCandidateId =
      candidateId || user?.id;
 
    if (!resolvedCandidateId) return;

    if (!file.type.startsWith("image/")) {
      alert(t("candidateDashboard.selectImageFile"));
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert(t("candidateDashboard.profilePhotoSizeLimit"));
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const formData = new FormData();
      formData.append("photo", file);

      const response = await fetch(
        `${API_BASE_URL}/profile/photo/${resolvedCandidateId}`,
        {
          method: "POST",
          body: formData,
        }
      );

      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
        data?: { profilePhotoUrl?: string | null };
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || t("candidateDashboard.profilePhotoUploadFailed"));
      }

      const syncedPhotoUrl = result.data?.profilePhotoUrl ?? null;

      invalidateCvDashboard(resolvedCandidateId);
      await dashboardQuery.refetch();

      if (syncedPhotoUrl) {
        dispatchProfilePhotoUpdated(syncedPhotoUrl, API_BASE_URL);
      }

      showSuccessToast(t("candidateDashboard.profilePhotoUpdated"));
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      alert(
        error instanceof Error
          ? error.message
          : t("candidateDashboard.profilePhotoUploadFailed")
      );
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    const resolvedCandidateId = candidateId || user?.id;
    if (!resolvedCandidateId) return;

    setIsDeletingPhoto(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/profile/photo/${resolvedCandidateId}`,
        { method: "DELETE" }
      );

      const result = (await response.json().catch(() => ({}))) as {
        success?: boolean;
        message?: string;
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || t("candidateDashboard.profilePhotoDeleteFailed"));
      }

      invalidateCvDashboard(resolvedCandidateId);
      await dashboardQuery.refetch();

      dispatchProfilePhotoUpdated(null);
      showSuccessToast(t("candidateDashboard.profilePhotoRemoved"));
    } catch (error) {
      console.error("Error deleting profile photo:", error);
      alert(
        error instanceof Error
          ? error.message
          : t("candidateDashboard.profilePhotoDeleteFailed")
      );
    } finally {
      setIsDeletingPhoto(false);
    }
  };

  const handleToggleFilter = (filter: JobFilterKey) => {
    setActiveFilters((previous) =>
      previous.includes(filter)
        ? previous.filter((item) => item !== filter)
        : [...previous, filter]
    );
  };

  const handleToggleSaveJob = (jobId: string) => {
    const wasSaved = savedJobIds.includes(jobId);
    setSavedJobIds((previous) =>
      previous.includes(jobId)
        ? previous.filter((item) => item !== jobId)
        : [...previous, jobId]
    );
    showSuccessToast(
      wasSaved
        ? t("candidateDashboard.jobRemovedFromSaved")
        : t("candidateDashboard.jobSaved")
    );
  };

  const handleJumpToMatches = useCallback(() => {
    if (matchesArrivalTimeoutRef.current != null) {
      window.clearTimeout(matchesArrivalTimeoutRef.current);
      matchesArrivalTimeoutRef.current = null;
    }

    jobMatchesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });

    matchesArrivalTimeoutRef.current = window.setTimeout(() => {
      triggerMatchesBadgeHighlight();
      matchesArrivalTimeoutRef.current = null;
    }, 650);
  }, [triggerMatchesBadgeHighlight]);

  const dismissProfileDrawer = () => {
    if (candidateId && profileCompletionDetails) {
      const dismissKey = `${candidateId}:profileDrawerSignature`;
      const signature = profileCompletionDetails.sections
        .filter((section) => !section.isComplete)
        .map((section) => `${section.key}:${section.missingFields.join(",")}`)
        .join("|");

      localStorage.setItem(dismissKey, signature);
    }

    setIsProfileDrawerOpen(false);
  };

  const topOpenJobMatches = useMemo(() => {
    const appliedIds = new Set<string>(dashboardData?.appliedJobIds || []);
    (dashboardData?.recentApplications || []).forEach((application) => {
      if (application.jobId) appliedIds.add(application.jobId);
    });

    return jobs.filter((job) => !appliedIds.has(job.id));
  }, [dashboardData?.appliedJobIds, dashboardData?.recentApplications, jobs]);

  const filteredJobMatches = useMemo(() => {
    let nextJobs = [...topOpenJobMatches];

    if (activeFilters.includes("remote")) {
      nextJobs = nextJobs.filter((job) => {
        const location = (job.location || "").toLowerCase();
        const workMode = (job.workMode || "").toLowerCase();
        return location.includes("remote") || workMode.includes("remote");
      });
    }

    if (activeFilters.includes("salary100k")) {
      nextJobs = nextJobs.filter(
        (job) => (job.salaryMax || 0) >= 100000 || (job.salaryMin || 0) >= 100000
      );
    }

    if (activeFilters.includes("visaFriendly")) {
      nextJobs = nextJobs.filter((job) => Boolean(job.visaSponsorship));
    }

    if (activeFilters.includes("recent")) {
      nextJobs.sort(
        (firstJob, secondJob) =>
          new Date(secondJob.postedAt).getTime() -
          new Date(firstJob.postedAt).getTime()
      );
    }

    if (activeFilters.includes("highestMatch")) {
      nextJobs.sort(
        (firstJob, secondJob) =>
          (secondJob.matchScore || 0) - (firstJob.matchScore || 0)
      );
    }

    return nextJobs.slice(0, 8);
  }, [activeFilters, topOpenJobMatches]);

  const localizedJobMatches = useMemo(() => {
    if (locale !== "fr") return filteredJobMatches;
    return filteredJobMatches.map((job) => ({
      ...job,
      title: localizeDisplayText(job.title, locale),
      company: localizeDisplayText(job.company, locale),
      location: job.location ? localizeLocationText(job.location, locale) : job.location,
    }));
  }, [filteredJobMatches, locale]);

  const localizedTopSkills = useMemo(() => {
    const skills = dashboardData?.topSkills || [];
    if (locale !== "fr") return skills;
    return skills.map((skill) => ({
      ...skill,
      name: localizeSkillName(skill.name, locale),
    }));
  }, [dashboardData?.topSkills, locale]);

  const recommendedCourses = useMemo(
    () =>
      rankUploadedCoursesForProfile(uploadedCourses, {
        skills: collectProfileSkillNames(dashboardData, profileSnapshot),
        jobs: localizedJobMatches,
        translate: tCourses,
        limit: 3,
      }),
    [uploadedCourses, dashboardData, profileSnapshot, localizedJobMatches, tCourses],
  );

  const profileCompletionPercentage =
    profileCompletionDetails?.percentage ||
    dashboardData?.stats.profileCompleteness ||
    0;
  const missingProfileSections = useMemo(
    () => getMissingProfileSections(profileSnapshot, profileCompletionDetails),
    [profileSnapshot, profileCompletionDetails],
  );

  const pendingEarnItems = useMemo(() => {
    const lifecycle = tokensCtx?.earnLifecycle || [];
    const tasks = tokensCtx?.earnTasks || [];
    const claimed = new Set(tokensCtx?.claimedEarnKeys || []);
    const SECTION_TO_EARN: Record<string, string> = {
      'basic-information': 'earn.profile.basicInformation',
      summary: 'earn.profile.summary',
      education: 'earn.profile.education',
      skills: 'earn.profile.skills',
      languages: 'earn.profile.languages',
      projects: 'earn.profile.projects',
      'career-preferences': 'earn.profile.careerPreferences',
    };
    const missingEarnKeys = new Set(
      missingProfileSections
        .map((s) => SECTION_TO_EARN[s.slug])
        .filter(Boolean) as string[],
    );

    // Prefer server lifecycle (reopens after undo + next repeat amount).
    if (lifecycle.length > 0) {
      return lifecycle
        .filter((task) => !task.done && !task.auto && task.id !== 'welcome')
        .map((task) => ({
          id: task.id,
          name: task.repeat ? `${task.name} (again)` : task.name,
          tokens: task.nextTokens || task.tokens,
          href: task.href || '/profile',
          order: task.order ?? 99,
        }))
        .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
    }

    const items: Array<{
      id: string;
      name: string;
      tokens: number;
      href: string;
      order?: number;
    }> = [];

    for (const task of tasks) {
      if (claimed.has(task.id)) continue;
      if (task.auto || task.id === 'welcome') continue;
      if (task.id === 'earn.cv_upload') {
        items.push({
          id: task.id,
          name: task.name,
          tokens: task.tokens,
          href: task.href || '/uploadcv',
          order: task.order ?? 2,
        });
        continue;
      }
      if (task.id.startsWith('earn.profile.') && missingEarnKeys.has(task.id)) {
        items.push({
          id: task.id,
          name: task.name,
          tokens: task.tokens,
          href: task.href || '/profile',
          order: task.order ?? 99,
        });
      }
    }

    return items.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
  }, [
    tokensCtx?.claimedEarnKeys,
    tokensCtx?.earnTasks,
    tokensCtx?.earnLifecycle,
    missingProfileSections,
  ]);

  // One-time pending-earn bell nudges (session)
  useEffect(() => {
    if (!candidateId || pendingEarnItems.length === 0) return;
    const key = `saasa:pending-earn-notified:${candidateId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, '1');
    const top = pendingEarnItems.slice(0, 3);
    const total = pendingEarnItems.reduce((s, i) => s + i.tokens, 0);
    void recordCandidateNotification(candidateId, {
      type: 'system',
      title: `Earn up to +${total} tokens`,
      description: `Pending: ${top.map((i) => i.name).join(', ')}${
        pendingEarnItems.length > 3 ? '…' : ''
      }. Complete these tasks to grow your balance.`,
      actionButton: 'View tasks',
      actionPath: '/subscriptions',
      metadata: { kind: 'pending_earn', channel: 'alert', count: pendingEarnItems.length, total },
    }).then(() => notifyBellRefresh());
  }, [candidateId, pendingEarnItems]);

  const savedJobsTotal = mergeUnique([
    ...savedJobIds,
    ...(dashboardData?.savedJobs || []).map((job) => job.id),
  ]).length;

  const dashboardName = getDashboardName(
    dashboardData?.profile || 
    (profileCompletionDetails ? { fullName: "Candidate" } : null)
  );
  const greeting = useMemo(
    () => getDynamicGreeting(dashboardName, filteredJobMatches.length, tGreeting),
    [dashboardName, filteredJobMatches.length, tGreeting]
  );

  const translatedMissingSectionLabels = useMemo(
    () =>
      missingProfileSections.map((section) =>
        tProfileSections(section.slug as Parameters<typeof tProfileSections>[0])
      ),
    [missingProfileSections, tProfileSections]
  );

  const heroStats: DashboardHeroStat[] = [
    {
      id: "applications",
      label: t("candidateDashboard.applicationsLabel"),
      value: String(dashboardData?.stats?.totalApplications || 0),
      helper: t("candidateDashboard.applicationsHelper"),
      icon: BriefcaseBusiness,
      onClick: () => router.push(localizePath("/applications", locale)),
    },
    {
      id: "profile",
      label: t("candidateDashboard.profileStrengthLabel"),
      value: `${profileCompletionPercentage}%`,
      helper: t("candidateDashboard.profileStrengthHelper"),
      icon: Target,
      onClick: () => router.push(localizePath("/profile", locale)),
    },
    {
      id: "cv-score",
      label: t("candidateDashboard.cvScoreLabel"),
      value: `${dashboardData?.stats?.cvScore ?? 0}`,
      helper: t("candidateDashboard.cvScoreHelper"),
      icon: Gauge,
    },
    {
      id: "saved-jobs",
      label: t("candidateDashboard.savedJobsLabel"),
      value: String(savedJobsTotal),
      helper: t("candidateDashboard.savedJobsHelper"),
      icon: BookMarked,
    },
  ];

  if (loading || jobsLoading) {
    return <GlobalLoader />;
  }

  if (!candidateId) {
    return (
      <ProfilePageShell>
        <main className="profile-page-typography candidate-dashboard-page mx-auto max-w-5xl px-6 py-16 sm:px-8">
          <div className="dashboard-surface rounded-[32px] px-8 py-12 text-center shadow-[0_28px_60px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-(--brand-primary-soft) text-(--brand-primary)">
              <BriefcaseBusiness className="h-7 w-7" strokeWidth={2.2} />
            </div>
            <h1 className="application-detail-title mt-6">
              {t("candidateDashboard.signInHeading")}
            </h1>
            <p className="application-detail-helper mx-auto mt-3 max-w-2xl">
              {t("candidateDashboard.signInDescription")}
            </p>
            <button
              type="button"
              onClick={() => router.push(localizePath("/whatsapp/verify", locale))}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-(--brand-primary) px-6 py-3 text-[0.8125rem] font-medium text-white shadow-[0_18px_36px_rgba(40,168,225,0.22)] transition-all duration-200 hover:bg-(--brand-primary-strong)"
            >
              {t("candidateDashboard.continueWithWhatsapp")}
            </button>
          </div>
        </main>
      </ProfilePageShell>
    );
  }

  return (
    <ProfilePageShell>
      <main className="profile-page-typography candidate-dashboard-page mx-auto max-w-[1180px] px-4 py-3 sm:px-5 lg:px-6 lg:py-5">
        <div className="space-y-3">
          <DashboardHero
            eyebrow={greeting.eyebrow}
            heading={greeting.heading}
            subheading={greeting.subheading}
            stats={heroStats}
            onOpenMatches={handleJumpToMatches}
            onRequestInterview={() =>
              router.push(localizePath('/lms/interview-prep?requestInterview=1', locale))
            }
          />

          {pendingApplyBanner ? (
            <div
              className={`rounded-[24px] border px-5 py-4 shadow-sm ${
                pendingApplyBanner.tone === "success"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                  : pendingApplyBanner.tone === "info"
                    ? "border-sky-200 bg-sky-50 text-sky-900"
                    : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              <p className="profile-page-value font-semibold tracking-tight">{pendingApplyBanner.title}</p>
              <p className="application-detail-helper mt-1 opacity-90">{pendingApplyBanner.description}</p>
            </div>
          ) : null}

          <div className="grid items-start gap-3 xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.45fr)]">
            <div className="space-y-3">
              <ProfileOverviewCard
                profile={dashboardData?.profile || null}
                topSkills={localizedTopSkills}
                completionPercentage={profileCompletionPercentage}
                missingSections={translatedMissingSectionLabels}
                apiBaseUrl={API_BASE_URL}
                isUploadingPhoto={isUploadingPhoto}
                isDeletingPhoto={isDeletingPhoto}
                onUploadPhoto={handlePhotoUpload}
                onDeletePhoto={handlePhotoDelete}
                onOpenProfile={() => router.push(localizePath("/profile", locale))}
                onCompleteProfile={() => setIsProfileDrawerOpen(true)}
              />

              <PendingEarnCard items={pendingEarnItems} />

              <ApplicationPipelineCard
                stats={dashboardData?.stats || null}
                applicationCounts={dashboardData?.applicationCounts}
                onViewApplications={() => router.push(localizePath("/applications", locale))}
              />
            </div>

            <div className="space-y-3">
              <div ref={jobMatchesRef} className="scroll-mt-28">
                <JobMatchesPanel
                  jobs={localizedJobMatches}
                  loading={jobsLoading}
                  savedJobIds={savedJobIds}
                  activeFilters={activeFilters}
                  isBadgeHighlighted={isMatchesBadgeHighlighted}
                  onToggleFilter={handleToggleFilter}
                  onToggleSave={handleToggleSaveJob}
                  onApply={(jobId) =>
                    router.push(
                      `${localizePath("/explore-jobs", locale)}?job=${encodeURIComponent(jobId)}`,
                    )
                  }
                  onViewAll={() => router.push(localizePath("/explore-jobs", locale))}
                />
              </div>

              <RecommendedCoursesPanel
                courses={recommendedCourses}
                loading={coursesLoading}
                onBrowseAll={() => router.push(localizePath("/lms/courses", locale))}
                onOpenCourse={(courseId) =>
                  router.push(localizePath(`/lms/courses/${courseId}`, locale))
                }
              />
            </div>
          </div>
        </div>
      </main>

      {candidateId && profileCompletionDetails ? (
        <ProfileCompletionDrawer
          candidateId={candidateId}
          isOpen={isProfileDrawerOpen}
          initialCompleteness={profileCompletionDetails}
          onClose={dismissProfileDrawer}
          onCompletionUpdated={(details) => {
            setProfileCompletionDetails(details);
          }}
        />
      ) : null}

      <ApplicationSuccessModal
        isOpen={Boolean(submittedApplicationModal)}
        onClose={() => setSubmittedApplicationModal(null)}
        jobTitle={submittedApplicationModal?.jobTitle || t("candidateDashboard.jobFallback")}
        company={submittedApplicationModal?.company || t("candidateDashboard.companyFallback")}
        appliedDate={submittedApplicationModal?.appliedDate || formatAppliedDate(locale)}
        applicationId={submittedApplicationModal?.applicationId}
      />
    </ProfilePageShell>
  );
}
