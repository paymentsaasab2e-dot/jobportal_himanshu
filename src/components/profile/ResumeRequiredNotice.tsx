'use client';

import { useEffect, useState } from 'react';
import { FileUp, X } from 'lucide-react';

const DISMISS_KEY = 'saasa:resume-required-dialog-dismissed';

type Props = {
  /** True when the signed-in account has no stored CV. */
  visible: boolean;
  onUpload: () => void;
  title: string;
  body: string;
  hint: string;
  actionLabel: string;
  laterLabel: string;
};

/**
 * Shown after login when the account exists but profile data is missing
 * because no CV was stored. Banner stays; dialog appears once per browser session.
 */
export function ResumeRequiredNotice({
  visible,
  onUpload,
  title,
  body,
  hint,
  actionLabel,
  laterLabel,
}: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!visible) {
      setConfirmed(false);
      setDialogOpen(false);
      return;
    }
    // Wait until profile data has settled. A just-finished login often
    // looks like "no CV" for a moment, then the saved resume arrives.
    const timer = window.setTimeout(() => setConfirmed(true), 2500);
    return () => window.clearTimeout(timer);
  }, [visible]);

  useEffect(() => {
    if (!confirmed || typeof window === 'undefined') {
      setDialogOpen(false);
      return;
    }
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return;
    setDialogOpen(true);
  }, [confirmed]);

  if (!confirmed) return null;

  const dismissDialog = () => {
    sessionStorage.setItem(DISMISS_KEY, '1');
    setDialogOpen(false);
  };

  return (
    <>
      <section className="rounded-2xl border border-sky-200 bg-white px-5 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
              <FileUp className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight text-slate-900">{title}</p>
              <p className="mt-1 text-[13px] leading-snug text-slate-600">{body}</p>
              <p className="mt-1 text-[12px] leading-snug text-slate-500">{hint}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onUpload}
            className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-[#0b3d91] px-5 text-[13px] font-semibold text-white hover:bg-[#082f70]"
          >
            {actionLabel}
          </button>
        </div>
      </section>

      {dialogOpen ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="resume-required-title"
        >
          <div className="w-full max-w-[440px] rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
                <FileUp className="h-5 w-5" aria-hidden />
              </div>
              <button
                type="button"
                onClick={dismissDialog}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                aria-label={laterLabel}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <h2 id="resume-required-title" className="text-[18px] font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-slate-600">{body}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-500">{hint}</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={dismissDialog}
                className="h-11 rounded-full border border-slate-200 px-4 text-[13px] font-semibold text-slate-700 hover:bg-slate-50"
              >
                {laterLabel}
              </button>
              <button
                type="button"
                onClick={onUpload}
                className="h-11 rounded-full bg-[#0b3d91] px-5 text-[13px] font-semibold text-white hover:bg-[#082f70]"
              >
                {actionLabel}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
