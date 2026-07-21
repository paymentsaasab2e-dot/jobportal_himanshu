'use client';

import { ArrowRight, UserCheck, UserRoundSearch } from 'lucide-react';

type Props = {
  onRequestInterview: () => void;
  onBecomeInterviewer: () => void;
};

export function InterviewRoleOptions({ onRequestInterview, onBecomeInterviewer }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#28A8E1]">Interview roles</p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">Choose how you want to continue</h3>
        <p className="mt-1 text-sm text-slate-600">
          Pick one option: request interview practice, or become an interviewer for other candidates.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <button
          type="button"
          onClick={onRequestInterview}
          className="group rounded-2xl border border-[#BFE7F8] bg-[#F4FBFF] p-4 text-left transition hover:border-[#82CFF0] hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#28A8E1]/15 text-[#1F8FC2]">
              <UserRoundSearch className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-slate-900">Be Interviewed</p>
              <p className="text-sm text-slate-600">Create a new interview request in guided steps.</p>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#1F8FC2]">
            Open request page
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </button>

        <button
          type="button"
          onClick={onBecomeInterviewer}
          className="group rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 text-left transition hover:border-emerald-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600/10 text-emerald-700">
              <UserCheck className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-slate-900">Become Interviewer</p>
              <p className="text-sm text-slate-600">Apply to take mock interviews for other candidates.</p>
            </div>
          </div>
          <div className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">
            Open interviewer page
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
          </div>
        </button>
      </div>
    </section>
  );
}
