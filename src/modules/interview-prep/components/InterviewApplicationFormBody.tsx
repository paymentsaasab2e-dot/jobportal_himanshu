'use client';

import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import {
  fetchInterviewFormPage,
  submitInterviewFormApplication,
  type InterviewFormPageData,
} from '@/lib/phase2-interview-forms-api';
import { getStoredCandidateId } from '@/lib/auth-storage';
import { saveApplicantContactFromAnswers } from '../lib/resolveApplicantContact';

export type FormField = {
  id: string;
  type: string;
  label: string;
  required?: boolean;
  placeholder?: string;
  options?: string[];
};

type Props = {
  token: string;
  tenantDbName?: string;
  onSubmitted?: (result: { applicationId: string; message: string; status?: string }) => void;
  onCloseAfterSubmit?: () => void;
  compact?: boolean;
};

export function InterviewApplicationFormBody({
  token,
  tenantDbName,
  onSubmitted,
  onCloseAfterSubmit,
  compact = false,
}: Props) {
  const [page, setPage] = useState<InterviewFormPageData | null>(null);
  const [loading, setLoading] = useState(Boolean(token));
  const [error, setError] = useState(token ? '' : 'Invalid form link');
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [files, setFiles] = useState<Record<string, File>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState<{ applicationId: string; message: string } | null>(
    null,
  );

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setSubmitted(null);
    setAnswers({});
    setFiles({});
    void fetchInterviewFormPage(token, tenantDbName || undefined)
      .then((data) => {
        if (cancelled) return;
        setPage(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load interview form');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [tenantDbName, token]);

  const fields = useMemo(() => {
    const raw = page?.formSchema?.fields;
    return Array.isArray(raw) ? (raw as FormField[]) : [];
  }, [page?.formSchema?.fields]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !page) return;
    setError('');
    for (const field of fields) {
      if (field.type === 'section_title' || !field.required) continue;
      if (field.type === 'resume' || field.type === 'photo') {
        if (!files[field.id]) {
          setError(`${field.label} is required`);
          return;
        }
        continue;
      }
      const val = answers[field.id];
      if (val == null || String(val).trim() === '') {
        setError(`${field.label} is required`);
        return;
      }
    }
    setSubmitting(true);
    try {
      saveApplicantContactFromAnswers(answers, fields);
      const result = await submitInterviewFormApplication(
        token,
        {
          answers,
          files,
          phase1CandidateId: getStoredCandidateId() || undefined,
        },
        tenantDbName || page.tenantDbName || undefined,
      );
      const payload = {
        applicationId: result.applicationId,
        message: result.message || 'Application submitted',
        status: result.status,
      };
      setSubmitted(payload);
      onSubmitted?.(payload);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Submission failed';
      if (message.toLowerCase().includes('already applied')) {
        setError('You have already applied to this form. Check the card for your current stage.');
      } else {
        setError(message);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    'mt-1.5 w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 shadow-sm transition focus:border-[#28A8E1] focus:outline-none focus:ring-4 focus:ring-[#28A8E1]/15';

  if (submitted) {
    return (
      <div className={`text-center ${compact ? 'py-6' : 'py-10'}`}>
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-4 ring-emerald-100">
          <CheckCircle2 size={28} />
        </div>
        <h3 className="mt-4 text-lg font-bold text-gray-900">Application submitted</h3>
        <p className="mt-2 text-sm text-gray-600">{submitted.message}</p>
        <p className="mt-1 text-xs text-gray-500">
          ID: <span className="font-mono">{submitted.applicationId}</span>
        </p>
        <p className="mt-3 text-sm font-medium text-[#28A8E1]">
          Waiting for interview review
        </p>
        {onCloseAfterSubmit ? (
          <button
            type="button"
            onClick={onCloseAfterSubmit}
            className="mt-6 rounded-xl bg-[#28A8E1] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
          >
            Done
          </button>
        ) : null}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-14 text-gray-500">
        <Loader2 className="h-8 w-8 animate-spin text-[#28A8E1]" />
        <p className="text-sm font-medium">Loading application form…</p>
      </div>
    );
  }

  if (error && !page) {
    return (
      <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-6 text-center">
        <p className="text-sm font-semibold text-rose-700">{error}</p>
      </div>
    );
  }

  if (!page) return null;

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
      {fields.map((field) => {
        if (field.type === 'section_title') {
          return (
            <h3
              key={field.id}
              className="border-b border-gray-100 pb-2 pt-1 text-xs font-bold uppercase tracking-wide text-gray-500"
            >
              {field.label}
            </h3>
          );
        }

        const commonLabel = (
          <label className="block text-sm font-semibold text-gray-800">
            {field.label}
            {field.required ? <span className="text-rose-500"> *</span> : null}
          </label>
        );

        if (field.type === 'long_text') {
          return (
            <div key={field.id}>
              {commonLabel}
              <textarea
                rows={4}
                className={`${inputClass} resize-y min-h-[96px]`}
                placeholder={field.placeholder || 'Your answer'}
                value={String(answers[field.id] ?? '')}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
              />
            </div>
          );
        }

        if (field.type === 'single_choice' && field.options?.length) {
          return (
            <div key={field.id}>
              {commonLabel}
              <div className="mt-2 space-y-2">
                {field.options.map((opt) => (
                  <label
                    key={opt}
                    className="flex cursor-pointer items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/60 px-3 py-2.5 text-sm transition hover:border-[#28A8E1]/40 hover:bg-sky-50/50"
                  >
                    <input
                      type="radio"
                      name={field.id}
                      value={opt}
                      checked={String(answers[field.id] ?? '') === opt}
                      onChange={(e) =>
                        setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))
                      }
                      className="h-4 w-4 border-gray-300 text-[#28A8E1] focus:ring-[#28A8E1]"
                    />
                    <span className="text-gray-800">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        }

        if (field.type === 'resume' || field.type === 'photo') {
          return (
            <div key={field.id}>
              {commonLabel}
              <label className="mt-1.5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-4 py-6 text-center transition hover:border-[#28A8E1]/40 hover:bg-sky-50/40">
                <span className="text-sm font-medium text-gray-700">
                  {files[field.id]?.name || 'Click to upload'}
                </span>
                <span className="mt-1 text-xs text-gray-500">
                  {field.type === 'photo' ? 'PNG, JPG up to 10MB' : 'PDF or Word document'}
                </span>
                <input
                  type="file"
                  accept={field.type === 'photo' ? 'image/*' : '.pdf,.doc,.docx'}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setFiles((prev) => ({ ...prev, [field.id]: file }));
                  }}
                />
              </label>
            </div>
          );
        }

        return (
          <div key={field.id}>
            {commonLabel}
            <input
              type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : 'text'}
              className={inputClass}
              placeholder={field.placeholder}
              value={String(answers[field.id] ?? '')}
              onChange={(e) => setAnswers((prev) => ({ ...prev, [field.id]: e.target.value }))}
            />
          </div>
        );
      })}

      {error ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-xl bg-gradient-to-r from-[#28A8E1] to-[#1e8fc4] px-5 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200/60 transition hover:opacity-95 disabled:opacity-60"
      >
        {submitting ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}
