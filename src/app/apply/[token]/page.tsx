"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Building2, Check, Loader2, MapPin, Share2 } from "lucide-react";
import { Manrope, Syne } from "next/font/google";

import {
  JobDetailHighlights,
  JobPostingDetailsPanel,
  type JobPostingDetailsJob,
} from "@/components/jobs/JobPostingDetailsPanel";
import { JobApplyShareRail } from "@/components/jobs/JobApplyShareRail";
import { savePendingJobApply } from "@/lib/job-apply-flow";

const displayFont = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--apply-display",
});

const bodyFont = Manrope({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--apply-body",
});

type PublicApplyJob = {
  id: string;
  title: string;
  company?: string | null;
  companyLogo?: string | null;
  location?: string | null;
  description?: string | null;
  overview?: string | null;
  keyResponsibilities?: string[];
  requirements?: string[];
  candidateRequirements?: string[];
  skills?: string[];
  preferredSkills?: string[];
  experienceRequired?: string | null;
  education?: string | null;
  benefits?: string[];
  employmentType?: string | null;
  workMode?: string | null;
  openings?: number | null;
  salary?: unknown;
  showClientNamePublicly?: boolean;
  publicFieldVisibility?: Record<string, boolean> | null;
  aboutCompany?: string | null;
  recruiterProfile?: {
    id?: string;
    name?: string;
    designation?: string | null;
    avatarUrl?: string | null;
  } | null;
};

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => String(item || "").trim()).filter(Boolean);
}

function parseSalary(salary: unknown): {
  salaryCurrency?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryLabel?: string;
} {
  if (salary == null) return {};
  if (typeof salary === "string" || typeof salary === "number") {
    const label = String(salary).trim();
    return label ? { salaryLabel: label } : {};
  }
  if (typeof salary !== "object") return {};
  const row = salary as Record<string, unknown>;
  const currency = String(row.currency || row.salaryCurrency || "").trim() || null;
  const minRaw = row.min ?? row.salaryMin ?? row.from;
  const maxRaw = row.max ?? row.salaryMax ?? row.to;
  const min = typeof minRaw === "number" ? minRaw : Number(minRaw);
  const max = typeof maxRaw === "number" ? maxRaw : Number(maxRaw);
  const salaryMin = Number.isFinite(min) ? min : null;
  const salaryMax = Number.isFinite(max) ? max : null;
  const parts: string[] = [];
  if (currency) parts.push(currency);
  if (salaryMin != null || salaryMax != null) {
    parts.push(
      [salaryMin != null ? String(salaryMin) : "", salaryMax != null ? String(salaryMax) : ""]
        .filter(Boolean)
        .join(" - "),
    );
  }
  return {
    salaryCurrency: currency,
    salaryMin,
    salaryMax,
    salaryLabel: parts.join(" ").trim() || undefined,
  };
}

function formatEmploymentType(type?: string | null): string {
  const raw = String(type || "").trim();
  if (!raw) return "";
  const map: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
    FREELANCE: "Freelance",
    INTERNSHIP: "Internship",
  };
  if (map[raw]) return map[raw];
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function mapPublicJobToDetails(job: PublicApplyJob): JobPostingDetailsJob {
  const salary = parseSalary(job.salary);
  const experienceRaw = String(job.experienceRequired || "").trim();
  const experienceRange = experienceRaw.match(/^(\d+)\s*[-–]\s*(\d+)/);

  return {
    title: job.title,
    company: job.company || "Company",
    location: job.location || undefined,
    salary: salary.salaryLabel,
    salaryCurrency: salary.salaryCurrency,
    salaryMin: salary.salaryMin,
    salaryMax: salary.salaryMax,
    workMode: job.workMode || undefined,
    employmentType: formatEmploymentType(job.employmentType) || undefined,
    openings: typeof job.openings === "number" ? job.openings : undefined,
    experienceMin: experienceRange ? Number(experienceRange[1]) : null,
    experienceMax: experienceRange ? Number(experienceRange[2]) : null,
    experienceDisplay: experienceRaw || null,
    experienceLevel: experienceRaw || undefined,
    skills: asStringList(job.skills),
    requiredSkills: asStringList(job.preferredSkills),
    responsibilities: asStringList(job.keyResponsibilities),
    preferredQualifications: asStringList(job.requirements),
    candidateRequirements: asStringList(job.candidateRequirements),
    education: job.education || undefined,
    benefits: asStringList(job.benefits),
    fullDescription: job.description || job.overview || undefined,
    description: job.description || undefined,
    jobOverview: job.overview || undefined,
    showClientNamePublicly: job.showClientNamePublicly,
    publicFieldVisibility: job.publicFieldVisibility,
    aboutCompany: job.aboutCompany || undefined,
    recruiterProfile: job.recruiterProfile || null,
  };
}

