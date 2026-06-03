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
import RecommendedCoursesPanel from "@/components/dashboard/RecommendedCoursesPanel";
import {
  getDashboardName,
  getDynamicGreeting,
} from "@/components/dashboard/dashboard-utils";
import type {
  DashboardCourse,
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
import { clearPendingJobApply, readPendingJobApply } from "@/lib/job-apply-flow";
import { useTabVisibilityRefresh } from "@/hooks/useTabVisibilityRefresh";
import { dispatchProfilePhotoUpdated } from "@/lib/profile-photo";
import { AppLocale, localizePath } from "@/lib/i18n";
import { ProfilePageShell } from "@/components/profile/layout";
import ProfileMissingSectionNudge from "@/components/profile/ProfileMissingSectionNudge";
import { getMissingProfileSections } from "@/lib/profile-section-routes";

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

function createFallbackCourses(
  dashboardData: DashboardData | null,
  jobs: DashboardJob[]
): DashboardCourse[] {
  const targetRole =
    jobs[0]?.title ||
    dashboardData?.recentApplications[0]?.jobTitle ||
    "your next role";

  const leadingSkill = dashboardData?.topSkills[0]?.name || "core product execution";
  const secondarySkill = dashboardData?.topSkills[1]?.name || "career storytelling";

  return [
    {
      id: "career-reactivation-lab",
      title: "Premium Resume Positioning Lab",
      provider: "SAASA B2E Learning Studio",
      duration: "4h 30m",
      level: "Intermediate",
      rating: 4.9,
      imageUrl: "/lms/course-covers/premium-resume-positioning-lab.webp.png",
      reasonLabel: "Fills a profile health gap",
    },
    {
      id: "skill-gap-sprint",
      title: `${leadingSkill} Skill Sprint`,
      provider: "Career Accelerator",
      duration: "6h 10m",
      level: "Intermediate",
      rating: 4.8,
      imageUrl: "/lms/course-covers/javascript-skill-sprint.webp.png",
      reasonLabel: `Required for ${targetRole}`,
    },
    {
      id: "confidence-stack",
      title: `Communicate ${secondarySkill} With Impact`,
      provider: "Interview Readiness Hub",
      duration: "3h 45m",
      level: "Beginner",
      rating: 4.7,
      imageUrl: "/lms/course-covers/communicate-typescript-with-impact.webp.png",
      reasonLabel: "Boosts recruiter confidence",
    },
  ];
}

function mapJobRecord(job: Record<string, unknown>, fallbackId: string): DashboardJob {
  const companyValue = job.company;
  const clientValue = job.client;

  let companyName = "Unknown Company";
  if (companyValue && typeof companyValue === "object") {
    companyName =
      asString((companyValue as { name?: unknown }).name) ??
      asString((companyValue as { companyName?: unknown }).companyName) ??
      companyName;
  } else if (typeof companyValue === "string") {
    companyName = companyValue;
  }

  if (clientValue && typeof clientValue === "object") {
    companyName =
      asString((clientValue as { companyName?: unknown }).companyName) ?? companyName;
  }

  const appFormLogo = asString(job.applicationFormLogo);
  const customListingImage =
    appFormLogo && /^https?:\/\//i.test(appFormLogo.trim()) ? appFormLogo.trim() : null;

  const companyLogo =
    customListingImage ??
    asString(job.companyLogo) ??
    asString(job.logo) ??
    (companyValue && typeof companyValue === "object"
      ? asString((companyValue as { logoUrl?: unknown }).logoUrl)
      : null) ??
    (clientValue && typeof clientValue === "object"
      ? asString((clientValue as { logo?: unknown }).logo)
      : null);

  return {
    id: asString(job.id) ?? asString(job._id) ?? fallbackId,
    title: asString(job.jobTitle) ?? asString(job.title) ?? "Untitled role",
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
      "USD",
    salaryAmount:
      asString((job.salary as { amount?: unknown } | undefined)?.amount) ?? null,
    experienceLevel:
      asString(job.experienceRequired) ??
      asString(job.experienceLevel) ??
      asString(job.experience) ??
      null,
    employmentType:
      asString(job.type) ?? asString(job.employmentType) ?? undefined,
    workMode: asString(job.workMode) ?? undefined,
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
  const jobMatchesRef = useRef<HTMLDivElement>(null);
  const matchesHighlightTimeoutRef = useRef<number | null>(null);
  const matchesArrivalTimeoutRef = useRef<number | null>(null);
  const pendingApplyInFlightRef = useRef<string | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
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
  const [minLoadingTimeFinished, setMinLoadingTimeFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingTimeFinished(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authLoading) {
      syncAuthStorage();
      const idFromUser = user?.id || null;
      const idFromStorage = getStoredCandidateId();
      setCandidateId(idFromUser || idFromStorage);
      if (!isAuthenticated) {
        setLoading(false);
        setJobsLoading(false);
      }
    }
  }, [authLoading, isAuthenticated, user]);

  useEffect(() => {
    const timer = window.setTimeout(() => setCoursesLoading(false), 360);
    return () => window.clearTimeout(timer);
  }, []);

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
    async (id?: string) => {
      const resolvedCandidateId = id || candidateId || user?.id;
      if (!resolvedCandidateId) return null;

      try {
        const response = await fetch(`${API_BASE_URL}/profile/${resolvedCandidateId}`, {
          method: "GET",
          headers: getAuthHeaders(),
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
        console.error("Error fetching profile snapshot:", error);
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
        return details;
      } catch (error) {
        console.error("Error fetching profile completeness:", error);
        return null;
      }
    },
    [candidateId, user?.id]
  );

  const fetchDashboardData = useCallback(async (id?: string) => {
    const targetId = id || candidateId || user?.id;
    if (!targetId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cv/dashboard/${targetId}`, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      const result = (await response.json()) as {
        success?: boolean;
        data?: DashboardData;
      };

      if (response.ok && result.success && result.data) {
        setDashboardData(result.data);
      } else {
        console.warn("Dashboard data fetch was not successful:", result);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, [candidateId, user?.id]);

  useEffect(() => {
    if (!candidateId) return;
    void syncProfileToCommonDatabase(candidateId);
    void refreshProfileCompleteness(candidateId);
    void refreshProfileSnapshot(candidateId);
    void fetchDashboardData(candidateId);
  }, [candidateId, refreshProfileCompleteness, fetchDashboardData]);

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
    void syncProfileToCommonDatabase(id);
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
          setDashboardData((previous) => {
            if (!previous) return previous;
            return {
              ...previous,
              stats: {
                ...previous.stats,
                cvScore: result.data?.cv_score || previous.stats.cvScore,
              },
            };
          });
        }
      } catch (error) {
        console.error("Error fetching CV analysis:", error);
      }
    };

    void fetchCvAnalysis();
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) return;

    let cancelled = false;

    const loadJobs = async () => {
      setJobsLoading(true);

      try {
        /**
         * Always pull the full /jobs list so a newly added role appears on the dashboard
         * even when the AI matcher (qualifiesForPersonalizedMatch) hasn't yet scored it
         * highly enough to keep it in /jobs/personalized. Personalized matches, when
         * available, are placed first and their scores overlay onto the general row.
         */
        const generalResponse = await fetch(`${API_BASE_URL}/jobs?limit=200`, {
          method: "GET",
        });
        let generalRawJobs: unknown[] = [];
        if (generalResponse.ok) {
          const generalResult = (await generalResponse.json()) as {
            success?: boolean;
            data?: { jobs?: unknown[] } | unknown[];
          };
          if (generalResult?.success !== false) {
            generalRawJobs = Array.isArray(generalResult.data)
              ? generalResult.data
              : Array.isArray((generalResult.data as { jobs?: unknown[] } | undefined)?.jobs)
              ? (generalResult.data as { jobs?: unknown[] }).jobs || []
              : [];
          }
        }

        let personalizedRawJobs: unknown[] = [];
        try {
          const personalizedResponse = await fetch(
            `${API_BASE_URL}/jobs/personalized?candidateId=${candidateId}`,
            { method: "GET" }
          );
          if (personalizedResponse.ok) {
            const personalizedResult = (await personalizedResponse.json()) as {
              success?: boolean;
              data?: unknown;
            };
            if (personalizedResult?.success !== false) {
              personalizedRawJobs = Array.isArray(personalizedResult.data)
                ? personalizedResult.data
                : Array.isArray((personalizedResult.data as { jobs?: unknown[] } | undefined)?.jobs)
                ? (personalizedResult.data as { jobs?: unknown[] }).jobs || []
                : [];
            }
          }
        } catch (personalizedError) {
          console.warn("Personalized jobs fetch failed, falling back to general", personalizedError);
        }

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
              ? { ...(job as Record<string, unknown>), ...personalizedMatch }
              : (job as Record<string, unknown>)
          );
        }

        const mappedJobs = merged.map((job, index) => mapJobRecord(job, `job-${index + 1}`));

        if (!cancelled) {
          setJobs(mappedJobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        if (!cancelled) {
          setJobs([]);
        }
      } finally {
        if (!cancelled) setJobsLoading(false);
      }
    };

    void loadJobs();

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

      let syncedPhotoUrl = result.data?.profilePhotoUrl ?? null;

      const refreshedProfile = await fetch(
        `${API_BASE_URL}/cv/dashboard/${resolvedCandidateId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const refreshedResult = (await refreshedProfile.json()) as {
        success?: boolean;
        data?: DashboardData;
      };

      if (refreshedProfile.ok && refreshedResult.success && refreshedResult.data) {
        setDashboardData(refreshedResult.data);
        syncedPhotoUrl =
          refreshedResult.data.profile?.profilePhotoUrl ?? syncedPhotoUrl;
      }

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

      const refreshedProfile = await fetch(
        `${API_BASE_URL}/cv/dashboard/${resolvedCandidateId}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      const refreshedResult = (await refreshedProfile.json()) as {
        success?: boolean;
        data?: DashboardData;
      };

      if (refreshedProfile.ok && refreshedResult.success && refreshedResult.data) {
        setDashboardData(refreshedResult.data);
      }

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

  const recommendedCourses = useMemo(
    () => createFallbackCourses(dashboardData, filteredJobMatches),
    [dashboardData, filteredJobMatches]
  );

  const profileCompletionPercentage =
    profileCompletionDetails?.percentage ||
    dashboardData?.stats.profileCompleteness ||
    0;
  const missingProfileSections = useMemo(
    () => getMissingProfileSections(profileSnapshot, profileCompletionDetails),
    [profileSnapshot, profileCompletionDetails],
  );

  const savedJobsTotal = mergeUnique([
    ...savedJobIds,
    ...(dashboardData?.savedJobs || []).map((job) => job.id),
  ]).length;

  const dashboardName = getDashboardName(
    dashboardData?.profile || 
    (profileCompletionDetails ? { fullName: "Candidate" } : null)
  );
  const greeting = getDynamicGreeting(dashboardName, filteredJobMatches.length);

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

  if (loading || jobsLoading || !minLoadingTimeFinished) {
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
                topSkills={dashboardData?.topSkills || []}
                completionPercentage={profileCompletionPercentage}
                missingSections={missingProfileSections.map((section) => section.label)}
                apiBaseUrl={API_BASE_URL}
                isUploadingPhoto={isUploadingPhoto}
                isDeletingPhoto={isDeletingPhoto}
                onUploadPhoto={handlePhotoUpload}
                onDeletePhoto={handlePhotoDelete}
                onOpenProfile={() => router.push(localizePath("/profile", locale))}
                onCompleteProfile={() => setIsProfileDrawerOpen(true)}
              />

              <ApplicationPipelineCard
                stats={dashboardData?.stats || null}
                applicationCounts={dashboardData?.applicationCounts}
                onViewApplications={() => router.push(localizePath("/applications", locale))}
              />
            </div>

            <div className="space-y-3">
              <div ref={jobMatchesRef} className="scroll-mt-28">
                <JobMatchesPanel
                  jobs={filteredJobMatches}
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
                onBrowseAll={() => router.push(localizePath("/courses", locale))}
                onOpenCourse={(courseId) => router.push(localizePath(`/courses/${courseId}`, locale))}
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

      {candidateId && missingProfileSections.length > 0 ? (
        <ProfileMissingSectionNudge
          locale={locale}
          missingSections={missingProfileSections}
          onNavigate={(href) => router.push(href)}
          storageKeyPrefix={`${candidateId}:profileMissingNudge`}
        />
      ) : null}
    </ProfilePageShell>
  );
}
