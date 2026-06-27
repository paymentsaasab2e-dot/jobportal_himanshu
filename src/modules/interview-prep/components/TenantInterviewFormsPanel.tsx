'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ArrowRight, Building2, Calendar, CheckCircle2, ClipboardList } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { getStoredToken } from '@/lib/auth-storage';
import {
  fetchPublishedInterviewForms,
  type InterviewFormMyApplication,
  type PublishedInterviewForm,
} from '@/lib/phase2-interview-forms-api';
import {
  mergeLocalInterviewApplications,
  readCachedPublishedForms,
  saveCachedPublishedForms,
  saveLocalInterviewApplication,
} from '../lib/interviewFormApplicationStorage';
import { resolveApplicantContactHints } from '../lib/resolveApplicantContact';
import { InterviewApplicationApplyModal } from './InterviewApplicationApplyModal';

type Props = {
  tenantDbName?: string;
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: 'Submitted',
  PENDING_REVIEW: 'Pending review',
  IN_INTERVIEW: 'In interview',
  INTERVIEW_COMPLETED: 'Interview completed',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

function formatStatusLabel(status?: string) {
  const key = String(status || '').toUpperCase();
  return STATUS_LABELS[key] || 'Applied';
}

function formatAgencyLabel(form: PublishedInterviewForm) {
  return (
    form.tenantAgencyName?.trim() ||
    form.tenantDbName?.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
    'Hiring agency'
  );
}

function formatPublishedDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusButtonClass(status: string) {
  const key = status.toUpperCase();
  if (key === 'APPROVED') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (key === 'REJECTED') return 'border-rose-200 bg-rose-50 text-rose-800';
  if (key === 'IN_INTERVIEW' || key === 'INTERVIEW_COMPLETED') {
    return 'border-indigo-200 bg-indigo-50 text-indigo-800';
  }
  return 'border-amber-200 bg-amber-50 text-amber-900';
}

function ApplicationStageButton({ application }: { application: InterviewFormMyApplication }) {
  return (
    <div className="mt-4 space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Application status</p>
      <div
        className={`inline-flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold ${statusButtonClass(application.status)}`}
        aria-live="polite"
      >
        <CheckCircle2 size={15} className="shrink-0" />
        <span>{application.statusLabel || formatStatusLabel(application.status)}</span>
      </div>
      <p className="text-center text-[11px] text-gray-500">Synced from Phase 2 — re-apply disabled</p>
    </div>
  );
}

type FormsTab = 'all' | 'applied';

function FormCard({
  form,
  onApply,
}: {
  form: PublishedInterviewForm;
  onApply: (form: PublishedInterviewForm) => void;
}) {
  const agencyName = formatAgencyLabel(form);
  const publishedLabel = formatPublishedDate(form.publishedAt);
  const alreadyApplied = Boolean(form.myApplication);

  return (
    <article
      className="group flex flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition hover:border-[#28A8E1]/35 hover:shadow-md"
    >
      <div className="border-b border-sky-50 bg-gradient-to-r from-sky-50/90 to-white px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#28A8E1]/10 text-[#28A8E1] ring-1 ring-[#28A8E1]/15">
            <Building2 size={16} />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#28A8E1]">Hiring agency</p>
            <p className="truncate text-sm font-bold text-gray-900">{agencyName}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-base font-bold text-gray-900 group-hover:text-[#1e8fc4]">{form.title}</h3>
        {form.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-gray-600">{form.description}</p>
        ) : (
          <p className="mt-1.5 text-sm text-gray-400">Interview application form</p>
        )}

        {publishedLabel ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500">
            <Calendar size={12} className="text-gray-400" />
            Published {publishedLabel}
          </p>
        ) : null}

        {alreadyApplied && form.myApplication ? (
          <ApplicationStageButton application={form.myApplication} />
        ) : (
          <button
            type="button"
            onClick={() => onApply(form)}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#28A8E1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Apply now
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </article>
  );
}

function FormsTabBar({
  activeTab,
  allCount,
  appliedCount,
  onChange,
}: {
  activeTab: FormsTab;
  allCount: number;
  appliedCount: number;
  onChange: (tab: FormsTab) => void;
}) {
  const tabs: { id: FormsTab; label: string; count: number }[] = [
    { id: 'all', label: 'All forms', count: allCount },
    { id: 'applied', label: 'My applications', count: appliedCount },
  ];

  return (
    <div
      role="tablist"
      aria-label="Interview form views"
      className="inline-flex w-full max-w-md rounded-xl border border-gray-200 bg-white p-1 shadow-sm sm:w-auto"
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-initial sm:px-5 ${
              active
                ? 'bg-[#28A8E1] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            {tab.label}
            <span
              className={`inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[11px] font-bold ${
                active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function mergeFormsWithStatus(rows: PublishedInterviewForm[]) {
  return mergeLocalInterviewApplications(Array.isArray(rows) ? rows : []).map((form) => {
    if (!form.myApplication) return form;
    const snapshot = {
      ...form.myApplication,
      statusLabel: form.myApplication.statusLabel || formatStatusLabel(form.myApplication.status),
    };
    saveLocalInterviewApplication(form, snapshot);
    return { ...form, myApplication: snapshot };
  });
}

export function TenantInterviewFormsPanel({ tenantDbName }: Props) {
  const { user, isLoading: authLoading } = useAuth();
  const userRef = useRef(user);
  userRef.current = user;

  const [forms, setForms] = useState<PublishedInterviewForm[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeForm, setActiveForm] = useState<PublishedInterviewForm | null>(null);
  const [activeTab, setActiveTab] = useState<FormsTab>('all');
  const loadSeqRef = useRef(0);
  const hasLoadedOnceRef = useRef(false);

  useLayoutEffect(() => {
    const cached = readCachedPublishedForms();
    if (!cached.length) return;
    setForms(cached);
    setLoading(false);
    hasLoadedOnceRef.current = true;
  }, []);

  const load = useCallback(
    async (silent = false) => {
      if (!getStoredToken()) {
        setLoading(false);
        return;
      }

      const showBlockingLoader = !silent && !hasLoadedOnceRef.current;
      if (showBlockingLoader) {
        setLoading(true);
      }

      const seq = ++loadSeqRef.current;
      if (!silent) setError('');

      try {
        const hints = await resolveApplicantContactHints(userRef.current);
        const rows = await fetchPublishedInterviewForms({
          tenantDbName,
          applicantEmail: hints.email,
          applicantPhones: hints.phones,
          phase1CandidateId: hints.phase1CandidateId,
          applicantFirstName: hints.firstName,
          applicantLastName: hints.lastName,
        });

        if (seq !== loadSeqRef.current) return;

        const merged = mergeFormsWithStatus(rows);
        saveCachedPublishedForms(merged);
        hasLoadedOnceRef.current = true;
        setForms(merged);
        setError('');
      } catch (err: unknown) {
        if (seq !== loadSeqRef.current) return;
        const message = err instanceof Error ? err.message : 'Unable to load interview forms';
        if (!silent && !hasLoadedOnceRef.current) {
          setError(message);
          setForms([]);
        }
      } finally {
        if (seq === loadSeqRef.current && showBlockingLoader) {
          setLoading(false);
        }
      }
    },
    [tenantDbName],
  );

  useEffect(() => {
    if (authLoading) return;
    void load(hasLoadedOnceRef.current);
  }, [load, authLoading]);

  useEffect(() => {
    const onFocus = () => {
      if (!authLoading && getStoredToken()) void load(true);
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load, authLoading]);

  const handleApplicationSubmitted = useCallback(
    (form: PublishedInterviewForm, result: { applicationId: string; status?: string; message?: string }) => {
      const status = result.status || 'PENDING_REVIEW';
      const snapshot: InterviewFormMyApplication = {
        applicationId: result.applicationId,
        status,
        statusLabel: formatStatusLabel(status),
        appliedAt: new Date().toISOString(),
      };
      saveLocalInterviewApplication(form, snapshot);
      setForms((prev) => {
        const next = prev.map((row) =>
          row.id === form.id && row.tenantDbName === form.tenantDbName
            ? { ...row, myApplication: snapshot }
            : row,
        );
        saveCachedPublishedForms(next);
        return next;
      });
      setActiveTab('applied');
      void load(true);
    },
    [load],
  );

  const appliedForms = useMemo(
    () => forms.filter((form) => Boolean(form.myApplication)),
    [forms],
  );
  const availableForms = useMemo(
    () => forms.filter((form) => !form.myApplication),
    [forms],
  );
  const visibleForms = activeTab === 'applied' ? appliedForms : availableForms;
  const showEmptyState = !loading && !error && !forms.length;
  const showTabEmptyState = !loading && !error && forms.length > 0 && !visibleForms.length;

  return (
    <>
      <section className="rounded-2xl border border-[#28A8E1]/20 bg-gradient-to-br from-white to-sky-50/40 p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wide text-[#28A8E1]">
              Tenant interview applications
            </p>
            <h2 className="mt-1 text-lg font-bold text-gray-900">Apply to employer interview forms</h2>
            <p className="mt-1 max-w-2xl text-sm text-gray-600">
              Select a published form from a hiring tenant, complete your details, and submit your
              application for interview review.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-sm ring-1 ring-gray-100">
            <Building2 size={14} className="text-[#28A8E1]" />
            Phase 1 → Phase 2 flow
          </div>
        </div>

        {!loading && !error && forms.length > 0 ? (
          <div className="mt-4">
            <FormsTabBar
              activeTab={activeTab}
              allCount={availableForms.length}
              appliedCount={appliedForms.length}
              onChange={setActiveTab}
            />
          </div>
        ) : null}

        <div className="mt-4">
          {loading ? (
            <p className="text-sm text-gray-500">Loading available forms…</p>
          ) : error ? (
            <p className="text-sm text-rose-600">{error}</p>
          ) : showEmptyState ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-8 text-center">
              <ClipboardList className="mx-auto text-gray-300" size={28} />
              <p className="mt-2 text-sm font-semibold text-gray-800">No published interview forms yet</p>
              <p className="mt-1 text-xs text-gray-500">
                When employers publish forms in Phase 2, they will appear here for you to apply.
              </p>
            </div>
          ) : showTabEmptyState ? (
            <div className="rounded-xl border border-dashed border-gray-200 bg-white/80 px-4 py-8 text-center">
              {activeTab === 'applied' ? (
                <>
                  <CheckCircle2 className="mx-auto text-gray-300" size={28} />
                  <p className="mt-2 text-sm font-semibold text-gray-800">No applications yet</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Forms you apply to will appear here with your current interview status.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#28A8E1] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                  >
                    Browse all forms
                    <ArrowRight size={14} />
                  </button>
                </>
              ) : (
                <>
                  <ClipboardList className="mx-auto text-gray-300" size={28} />
                  <p className="mt-2 text-sm font-semibold text-gray-800">No new forms to apply</p>
                  <p className="mt-1 text-xs text-gray-500">
                    You have applied to all published interview forms. Check your application status
                    in My applications.
                  </p>
                  {appliedForms.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setActiveTab('applied')}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#28A8E1] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                    >
                      View my applications
                      <ArrowRight size={14} />
                    </button>
                  ) : null}
                </>
              )}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleForms.map((form) => (
                <FormCard key={`${form.tenantDbName || 'default'}:${form.id}`} form={form} onApply={setActiveForm} />
              ))}
            </div>
          )}
        </div>
      </section>

      <InterviewApplicationApplyModal
        open={Boolean(activeForm)}
        form={activeForm}
        tenantDbName={tenantDbName}
        onClose={() => setActiveForm(null)}
        onApplicationSubmitted={handleApplicationSubmitted}
      />
    </>
  );
}
