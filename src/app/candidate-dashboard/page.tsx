"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BookMarked, BriefcaseBusiness, Gauge, Rocket, Target } from "lucide-react";
import AiLoadingScreen from "@/components/common/AiLoadingScreen";
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
  type ProfileCompletenessResponse,
} from "@/lib/profile-completion";

const PAGE_BG =
  "radial-gradient(circle at top left, rgba(40,168,225,0.13), transparent 28%), radial-gradient(circle at 85% 12%, rgba(40,168,223,0.1), transparent 16%), radial-gradient(circle at 18% 82%, rgba(252,150,32,0.08), transparent 18%), linear-gradient(180deg, #f5fafd 0%, #f8fcff 44%, #fcfdff 100%)";

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

async function fetchPhase2PublicJobs(): Promise<unknown[]> {
  try {
    const response = await fetch(`/api/proxy/phase2-public-jobs?limit=120`, {
      method: "GET",
    });
    const result = (await response.json()) as {
      success?: boolean;
      data?: unknown;
    };

    if (!response.ok || !result.success || !Array.isArray(result.data)) {
      return [];
    }

    return result.data;
  } catch (error) {
    console.error("Error fetching Phase 2 public jobs:", error);
    return [];
  }
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
      provider: "SAASA Learning Studio",
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

  const companyLogo =
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
  const router = useRouter();
  const jobMatchesRef = useRef<HTMLDivElement>(null);
  const matchesHighlightTimeoutRef = useRef<number | null>(null);
  const matchesArrivalTimeoutRef = useRef<number | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<DashboardJob[]>([]);
  const [jobsLoading, setJobsLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [savedJobIds, setSavedJobIds] = useState<string[]>([]);
  const [backendMatchedJobsCount, setBackendMatchedJobsCount] = useState(0);
  const [isMatchesBadgeHighlighted, setIsMatchesBadgeHighlighted] = useState(false);
  const [activeFilters, setActiveFilters] = useState<JobFilterKey[]>([
    "highestMatch",
  ]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profileCompletionDetails, setProfileCompletionDetails] =
    useState<ProfileCompletenessResponse | null>(null);
  const [isProfileDrawerOpen, setIsProfileDrawerOpen] = useState(false);
  const [minLoadingTimeFinished, setMinLoadingTimeFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingTimeFinished(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const id = sessionStorage.getItem("candidateId");
    setCandidateId(id);
    if (!id) {
      setLoading(false);
      setJobsLoading(false);
    }
  }, []);

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

  const refreshProfileCompleteness = useCallback(
    async (id?: string) => {
      const resolvedCandidateId =
        id || candidateId || sessionStorage.getItem("candidateId");

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
    [candidateId]
  );

  const fetchDashboardData = useCallback(async (id?: string) => {
    const targetId = id || candidateId || sessionStorage.getItem("candidateId");
    if (!targetId) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cv/dashboard/${targetId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
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
  }, [candidateId]);

  useEffect(() => {
    if (!candidateId) return;
    void refreshProfileCompleteness(candidateId);
    void fetchDashboardData(candidateId);
  }, [candidateId, refreshProfileCompleteness, fetchDashboardData]);

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
          headers: { "Content-Type": "application/json" },
        });

        if (response.status === 404) {
          await fetch(`${API_BASE_URL}/cv-analysis/analyze`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidateId }),
          });

          response = await fetch(`${API_BASE_URL}/cv-analysis/${candidateId}`, {
            method: "GET",
            headers: { "Content-Type": "application/json" },
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
        let response = await fetch(
          `${API_BASE_URL}/jobs/personalized?candidateId=${candidateId}`,
          { method: "GET" }
        );
        let result = (await response.json()) as {
          success?: boolean;
          data?: unknown;
        };

        if (!response.ok || !result.success) {
          response = await fetch(`${API_BASE_URL}/jobs?limit=80`, { method: "GET" });
          result = (await response.json()) as {
            success?: boolean;
            data?: { jobs?: unknown[] } | unknown[];
          };
        }

        if (!response.ok || !result.success) {
          throw new Error("Failed to load jobs");
        }

        const rawJobs = Array.isArray(result.data)
          ? result.data
          : Array.isArray((result.data as { jobs?: unknown[] } | undefined)?.jobs)
          ? (result.data as { jobs?: unknown[] }).jobs || []
          : [];

        if (!cancelled) {
          setBackendMatchedJobsCount(rawJobs.length);
        }

        const phase2Jobs = await fetchPhase2PublicJobs();
        const mergedRawJobs = [...rawJobs];
        const existingIds = new Set(
          rawJobs
            .filter((job): job is Record<string, unknown> => typeof job === "object" && job !== null)
            .map((job) => asString(job.id) ?? asString(job._id))
            .filter((value): value is string => Boolean(value))
        );

        phase2Jobs.forEach((job) => {
          if (typeof job !== "object" || job === null) return;
          const jobRecord = job as Record<string, unknown>;
          const jobId = asString(jobRecord.id) ?? asString(jobRecord._id);
          if (jobId && existingIds.has(jobId)) return;
          if (jobId) existingIds.add(jobId);
          mergedRawJobs.push(jobRecord);
        });

        const mappedJobs = mergedRawJobs
          .filter((job): job is Record<string, unknown> => typeof job === "object" && job !== null)
          .map((job, index) => mapJobRecord(job, `job-${index + 1}`));

        if (!cancelled) {
          setJobs(mappedJobs);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
        if (!cancelled) {
          setBackendMatchedJobsCount(0);
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
      candidateId || sessionStorage.getItem("candidateId");

    if (!resolvedCandidateId) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert("Profile photos must be smaller than 2MB.");
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
      };

      if (!response.ok || !result.success) {
        throw new Error(result.message || "Failed to upload profile photo");
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

      showSuccessToast("Profile photo updated");
    } catch (error) {
      console.error("Error uploading profile photo:", error);
      alert(error instanceof Error ? error.message : "Profile photo upload failed.");
    } finally {
      setIsUploadingPhoto(false);
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
    showSuccessToast(wasSaved ? "Job removed from saved jobs" : "Job saved");
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
  const missingSectionLabels =
    profileCompletionDetails?.sections
      .filter((section) => !section.isComplete)
      .map((section) => section.label) || [];

  const savedJobsTotal = mergeUnique([
    ...savedJobIds,
    ...(dashboardData?.savedJobs || []).map((job) => job.id),
  ]).length;

  const dashboardName = getDashboardName(
    dashboardData?.profile || 
    (profileCompletionDetails ? { fullName: "Candidate" } as any : null)
  );
  const greeting = getDynamicGreeting(dashboardName, backendMatchedJobsCount);

  const heroStats: DashboardHeroStat[] = [
    {
      id: "applications",
      label: "Applications",
      value: String(dashboardData?.stats?.totalApplications || 0),
      helper: "Roles already in motion",
      icon: BriefcaseBusiness,
      onClick: () => router.push("/applications"),
    },
    {
      id: "profile",
      label: "Profile Strength",
      value: `${profileCompletionPercentage}%`,
      helper: "Recruiter-facing completion",
      icon: Target,
      onClick: () => router.push("/profile"),
    },
    {
      id: "cv-score",
      label: "CV Score",
      value: `${dashboardData?.stats?.cvScore ?? 0}`,
      helper: "Based on latest analysis",
      icon: Gauge,
    },
    {
      id: "saved-jobs",
      label: "Saved Jobs",
      value: String(savedJobsTotal),
      helper: "Bookmarked for later",
      icon: BookMarked,
    },
  ];

  if (loading || jobsLoading || !minLoadingTimeFinished) {
    return <AiLoadingScreen message="HRYantra AI" />;
  }

  if (!candidateId) {
    return (
      <div className="min-h-screen" style={{ background: PAGE_BG }}>
        <main className="mx-auto max-w-5xl px-6 py-16 sm:px-8">
          <div className="dashboard-surface rounded-[32px] px-8 py-12 text-center shadow-[0_28px_60px_rgba(15,23,42,0.08)]">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[24px] bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
              <BriefcaseBusiness className="h-7 w-7" strokeWidth={2.2} />
            </div>
            <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">
              Sign in to unlock your dashboard
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base font-medium leading-7 text-slate-500">
              Verify your WhatsApp number first so we can load your applications,
              profile progress, and role recommendations.
            </p>
            <button
              type="button"
              onClick={() => router.push("/whatsapp/verify")}
              className="mt-8 inline-flex items-center justify-center rounded-full bg-[var(--brand-primary)] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_36px_rgba(40,168,225,0.22)] transition-all duration-200 hover:bg-[var(--brand-primary-strong)]"
            >
              Continue with WhatsApp
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: PAGE_BG }}>
      <main className="mx-auto max-w-[1180px] px-4 py-3 sm:px-5 lg:px-6 lg:py-5">
        <div className="space-y-3">
          <DashboardHero
            eyebrow={greeting.eyebrow}
            heading={greeting.heading}
            subheading={greeting.subheading}
            stats={heroStats}
            onOpenMatches={handleJumpToMatches}
            onExploreJobs={() => router.push("/explore-jobs")}
            onViewApplications={() => router.push("/applications")}
            onBrowseCourses={() => router.push("/lms/courses")}
            onEditProfile={() => router.push("/profile")}
          />

          <div className="grid items-start gap-3 xl:grid-cols-[minmax(300px,0.82fr)_minmax(0,1.45fr)]">
            <div className="space-y-3">
              <ProfileOverviewCard
                profile={dashboardData?.profile || null}
                topSkills={dashboardData?.topSkills || []}
                completionPercentage={profileCompletionPercentage}
                missingSections={missingSectionLabels}
                apiBaseUrl={API_BASE_URL}
                isUploadingPhoto={isUploadingPhoto}
                onUploadPhoto={handlePhotoUpload}
                onOpenProfile={() => router.push("/profile")}
                onCompleteProfile={() => setIsProfileDrawerOpen(true)}
              />

              <ApplicationPipelineCard
                stats={dashboardData?.stats || null}
                applicationCounts={dashboardData?.applicationCounts}
                onViewApplications={() => router.push("/applications")}
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
                  onApply={() => router.push("/explore-jobs")}
                  onViewAll={() => router.push("/explore-jobs")}
                />
              </div>

              <RecommendedCoursesPanel
                courses={recommendedCourses}
                loading={coursesLoading}
                onBrowseAll={() => router.push("/courses")}
                onOpenCourse={(courseId) => router.push(`/courses/${courseId}`)}
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
    </div>
  );
}