export default function ApplyLandingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = typeof params?.token === "string" ? params.token : "";
  const tenantDbName =
    searchParams.get("tenantDbName")?.trim() ||
    searchParams.get("tenant")?.trim() ||
    "";

  const [job, setJob] = useState<PublicApplyJob | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(token ? "" : "Invalid apply link");
  const [ready, setReady] = useState(false);
  const [shareState, setShareState] = useState<"idle" | "copied" | "shared">("idle");
  const [shareUrl, setShareUrl] = useState("");

  const tenantQuery = useMemo(() => {
    return tenantDbName ? `?tenantDbName=${encodeURIComponent(tenantDbName)}` : "";
  }, [tenantDbName]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Share the exact public apply URL the candidate is viewing (locale + tenant).
    setShareUrl(window.location.href);
  }, [token, tenantDbName]);

  const detailsJob = useMemo(() => (job ? mapPublicJobToDetails(job) : null), [job]);

  const shareTitle = useMemo(() => {
    if (!job) return "Job application";
    return job.company ? `${job.title} at ${job.company}` : job.title;
  }, [job]);

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (!url) return;

    const payload = {
      title: shareTitle,
      text: `Check out this role: ${shareTitle}`,
      url,
    };

    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share(payload);
        setShareState("shared");
        window.setTimeout(() => setShareState("idle"), 2000);
        return;
      }
    } catch (err) {
      // User cancelled native share — don't fall through as an error.
      if (err instanceof DOMException && err.name === "AbortError") return;
    }

    try {
      await navigator.clipboard.writeText(url);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    } catch {
      // Last resort for older browsers without clipboard permission.
      const input = document.createElement("input");
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setShareState("copied");
      window.setTimeout(() => setShareState("idle"), 2000);
    }
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    void fetch(`/api/proxy/phase2-public-apply/${encodeURIComponent(token)}${tenantQuery}`, {
      cache: "no-store",
    })
      .then(async (response) => {
        const json = (await response.json().catch(() => ({}))) as {
          success?: boolean;
          message?: string;
          data?: { job?: PublicApplyJob };
          job?: PublicApplyJob;
        };
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("This job isn’t available");
          }
          throw new Error("Unable to connect right now");
        }
        return json?.data?.job || json?.job || null;
      })
      .then((nextJob) => {
        if (cancelled) return;
        setJob(nextJob);
        if (!nextJob) setError("This job isn’t available");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to connect right now");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          requestAnimationFrame(() => setReady(true));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tenantQuery, token]);

  const handleContinue = () => {
    if (!job) return;
    savePendingJobApply({
      token,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company || "Company",
      companyLogo: job.companyLogo || null,
      tenantDbName: tenantDbName || null,
    });
    sessionStorage.setItem("postLoginRedirect", "/candidate-dashboard");
    router.push("/whatsapp");
  };

  return (
    <div
      className={`${displayFont.variable} ${bodyFont.variable} apply-page min-h-screen text-[var(--apply-ink)]`}
      style={
        {
          "--apply-ink": "#0f1c24",
          "--apply-muted": "#5b6b76",
          "--apply-line": "rgba(15, 28, 36, 0.08)",
          "--apply-surface": "#f5fafc",
          "--apply-accent": "#2098C8",
          "--apply-accent-deep": "#1A86B3",
          "--apply-glow": "rgba(32, 152, 200, 0.2)",
          fontFamily: "var(--apply-body), ui-sans-serif, system-ui, sans-serif",
        } as CSSProperties
      }
    >
      {!loading && job && shareUrl ? (
        <JobApplyShareRail shareUrl={shareUrl} jobTitle={shareTitle} />
      ) : null}

      <style>{`
        .apply-page {
          background:
            radial-gradient(ellipse 90% 55% at 12% -10%, var(--apply-glow), transparent 55%),
            radial-gradient(ellipse 70% 45% at 95% 8%, rgba(240, 136, 24, 0.1), transparent 50%),
            linear-gradient(180deg, #e8f6fb 0%, var(--apply-surface) 38%, #ffffff 100%);
        }
        .apply-page::before {
          content: "";
          position: fixed;
          inset: 0;
          pointer-events: none;
          opacity: 0.35;
          background-image: linear-gradient(rgba(15, 28, 36, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15, 28, 36, 0.03) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: linear-gradient(180deg, black 0%, transparent 70%);
        }
        .apply-reveal {
          opacity: 0;
          transform: translateY(18px);
          transition:
            opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
            transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
        }
        .apply-reveal.is-ready {
          opacity: 1;
          transform: translateY(0);
        }
        .apply-reveal-delay-1 {
          transition-delay: 0.08s;
        }
        .apply-reveal-delay-2 {
          transition-delay: 0.16s;
        }
        .apply-reveal-delay-3 {
          transition-delay: 0.24s;
        }
        .apply-cta {
          transition:
            transform 0.25s ease,
            background-color 0.25s ease,
            box-shadow 0.25s ease;
        }
        .apply-cta:hover {
          transform: translateY(-1px);
          background-color: var(--apply-accent-deep);
          box-shadow: 0 18px 40px rgba(32, 152, 200, 0.28);
        }
        .apply-cta:active {
          transform: translateY(0);
        }
        .apply-logo {
          animation: applyLogoIn 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        @keyframes applyLogoIn {
          from {
            opacity: 0;
            transform: scale(0.92);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @media (min-width: 1024px) {
          .apply-left-card-fixed {
            position: fixed;
            top: 5.5rem;
            left: max(1.5rem, calc((100vw - 72rem) / 2 + 2rem));
            z-index: 10;
            width: 21.5rem;
            max-height: none;
            overflow: visible;
          }
        }
        @media (min-width: 1280px) {
          .apply-left-card-fixed {
            width: 22.5rem;
          }
        }
      `}</style>

      <header
        className={`apply-reveal fixed inset-x-0 top-0 z-40 bg-transparent ${ready || loading ? "is-ready" : ""}`}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <div className="relative flex items-center">
            <Image
              src="/saasa-logo.png"
              alt="HR Yantra"
              width={140}
              height={40}
              priority
              className="h-9 w-auto object-contain object-left sm:h-10"
            />
          </div>
          <div className="flex items-center gap-3">
            <p className="hidden text-xs font-medium text-[var(--apply-muted)] sm:block">
              Job application
            </p>
            {!loading && job ? (
              <button
                type="button"
                onClick={() => {
                  void handleShare();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--apply-line)] bg-white/90 px-3.5 py-2 text-xs font-semibold text-[var(--apply-ink)] shadow-sm transition hover:border-[var(--apply-accent)] hover:text-[var(--apply-accent)]"
                aria-label="Share this job link"
              >
                {shareState === "copied" || shareState === "shared" ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-[var(--apply-accent)]" strokeWidth={2.5} />
                    {shareState === "copied" ? "Link copied" : "Shared"}
                  </>
                ) : (
                  <>
                    <Share2 className="h-3.5 w-3.5" strokeWidth={2.25} />
                    Share
                  </>
                )}
              </button>
            ) : null}
          </div>
        </div>
      </header>

      <div className="relative mx-auto max-w-6xl px-4 pb-28 pt-24 sm:px-6 sm:pt-28 lg:px-8">
        {loading ? (
          <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-[var(--apply-muted)]">
            <Loader2 className="h-6 w-6 animate-spin text-[var(--apply-accent)]" />
            <p className="text-sm font-medium">Loading role details…</p>
          </div>
        ) : error || !job || !detailsJob ? (
          <div className="mx-auto max-w-lg rounded-3xl border border-red-200/80 bg-white/90 px-6 py-8 text-center shadow-sm">
            <p className="text-base font-semibold text-slate-900">
              {error === "Unable to connect right now"
                ? "Unable to connect right now"
                : "This job isn’t available"}
            </p>
            <p className="mt-2 text-sm text-[var(--apply-muted)]">
              {error === "Unable to connect right now"
                ? "Please try again in a little while. Your work is safe."
                : "Ask the recruiter for a new link and try again."}
            </p>
          </div>
        ) : (
          <div className="relative flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            {/* Identity column — fixed on desktop so it stays put while details scroll */}
            <aside className="w-full shrink-0 lg:w-[21.5rem] xl:w-[22.5rem]">
              <div
                className={`apply-reveal apply-reveal-delay-1 apply-left-card-fixed relative rounded-[1.5rem] border border-[var(--apply-line)] bg-white/80 p-4 shadow-[0_18px_44px_rgba(15,28,36,0.08)] backdrop-blur-sm sm:p-5 ${ready ? "is-ready" : ""}`}
              >
                <div
                  className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full"
                  style={{
                    background:
                      "radial-gradient(circle, rgba(15,118,110,0.16) 0%, transparent 70%)",
                  }}
                />

                <div className="apply-logo relative mb-4">
                  {job.companyLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.companyLogo}
                      alt={job.company || "Company logo"}
                      className="h-12 w-12 rounded-xl object-cover ring-1 ring-[var(--apply-line)]"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--apply-surface)] text-[var(--apply-accent)] ring-1 ring-[var(--apply-line)]">
                      <Building2 className="h-5 w-5" strokeWidth={1.75} />
                    </div>
                  )}
                </div>

                {job.company ? (
                  <p
                    className="relative text-xl font-extrabold tracking-tight text-[var(--apply-ink)] sm:text-2xl"
                    style={{ fontFamily: "var(--apply-display), sans-serif" }}
                  >
                    {job.company}
                  </p>
                ) : null}

                <h1
                  className="relative mt-2 text-2xl font-extrabold leading-[1.15] tracking-tight text-[var(--apply-ink)] sm:text-[1.75rem]"
                  style={{ fontFamily: "var(--apply-display), sans-serif" }}
                >
                  {job.title}
                </h1>

                <p className="relative mt-3 max-w-md text-xs leading-5 text-[var(--apply-muted)] sm:text-[13px] sm:leading-5">
                  Review the role, then continue to WhatsApp login. Your application submits
                  automatically after login.
                </p>

                {job.location ? (
                  <p className="relative mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[var(--apply-ink)] sm:text-sm">
                    <MapPin className="h-3.5 w-3.5 text-[var(--apply-accent)]" strokeWidth={2} />
                    {job.location}
                  </p>
                ) : null}

                <div className="relative mt-4 [&_.mt-4]:mt-0 [&_span]:rounded-md [&_span]:px-2 [&_span]:py-1.5 [&_span]:text-xs">
                  <JobDetailHighlights job={detailsJob} />
                </div>

                <div className="relative mt-5 hidden gap-2 lg:flex">
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="apply-cta inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-xl bg-[var(--apply-accent)] px-4 py-3 text-sm font-bold text-white"
                  >
                    Continue to apply
                    <ArrowRight className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      void handleShare();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--apply-line)] bg-white px-3.5 py-3 text-sm font-bold text-[var(--apply-ink)] transition hover:border-[var(--apply-accent)] hover:text-[var(--apply-accent)]"
                    aria-label="Share this job link"
                  >
                    {shareState === "copied" || shareState === "shared" ? (
                      <Check className="h-4 w-4 text-[var(--apply-accent)]" strokeWidth={2.5} />
                    ) : (
                      <Share2 className="h-4 w-4" strokeWidth={2.25} />
                    )}
                    Share
                  </button>
                </div>
              </div>
            </aside>

            {/* Details column scrolls; left card stays on screen */}
            <section
              className={`apply-reveal apply-reveal-delay-2 min-w-0 flex-1 ${ready ? "is-ready" : ""}`}
            >
              <div
                className={`apply-reveal apply-reveal-delay-3 rounded-[2rem] border border-[var(--apply-line)] bg-white/90 px-5 py-6 shadow-[0_18px_44px_rgba(15,28,36,0.06)] sm:px-7 sm:py-8 ${ready ? "is-ready" : ""}`}
              >
                <div className="mb-6 border-b border-[var(--apply-line)] pb-5">
                  <p
                    className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[var(--apply-accent)]"
                    style={{ fontFamily: "var(--apply-display), sans-serif" }}
                  >
                    Role details
                  </p>
                  <h2
                    className="mt-1 text-xl font-bold tracking-tight text-[var(--apply-ink)] sm:text-2xl"
                    style={{ fontFamily: "var(--apply-display), sans-serif" }}
                  >
                    Everything about this position
                  </h2>
                </div>
                <JobPostingDetailsPanel job={detailsJob} />
              </div>
            </section>
          </div>
        )}
      </div>

      {/* Mobile sticky CTA */}
      {!loading && job && detailsJob ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[var(--apply-line)] bg-white/90 px-4 py-3 backdrop-blur-md lg:hidden">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleContinue}
              className="apply-cta inline-flex min-w-0 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--apply-accent)] px-5 py-3.5 text-sm font-bold text-white"
            >
              Continue to apply
              <ArrowRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                void handleShare();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--apply-line)] bg-white px-4 py-3.5 text-sm font-bold text-[var(--apply-ink)]"
              aria-label="Share this job link"
            >
              {shareState === "copied" || shareState === "shared" ? (
                <Check className="h-4 w-4 text-[var(--apply-accent)]" strokeWidth={2.5} />
              ) : (
                <Share2 className="h-4 w-4" strokeWidth={2.25} />
              )}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
