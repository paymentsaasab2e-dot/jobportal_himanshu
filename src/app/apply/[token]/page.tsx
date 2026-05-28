"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BriefcaseBusiness, Building2, MapPin } from "lucide-react";

import { savePendingJobApply } from "@/lib/job-apply-flow";

type PublicJobSummary = {
  id: string;
  title: string;
  company?: string | null;
  companyLogo?: string | null;
  location?: string | null;
};

export default function ApplyLandingPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = typeof params?.token === "string" ? params.token : "";
  const tenantDbName =
    searchParams.get("tenantDbName")?.trim() ||
    searchParams.get("tenant")?.trim() ||
    "";

  const [job, setJob] = useState<PublicJobSummary | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(token ? "" : "Invalid apply link");

  const tenantQuery = useMemo(() => {
    return tenantDbName ? `?tenantDbName=${encodeURIComponent(tenantDbName)}` : "";
  }, [tenantDbName]);

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
          data?: { job?: PublicJobSummary };
          job?: PublicJobSummary;
        };
        if (!response.ok) {
          throw new Error(json?.message || "Unable to load job");
        }
        return json?.data?.job || json?.job || null;
      })
      .then((nextJob) => {
        if (cancelled) return;
        setJob(nextJob);
        if (!nextJob) setError("Job not found");
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Unable to load job");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(40,168,225,0.14),transparent_24%),linear-gradient(180deg,#f5fafd_0%,#fcfdff_100%)] px-4 py-10 text-slate-900 sm:px-6">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl items-center justify-center">
        <div className="w-full max-w-2xl rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.10)] backdrop-blur sm:p-8">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[20px] bg-sky-50 text-sky-600">
            <BriefcaseBusiness className="h-7 w-7" />
          </div>

          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-sky-600">
              Job application
            </p>
            <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">
              Continue to apply
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-sm font-medium leading-6 text-slate-500">
              We&apos;ll first take the candidate to the Phase 1 WhatsApp login flow. After login,
              the application will be submitted automatically and the dashboard will show the
              submitted status.
            </p>
          </div>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 sm:p-6">
            {loading ? (
              <p className="text-center text-sm font-medium text-slate-500">Loading job details...</p>
            ) : error || !job ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                {error || "Job not found"}
              </div>
            ) : (
              <div className="space-y-5">
                <div className="flex items-start gap-4">
                  {job.companyLogo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.companyLogo}
                      alt={job.company || "Company logo"}
                      className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500">
                      <Building2 className="h-7 w-7" />
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                      Company
                    </p>
                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {job.company || "Company"}
                    </p>
                    <h2 className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                      {job.title}
                    </h2>
                    {job.location ? (
                      <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-medium text-slate-600 ring-1 ring-slate-200">
                        <MapPin className="h-4 w-4 text-slate-400" />
                        {job.location}
                      </p>
                    ) : null}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleContinue}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-500 px-5 py-4 text-sm font-black text-white shadow-[0_18px_34px_rgba(14,165,233,0.26)] transition hover:bg-sky-600"
                >
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
