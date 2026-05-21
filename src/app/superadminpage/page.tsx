"use client";

import { useState, useEffect, useCallback } from "react";
import { API_BASE_URL } from "@/lib/api-base";

interface Candidate {
  id: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  whatsappNumber: string;
  countryCode: string;
  isVerified: boolean;
  createdAt: string;
  updatedAt?: string;
}

interface CandidateDetail {
  id: string;
  whatsappNumber: string;
  countryCode: string;
  personalInformation: any;
  summary: any;
  education: any[];
  workExperience: any[];
  skills: any[];
  languages: any[];
  careerPreferences: any;
  resume: any;
  cvAnalysis: any;
  certifications: any[];
}

type DeletePreviewEntry = {
  candidateId: string;
  label?: string;
  phase1: Record<string, unknown>;
  common: Record<string, unknown> | null;
  commonDatabaseConfigured?: boolean;
};

function JsonBlock({ data, label }: { data: unknown; label: string }) {
  return (
    <details className="rounded-lg border border-slate-200 bg-slate-50">
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-slate-800">
        {label}
      </summary>
      <pre className="max-h-64 overflow-auto p-3 text-xs text-slate-700 whitespace-pre-wrap break-words">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}

function DeletePreviewPanel({ entry }: { entry: DeletePreviewEntry }) {
  const phase1 = entry.phase1 || {};
  const core = (phase1.core || {}) as Record<string, unknown>;
  const profile = phase1.profile as Record<string, unknown> | null | undefined;
  const relatedCounts = phase1.relatedCounts as Record<string, number> | undefined;

  return (
    <div className="space-y-4 border-b border-slate-200 pb-6 last:border-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h4 className="text-base font-semibold text-slate-900">
          {entry.label || String(core.id || entry.candidateId)}
        </h4>
        <span className="font-mono text-xs text-slate-500">{entry.candidateId}</span>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
          <h5 className="mb-3 text-sm font-bold uppercase tracking-wide text-blue-900">
            Phase 1 database
          </h5>
          <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-slate-500">Name</dt>
              <dd className="font-medium text-slate-900">
                {(profile?.fullName as string) ||
                  [core.firstName, core.lastName].filter(Boolean).join(" ") ||
                  "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Email</dt>
              <dd className="break-all font-medium text-slate-900">
                {(profile?.email as string) || (core.email as string) || "—"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">WhatsApp</dt>
              <dd className="font-medium text-slate-900">
                ({String(core.countryCode || "")}) {String(core.whatsappNumber || "—")}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Verified</dt>
              <dd className="font-medium text-slate-900">
                {core.isVerified ? "Yes" : "No"}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Stage</dt>
              <dd className="font-medium text-slate-900">
                {String(core.stage || "—")}
              </dd>
            </div>
            <div>
              <dt className="text-slate-500">Assigned jobs</dt>
              <dd className="font-medium text-slate-900">
                {Array.isArray(core.assignedJobs)
                  ? (core.assignedJobs as string[]).length
                  : 0}
              </dd>
            </div>
          </dl>
          {relatedCounts && (
            <div className="mt-3 flex flex-wrap gap-2">
              {Object.entries(relatedCounts).map(([key, count]) => (
                <span
                  key={key}
                  className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200"
                >
                  {key}: {count}
                </span>
              ))}
            </div>
          )}
          <div className="mt-3 space-y-2">
            <JsonBlock data={phase1.core} label="Core candidate record (full)" />
            <JsonBlock data={phase1.profile} label="Profile" />
            <JsonBlock data={phase1.educations} label="Education" />
            <JsonBlock data={phase1.workExperiences} label="Work experience" />
            <JsonBlock data={phase1.skills} label="Skills" />
            <JsonBlock data={phase1.languages} label="Languages" />
            <JsonBlock data={phase1.applications} label="Applications" />
            <JsonBlock data={phase1.resume} label="Resume" />
            <JsonBlock data={phase1.cvAnalysis} label="CV analysis" />
            <JsonBlock data={phase1} label="All Phase 1 data" />
          </div>
        </section>

        <section className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-4">
          <h5 className="mb-3 text-sm font-bold uppercase tracking-wide text-emerald-900">
            Candidate common database
          </h5>
          {entry.commonDatabaseConfigured === false ? (
            <p className="text-sm text-amber-800">
              Common database URL is not configured on the server.
            </p>
          ) : entry.common ? (
            <>
              <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-slate-500">Email</dt>
                  <dd className="break-all font-medium text-slate-900">
                    {String(entry.common.email || "—")}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Phone</dt>
                  <dd className="font-medium text-slate-900">
                    {String(entry.common.phone || "—")}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Location</dt>
                  <dd className="font-medium text-slate-900">
                    {[entry.common.city, entry.common.country]
                      .filter(Boolean)
                      .join(", ") || String(entry.common.location || "—")}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Synced at</dt>
                  <dd className="font-medium text-slate-900">
                    {entry.common.syncedAt
                      ? new Date(String(entry.common.syncedAt)).toLocaleString()
                      : "—"}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-slate-500">Skills</dt>
                  <dd className="font-medium text-slate-900">
                    {Array.isArray(entry.common.skills)
                      ? (entry.common.skills as string[]).join(", ") || "—"
                      : "—"}
                  </dd>
                </div>
              </dl>
              <div className="mt-3">
                <JsonBlock data={entry.common} label="Full common database record" />
              </div>
            </>
          ) : (
            <p className="text-sm text-slate-600">
              No row in candidate common database for this candidate.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}

type JobRow = {
  id: string;
  title: string;
  company: string | null;
  companyId: string | null;
  /** When set, deleting removes the mirrored row from Phase 2 CRM */
  sourceTenantDbName?: string | null;
  location: string | null;
  openings: number;
  experienceLevel: string | null;
  employmentType: string | null;
  type?: string;
  workMode: string | null;
  industry: string | null;
  aboutRole: string | null;
  overview: string | null;
  description: string | null;
  keyResponsibilities: string[];
  education: string | null;
  benefits: string[];
  hiringManager: string | null;
  priority: string | null;
  visaSponsorship: boolean;
  postedAt: string | null;
  skills: string[];
  preferredSkills: string[];
  salary?: { amount?: string; currency?: string; min?: number; max?: number };
};

export default function SuperAdminPage() {
  const [activeTab, setActiveTab] = useState<"candidates" | "jobs">("candidates");

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [jobPage, setJobPage] = useState(1);
  const [jobTotalPages, setJobTotalPages] = useState(1);
  const [jobTotal, setJobTotal] = useState(0);

  const [selectedCandidate, setSelectedCandidate] = useState<CandidateDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<string>>(new Set());
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [deletingJobId, setDeletingJobId] = useState<string | null>(null);
  const [bulkDeletingCandidates, setBulkDeletingCandidates] = useState(false);
  const [bulkDeletingJobs, setBulkDeletingJobs] = useState(false);

  const [showDeletePreviewModal, setShowDeletePreviewModal] = useState(false);
  const [deletePreviewLoading, setDeletePreviewLoading] = useState(false);
  const [deletePreviewEntries, setDeletePreviewEntries] = useState<DeletePreviewEntry[]>([]);
  const [pendingDeleteIds, setPendingDeleteIds] = useState<string[]>([]);
  const [deletePreviewMode, setDeletePreviewMode] = useState<"single" | "bulk">("single");

  const candidateLimit = 50;
  const jobLimit = 100;

  const fetchCandidates = async (page: number = 1) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/candidates?page=${page}&limit=${candidateLimit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setCandidates(result.data.candidates);
          setTotalCount(result.data.pagination.total);
          setTotalPages(result.data.pagination.totalPages);
          setCurrentPage(result.data.pagination.page);
        }
      } else {
        console.error("Failed to fetch candidates");
      }
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = useCallback(async (page: number = 1) => {
    try {
      setJobsLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/jobs?page=${page}&limit=${jobLimit}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        }
      );

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setJobs(result.data.jobs ?? []);
          const p = result.data.pagination;
          if (p) {
            setJobTotal(p.total ?? 0);
            setJobTotalPages(p.totalPages ?? 1);
            setJobPage(p.page ?? page);
          }
        }
      } else {
        console.error("Failed to fetch jobs");
      }
    } catch (error) {
      console.error("Error fetching jobs:", error);
    } finally {
      setJobsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(1);
  }, []);

  useEffect(() => {
    setSelectedCandidateIds(new Set());
    setSelectedJobIds(new Set());
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === "jobs") {
      fetchJobs(jobPage);
    }
  }, [activeTab, jobPage, fetchJobs]);

  const fetchCandidateDetails = async (id: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/candidates/${id}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setSelectedCandidate(result.data);
          setShowDetailModal(true);
        }
      } else {
        alert("Failed to fetch candidate details");
      }
    } catch (error) {
      console.error("Error fetching candidate details:", error);
      alert("Error fetching candidate details");
    }
  };

  const openDeletePreview = async (ids: string[], mode: "single" | "bulk") => {
    if (ids.length === 0) return;
    try {
      setDeletePreviewLoading(true);
      setDeletePreviewMode(mode);
      setPendingDeleteIds(ids);
      setShowDeletePreviewModal(true);
      setDeletePreviewEntries([]);

      if (ids.length === 1) {
        const response = await fetch(
          `${API_BASE_URL}/candidates/${ids[0]}/delete-preview`,
          { method: "GET", headers: { "Content-Type": "application/json" } }
        );
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          alert(result.message || "Failed to load candidate data for delete");
          setShowDeletePreviewModal(false);
          return;
        }
        const row = candidates.find((c) => c.id === ids[0]);
        setDeletePreviewEntries([
          {
            candidateId: result.data.candidateId,
            label: row?.fullName || row?.email || ids[0],
            phase1: result.data.phase1,
            common: result.data.common,
            commonDatabaseConfigured: result.data.commonDatabaseConfigured,
          },
        ]);
      } else {
        const response = await fetch(`${API_BASE_URL}/candidates/delete-preview`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || !result.success) {
          alert(result.message || "Failed to load candidate data for delete");
          setShowDeletePreviewModal(false);
          return;
        }
        if (result.data.missingIds?.length) {
          console.warn("Missing candidates:", result.data.missingIds);
        }
        setDeletePreviewEntries(result.data.previews || []);
      }
    } catch (error) {
      console.error("Error loading delete preview:", error);
      alert("Error loading candidate data");
      setShowDeletePreviewModal(false);
    } finally {
      setDeletePreviewLoading(false);
    }
  };

  const closeDeletePreviewModal = () => {
    setShowDeletePreviewModal(false);
    setDeletePreviewEntries([]);
    setPendingDeleteIds([]);
  };

  const confirmDeleteFromPreview = async () => {
    const ids = pendingDeleteIds;
    if (ids.length === 0) return;

    try {
      if (deletePreviewMode === "single" && ids.length === 1) {
        setDeletingId(ids[0]);
        const response = await fetch(`${API_BASE_URL}/candidates/${ids[0]}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.success) {
          setCandidates((prev) => prev.filter((c) => c.id !== ids[0]));
          setTotalCount((c) => Math.max(0, c - 1));
          setSelectedCandidateIds((prev) => {
            const next = new Set(prev);
            next.delete(ids[0]);
            return next;
          });
          closeDeletePreviewModal();
          alert(
            result.message ||
              "Candidate permanently deleted from Phase 1 and common database"
          );
        } else {
          alert(result.message || "Failed to delete candidate");
        }
      } else {
        setBulkDeletingCandidates(true);
        const response = await fetch(`${API_BASE_URL}/candidates/bulk-delete`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        const result = await response.json().catch(() => ({}));
        if (response.ok && result.success) {
          setSelectedCandidateIds(new Set());
          closeDeletePreviewModal();
          await fetchCandidates(currentPage);
          alert(result.message || "Candidates deleted");
        } else {
          alert(result.message || "Bulk delete failed");
        }
      }
    } catch (error) {
      console.error("Error deleting candidate:", error);
      alert("Error deleting candidate");
    } finally {
      setDeletingId(null);
      setBulkDeletingCandidates(false);
    }
  };

  const toggleCandidateSelected = (id: string) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllCandidatesOnPage = () => {
    if (candidates.length === 0) return;
    const allSelected = candidates.every((c) => selectedCandidateIds.has(c.id));
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        candidates.forEach((c) => next.delete(c.id));
      } else {
        candidates.forEach((c) => next.add(c.id));
      }
      return next;
    });
  };

  const bulkDeleteCandidatesHandler = async () => {
    const ids = Array.from(selectedCandidateIds);
    if (ids.length === 0) {
      alert("Select at least one candidate.");
      return;
    }
    if (ids.length > 25) {
      alert("Select at most 25 candidates at a time for preview and delete.");
      return;
    }
    await openDeletePreview(ids, "bulk");
  };

  const toggleJobSelected = (id: string) => {
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllJobsOnPage = () => {
    if (jobs.length === 0) return;
    const allSelected = jobs.every((j) => selectedJobIds.has(j.id));
    setSelectedJobIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        jobs.forEach((j) => next.delete(j.id));
      } else {
        jobs.forEach((j) => next.add(j.id));
      }
      return next;
    });
  };

  const handleDeleteJob = async (jobId: string) => {
    if (
      !confirm(
        "Delete this job from the portal and Phase 2 CRM (when linked)? This cannot be undone."
      )
    ) {
      return;
    }
    try {
      setDeletingJobId(jobId);
      const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        setJobTotal((t) => Math.max(0, t - 1));
        setSelectedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(jobId);
          return next;
        });
        alert("Job deleted successfully");
      } else {
        alert(result.message || "Failed to delete job");
      }
    } catch (e) {
      console.error(e);
      alert("Error deleting job");
    } finally {
      setDeletingJobId(null);
    }
  };

  const bulkDeleteJobsHandler = async () => {
    const ids = Array.from(selectedJobIds);
    if (ids.length === 0) {
      alert("Select at least one job.");
      return;
    }
    if (
      !confirm(
        `Delete ${ids.length} job(s) from the portal and Phase 2 CRM (when linked)? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      setBulkDeletingJobs(true);
      const response = await fetch(`${API_BASE_URL}/jobs/bulk-delete`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const result = await response.json().catch(() => ({}));
      if (response.ok && result.success) {
        setSelectedJobIds(new Set());
        await fetchJobs(jobPage);
        alert(result.message || "Jobs deleted");
      } else {
        alert(result.message || "Bulk delete failed");
      }
    } catch (e) {
      console.error(e);
      alert("Bulk delete failed");
    } finally {
      setBulkDeletingJobs(false);
    }
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncate = (value: string | null | undefined, max: number) => {
    if (value == null || value === "") return "—";
    const s = String(value);
    return s.length <= max ? s : `${s.slice(0, max)}…`;
  };

  const formatSalary = (job: JobRow) => {
    const s = job.salary;
    if (s && typeof s === "object") {
      if (s.amount) return `${s.amount}${s.currency ? ` ${s.currency}` : ""}`;
      if (s.min != null || s.max != null)
        return [s.min, s.max].filter((x) => x != null).join(" – ");
    }
    return "—";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="mx-auto max-w-[1920px] px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Super admin
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Browse all candidates and jobs from the job portal database.
          </p>
          <div className="mt-4 flex gap-2 border-b border-transparent">
            <button
              type="button"
              onClick={() => setActiveTab("candidates")}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "candidates"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              Candidates
              {!loading && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {totalCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("jobs")}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                activeTab === "jobs"
                  ? "bg-slate-900 text-white"
                  : "bg-slate-200 text-slate-700 hover:bg-slate-300"
              }`}
            >
              Jobs
              {activeTab === "jobs" && !jobsLoading && (
                <span className="ml-2 rounded-full bg-white/20 px-2 py-0.5 text-xs">
                  {jobTotal}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1920px] px-4 py-6 sm:px-6 lg:px-8">
        {activeTab === "candidates" && (
          <section aria-label="Candidates table">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">
                Total:{" "}
                <span className="font-semibold text-slate-900">{totalCount}</span>{" "}
                candidates
                {selectedCandidateIds.size > 0 && (
                  <span className="ml-2 font-medium text-slate-800">
                    ({selectedCandidateIds.size} selected)
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={bulkDeleteCandidatesHandler}
                  disabled={
                    bulkDeletingCandidates || selectedCandidateIds.size === 0
                  }
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {bulkDeletingCandidates
                    ? "Deleting…"
                    : `Delete selected (${selectedCandidateIds.size})`}
                </button>
                <button
                  type="button"
                  onClick={() => fetchCandidates(currentPage)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <p className="text-slate-500">Loading candidates…</p>
              </div>
            ) : candidates.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
                No candidates found
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="sticky left-0 z-10 w-10 bg-slate-50 px-2 py-2">
                            <input
                              type="checkbox"
                              aria-label="Select all on this page"
                              checked={
                                candidates.length > 0 &&
                                candidates.every((c) =>
                                  selectedCandidateIds.has(c.id)
                                )
                              }
                              onChange={toggleAllCandidatesOnPage}
                              className="rounded border-slate-300"
                            />
                          </th>
                          <th className="bg-slate-50 px-3 py-2 pl-4 font-semibold text-slate-700">
                            ID
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Full name
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Email
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Phone
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            WhatsApp
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Country code
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Verified
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Created
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Updated
                          </th>
                          <th className="sticky right-0 z-10 bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {candidates.map((candidate) => (
                          <tr
                            key={candidate.id}
                            className="hover:bg-slate-50/80"
                          >
                            <td className="sticky left-0 z-0 w-10 bg-white px-2 py-2 shadow-[2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                              <input
                                type="checkbox"
                                aria-label={`Select ${candidate.fullName}`}
                                checked={selectedCandidateIds.has(candidate.id)}
                                onChange={() =>
                                  toggleCandidateSelected(candidate.id)
                                }
                                className="rounded border-slate-300"
                              />
                            </td>
                            <td
                              className="max-w-[140px] bg-white px-3 py-2 pl-4 font-mono text-xs text-slate-800"
                              title={candidate.id}
                            >
                              {truncate(candidate.id, 14)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 font-medium text-slate-900">
                              {candidate.fullName}
                            </td>
                            <td className="max-w-[220px] px-3 py-2 text-slate-700">
                              <span className="break-all" title={candidate.email}>
                                {candidate.email}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {candidate.phoneNumber || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {candidate.whatsappNumber || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {candidate.countryCode || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2">
                              {candidate.isVerified ? (
                                <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                  Yes
                                </span>
                              ) : (
                                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                                  No
                                </span>
                              )}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {formatDate(candidate.createdAt)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {formatDate(candidate.updatedAt)}
                            </td>
                            <td className="sticky right-0 z-0 bg-white px-3 py-2 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                              <div className="flex flex-wrap gap-2">
                                <button
                                  type="button"
                                  onClick={() => fetchCandidateDetails(candidate.id)}
                                  className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
                                >
                                  View
                                </button>
                                <button
                                  type="button"
                                  onClick={() => openDeletePreview([candidate.id], "single")}
                                  disabled={
                                    deletingId === candidate.id || deletePreviewLoading
                                  }
                                  className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                                >
                                  {deletingId === candidate.id ? "…" : "Delete"}
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {totalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Page {currentPage} of {totalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => fetchCandidates(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() => fetchCandidates(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {activeTab === "jobs" && (
          <section aria-label="Jobs table">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-600">
                Total:{" "}
                <span className="font-semibold text-slate-900">{jobTotal}</span>{" "}
                jobs
                {selectedJobIds.size > 0 && (
                  <span className="ml-2 font-medium text-slate-800">
                    ({selectedJobIds.size} selected)
                  </span>
                )}
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={bulkDeleteJobsHandler}
                  disabled={bulkDeletingJobs || selectedJobIds.size === 0}
                  className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {bulkDeletingJobs
                    ? "Deleting…"
                    : `Delete selected (${selectedJobIds.size})`}
                </button>
                <button
                  type="button"
                  onClick={() => fetchJobs(jobPage)}
                  className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
                >
                  Refresh
                </button>
              </div>
            </div>

            {jobsLoading ? (
              <div className="flex h-64 items-center justify-center rounded-lg border border-slate-200 bg-white">
                <p className="text-slate-500">Loading jobs…</p>
              </div>
            ) : jobs.length === 0 ? (
              <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-slate-500">
                No jobs found
              </div>
            ) : (
              <>
                <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="min-w-[1320px] w-full divide-y divide-slate-200 text-left text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="w-10 px-2 py-2">
                            <input
                              type="checkbox"
                              aria-label="Select all jobs on this page"
                              checked={
                                jobs.length > 0 &&
                                jobs.every((j) => selectedJobIds.has(j.id))
                              }
                              onChange={toggleAllJobsOnPage}
                              className="rounded border-slate-300"
                            />
                          </th>
                          <th className="bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                            Job ID
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Title
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Company
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Location
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Openings
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Type
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Work mode
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Experience
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Industry
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Salary
                          </th>
                          <th className="min-w-[200px] px-3 py-2 font-semibold text-slate-700">
                            Skills
                          </th>
                          <th className="min-w-[200px] px-3 py-2 font-semibold text-slate-700">
                            Preferred skills
                          </th>
                          <th className="min-w-[220px] px-3 py-2 font-semibold text-slate-700">
                            Overview
                          </th>
                          <th className="min-w-[220px] px-3 py-2 font-semibold text-slate-700">
                            Key responsibilities
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Benefits
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Hiring mgr
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Priority
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Visa
                          </th>
                          <th className="px-3 py-2 font-semibold text-slate-700">
                            Posted
                          </th>
                          <th className="min-w-[100px] px-3 py-2 font-semibold text-slate-700">
                            CRM tenant
                          </th>
                          <th className="sticky right-0 z-10 min-w-[120px] bg-slate-50 px-3 py-2 font-semibold text-slate-700">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {jobs.map((job) => (
                          <tr key={job.id} className="hover:bg-slate-50/80">
                            <td className="w-10 px-2 py-2">
                              <input
                                type="checkbox"
                                aria-label={`Select job ${job.title}`}
                                checked={selectedJobIds.has(job.id)}
                                onChange={() => toggleJobSelected(job.id)}
                                className="rounded border-slate-300"
                              />
                            </td>
                            <td
                              className="max-w-[120px] bg-white px-3 py-2 font-mono text-xs text-slate-800"
                              title={job.id}
                            >
                              {truncate(job.id, 12)}
                            </td>
                            <td className="max-w-[180px] px-3 py-2 font-medium text-slate-900">
                              <span title={job.title}>{truncate(job.title, 80)}</span>
                            </td>
                            <td className="max-w-[160px] px-3 py-2 text-slate-700">
                              {truncate(job.company, 40)}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {job.location || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {job.openings ?? "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {job.employmentType || job.type || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {job.workMode || "—"}
                            </td>
                            <td className="max-w-[120px] px-3 py-2 text-slate-600">
                              {truncate(job.experienceLevel, 24)}
                            </td>
                            <td className="max-w-[140px] px-3 py-2 text-slate-600">
                              {truncate(job.industry, 32)}
                            </td>
                            <td className="max-w-[140px] px-3 py-2 text-slate-600">
                              {formatSalary(job)}
                            </td>
                            <td className="max-w-[240px] px-3 py-2 text-xs text-slate-600">
                              <span
                                title={(job.skills || []).join(", ")}
                                className="line-clamp-3"
                              >
                                {(job.skills || []).join(", ") || "—"}
                              </span>
                            </td>
                            <td className="max-w-[240px] px-3 py-2 text-xs text-slate-600">
                              <span
                                title={(job.preferredSkills || []).join(", ")}
                                className="line-clamp-3"
                              >
                                {(job.preferredSkills || []).join(", ") || "—"}
                              </span>
                            </td>
                            <td className="max-w-[260px] px-3 py-2 text-xs text-slate-600">
                              <span
                                title={job.overview || job.aboutRole || ""}
                                className="line-clamp-4 whitespace-pre-wrap"
                              >
                                {truncate(
                                  job.overview || job.aboutRole || "",
                                  400
                                )}
                              </span>
                            </td>
                            <td className="max-w-[260px] px-3 py-2 text-xs text-slate-600">
                              <span
                                title={(job.keyResponsibilities || []).join(
                                  "; "
                                )}
                                className="line-clamp-4"
                              >
                                {(job.keyResponsibilities || []).join("; ") ||
                                  "—"}
                              </span>
                            </td>
                            <td className="max-w-[180px] px-3 py-2 text-xs text-slate-600">
                              <span
                                title={(job.benefits || []).join(", ")}
                                className="line-clamp-3"
                              >
                                {(job.benefits || []).join(", ") || "—"}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {job.hiringManager || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {job.priority || "—"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {job.visaSponsorship ? "Yes" : "No"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-2 text-slate-600">
                              {formatDate(job.postedAt)}
                            </td>
                            <td
                              className="max-w-[120px] px-3 py-2 font-mono text-xs text-slate-600"
                              title={job.sourceTenantDbName || ""}
                            >
                              {job.sourceTenantDbName
                                ? truncate(job.sourceTenantDbName, 16)
                                : "—"}
                            </td>
                            <td className="sticky right-0 z-0 bg-white px-3 py-2 shadow-[-2px_0_4px_-2px_rgba(0,0,0,0.06)]">
                              <button
                                type="button"
                                onClick={() => handleDeleteJob(job.id)}
                                disabled={deletingJobId === job.id}
                                className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                              >
                                {deletingJobId === job.id ? "…" : "Delete"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {jobTotalPages > 1 && (
                  <div className="mt-4 flex items-center justify-between">
                    <p className="text-sm text-slate-600">
                      Page {jobPage} of {jobTotalPages}
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setJobPage((p) => Math.max(1, p - 1))}
                        disabled={jobPage === 1}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
                      >
                        Previous
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setJobPage((p) => Math.min(jobTotalPages, p + 1))
                        }
                        disabled={jobPage === jobTotalPages}
                        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm disabled:opacity-50"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        )}
      </main>

      {showDeletePreviewModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="flex max-h-[92vh] w-full max-w-6xl flex-col rounded-lg bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-slate-200 px-6 py-4">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  Review before delete
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  Full Phase 1 and candidate common database data. Confirming will
                  permanently hard-delete the candidate, all related records, resume
                  files, and the common database row. This cannot be undone.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeletePreviewModal}
                className="text-2xl text-slate-500 hover:text-slate-800"
              >
                ×
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-4">
              {deletePreviewLoading ? (
                <p className="py-12 text-center text-slate-500">
                  Loading candidate data from Phase 1 and common database…
                </p>
              ) : deletePreviewEntries.length === 0 ? (
                <p className="py-12 text-center text-slate-500">
                  No preview data available.
                </p>
              ) : (
                deletePreviewEntries.map((entry) => (
                  <DeletePreviewPanel key={entry.candidateId} entry={entry} />
                ))
              )}
            </div>

            <div className="flex shrink-0 flex-wrap justify-end gap-3 border-t border-slate-200 px-6 py-4">
              <button
                type="button"
                onClick={closeDeletePreviewModal}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteFromPreview}
                disabled={
                  deletePreviewLoading ||
                  deletePreviewEntries.length === 0 ||
                  bulkDeletingCandidates ||
                  Boolean(deletingId)
                }
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {bulkDeletingCandidates || deletingId
                  ? "Deleting…"
                  : deletePreviewMode === "bulk"
                    ? `Permanently delete ${pendingDeleteIds.length} candidate(s)`
                    : "Permanently delete candidate"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDetailModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <h3 className="text-xl font-bold text-gray-800">
                Candidate details
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowDetailModal(false);
                  setSelectedCandidate(null);
                }}
                className="text-2xl text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="p-6">
              {selectedCandidate.summary && (
                <div className="mb-6">
                  <h4 className="mb-2 text-lg font-semibold text-gray-800 underline decoration-blue-200">
                    Executive summary
                  </h4>
                  <p className="rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm italic leading-relaxed text-gray-700">
                    &ldquo;{selectedCandidate.summary.summaryText}&rdquo;
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <div>
                  {selectedCandidate.personalInformation && (
                    <div className="mb-8 rounded-2xl border border-blue-100 bg-blue-50/30 p-5">
                      <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-blue-800">
                        Personal profile
                      </h4>
                      <div className="space-y-3 text-[13px]">
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">Full name</span>
                          <span className="font-semibold text-gray-900">
                            {selectedCandidate.personalInformation.fullName ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">Email</span>
                          <span className="font-medium text-gray-900">
                            {selectedCandidate.personalInformation.email ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">WhatsApp</span>
                          <span className="font-medium text-gray-900">
                            ({selectedCandidate.countryCode}){" "}
                            {selectedCandidate.whatsappNumber || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">Gender</span>
                          <span className="text-gray-900">
                            {selectedCandidate.personalInformation.gender ||
                              "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between border-b border-blue-100/50 pb-1.5">
                          <span className="text-gray-500">DOB</span>
                          <span className="text-gray-900">
                            {formatDate(
                              selectedCandidate.personalInformation
                                .dateOfBirth
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Location</span>
                          <span className="text-gray-900">
                            {selectedCandidate.personalInformation.city},{" "}
                            {selectedCandidate.personalInformation.country}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedCandidate.education &&
                    selectedCandidate.education.length > 0 && (
                      <div className="mb-8">
                        <h4 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
                          Education
                        </h4>
                        <div className="space-y-4">
                          {selectedCandidate.education.map(
                            (edu: any, index: number) => (
                              <div
                                key={index}
                                className="relative border-l-2 border-blue-200 pl-6"
                              >
                                <div className="absolute -left-[5px] top-1.5 h-2 w-2 rounded-full bg-blue-500" />
                                <div className="text-sm font-bold text-gray-900">
                                  {edu.degree}
                                </div>
                                <div className="text-xs font-semibold text-blue-600">
                                  {edu.institution}
                                </div>
                                <div className="mt-1 text-[11px] text-gray-500">
                                  {edu.startYear} - {edu.endYear || "Present"} |{" "}
                                  {edu.specialization}
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {selectedCandidate.skills &&
                    selectedCandidate.skills.length > 0 && (
                      <div className="mb-8">
                        <h4 className="mb-4 text-lg font-bold text-gray-800">
                          Core skills
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedCandidate.skills.map(
                            (skill: any, index: number) => (
                              <span
                                key={index}
                                className="rounded-lg border border-slate-200 bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700"
                              >
                                {skill.skillName}{" "}
                                <span className="font-normal text-slate-400">
                                  ({skill.proficiency})
                                </span>
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                <div>
                  {selectedCandidate.workExperience &&
                    selectedCandidate.workExperience.length > 0 && (
                      <div className="mb-8">
                        <h4 className="mb-4 text-lg font-bold text-gray-800">
                          Work history
                        </h4>
                        <div className="space-y-5">
                          {selectedCandidate.workExperience.map(
                            (exp: any, index: number) => (
                              <div
                                key={index}
                                className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                              >
                                <div className="mb-1 flex items-start justify-between">
                                  <div className="font-bold text-gray-900">
                                    {exp.jobTitle}
                                  </div>
                                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-tighter text-emerald-600">
                                    {exp.employmentType}
                                  </span>
                                </div>
                                <div className="mb-2 text-xs font-bold text-slate-500">
                                  {exp.company} • {exp.workLocation}
                                </div>
                                <div className="mb-3 text-[11px] font-medium text-gray-400">
                                  {formatDate(exp.startDate)} —{" "}
                                  {exp.endDate
                                    ? formatDate(exp.endDate)
                                    : "Present"}
                                </div>
                                {exp.responsibilities && (
                                  <p className="line-clamp-3 text-[13px] leading-relaxed text-gray-600">
                                    {exp.responsibilities}
                                  </p>
                                )}
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}

                  {selectedCandidate.careerPreferences && (
                    <div className="mb-8 rounded-2xl border border-violet-100 bg-violet-50/50 p-5">
                      <h4 className="mb-4 text-sm font-bold uppercase tracking-widest text-violet-800">
                        Future preferences
                      </h4>
                      <div className="space-y-3 text-[13px]">
                        <div className="flex flex-col gap-1 border-b border-violet-100/50 pb-2">
                          <span className="text-[10px] font-bold uppercase text-violet-400">
                            Roles
                          </span>
                          <span className="font-semibold text-gray-900">
                            {(selectedCandidate.careerPreferences
                              .preferredRoles || []
                            ).join(", ") || "N/A"}
                          </span>
                        </div>
                        <div className="flex flex-col gap-1 border-b border-violet-100/50 pb-2">
                          <span className="text-[10px] font-bold uppercase text-violet-400">
                            Locations
                          </span>
                          <span className="font-medium text-gray-900">
                            {(selectedCandidate.careerPreferences
                              .preferredLocations || []
                            ).join(", ") || "N/A"}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1">
                          <span className="font-bold text-violet-500">
                            Expectation
                          </span>
                          <span className="font-black text-gray-900">
                            {selectedCandidate.careerPreferences.preferredSalary}{" "}
                            {
                              selectedCandidate.careerPreferences
                                .preferredCurrency
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-6 border-t border-gray-100 pt-8 md:grid-cols-3">
                <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 text-center">
                  <div className="mb-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                    CV score
                  </div>
                  <div className="text-4xl font-black text-blue-600">
                    {selectedCandidate.cvAnalysis?.cvScore || "0"}%
                  </div>
                  <div className="mt-2 text-[11px] font-bold text-slate-500">
                    ATS: {selectedCandidate.cvAnalysis?.atsScore || "N/A"}%
                  </div>
                </div>

                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/30 p-5 md:col-span-2">
                  <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">
                    AI suggestions
                  </h4>
                  <div className="text-sm italic leading-normal text-gray-600">
                    {Array.isArray(selectedCandidate.cvAnalysis?.suggestions)
                      ? selectedCandidate.cvAnalysis.suggestions
                          .slice(0, 3)
                          .map((s: string, i: number) => (
                            <p key={i} className="mb-1">
                              • {s}
                            </p>
                          ))
                      : typeof selectedCandidate.cvAnalysis?.suggestions ===
                          "string"
                        ? selectedCandidate.cvAnalysis.suggestions.substring(
                            0,
                            200
                          ) +
                          (selectedCandidate.cvAnalysis.suggestions.length >
                          200
                            ? "..."
                            : "")
                        : "No AI insights yet."}
                  </div>
                </div>
              </div>

              {selectedCandidate.languages &&
                selectedCandidate.languages.length > 0 && (
                  <div className="mt-8 border-t pt-6">
                    <h4 className="mb-4 text-sm font-bold uppercase tracking-tighter text-gray-800">
                      Languages
                    </h4>
                    <div className="flex flex-wrap gap-4">
                      {selectedCandidate.languages.map(
                        (lang: any, index: number) => (
                          <div key={index} className="flex flex-col">
                            <span className="text-sm font-bold text-slate-900">
                              {lang.name}
                            </span>
                            <span className="text-[11px] font-bold uppercase text-slate-400">
                              {lang.proficiency}
                            </span>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
