'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ClipboardList, X } from 'lucide-react';
import type { PublishedInterviewForm } from '@/lib/phase2-interview-forms-api';
import { InterviewApplicationFormBody } from './InterviewApplicationFormBody';

type Props = {
  open: boolean;
  form: PublishedInterviewForm | null;
  tenantDbName?: string;
  onClose: () => void;
  onApplicationSubmitted?: (
    form: PublishedInterviewForm,
    result: { applicationId: string; status?: string; message?: string },
  ) => void;
};

export function InterviewApplicationApplyModal({
  open,
  form,
  tenantDbName,
  onClose,
  onApplicationSubmitted,
}: Props) {
  const resolvedTenant = tenantDbName || form?.tenantDbName || '';

  useEffect(() => {
    if (!open || typeof document === 'undefined') return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !form || typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 sm:p-6">
      <button
        type="button"
        aria-label="Close application form"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="interview-apply-modal-title"
        className="relative flex max-h-[min(92vh,820px)] w-full max-w-2xl flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-2xl shadow-slate-900/20"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-sky-100 bg-gradient-to-br from-[#28A8E1] via-[#2eb5ea] to-[#1a8fbf] px-6 py-6 text-white sm:px-8">
          <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-12 left-8 h-32 w-32 rounded-full bg-cyan-300/20 blur-2xl" />

          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white/95 ring-1 ring-white/20">
                <Building2 size={12} />
                {form.tenantAgencyName?.trim() ||
                  form.tenantDbName?.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) ||
                  'Hiring agency'}
              </div>
              <h2 id="interview-apply-modal-title" className="text-xl font-bold leading-tight sm:text-2xl">
                {form.title}
              </h2>
              {form.description ? (
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-white/90">{form.description}</p>
              ) : (
                <p className="mt-2 text-sm text-white/80">
                  Complete the fields below to submit your application for review.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl bg-white/15 p-2 text-white transition hover:bg-white/25 focus:outline-none focus:ring-4 focus:ring-white/30"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/70 px-4 py-3">
            <ClipboardList className="mt-0.5 shrink-0 text-[#28A8E1]" size={18} />
            <p className="text-xs leading-relaxed text-gray-600 sm:text-sm">
              Your responses are sent to the hiring team in Phase 2. Required fields are marked with{' '}
              <span className="font-semibold text-rose-500">*</span>.
            </p>
          </div>

          <InterviewApplicationFormBody
            key={`${form.publicToken}-${resolvedTenant}`}
            token={form.publicToken}
            tenantDbName={resolvedTenant || undefined}
            compact
            onCloseAfterSubmit={onClose}
            onSubmitted={(result) => {
              onApplicationSubmitted?.(form, result);
            }}
          />
        </div>
      </div>
    </div>,
    document.body,
  );
}
