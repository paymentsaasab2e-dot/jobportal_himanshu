'use client';

import { ArrowRight, UserCheck, UserRoundSearch } from 'lucide-react';

type Props = {
  onRequestInterview: () => void;
  onBecomeInterviewer: () => void;
  onLaunchAiInterview: () => void;
};

export function InterviewRoleOptions({ onRequestInterview, onBecomeInterviewer, onLaunchAiInterview }: Props) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#28A8E1]">Interview roles</p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">Choose how you want to continue</h3>
        <p className="mt-1 text-sm text-slate-600">
          Pick your path: be interviewed, become interviewer, or launch AI mock interview.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
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

        <button
          type="button"
          onClick={onLaunchAiInterview}
          className="group rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#28A8E1]/15 text-[#1F8FC2]">
              <UserRoundSearch className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-slate-900">AI mock interview</p>
              <p className="text-sm text-slate-600">Choose your role and configure your session.</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <span className="inline-flex rounded-full bg-[#28A8E1] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Be interviewed
            </span>
            <p className="text-sm text-slate-600">
              Jump straight into the real-time AI mock session. Configure role and interview parameters inside the module.
            </p>
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#1F8FC2]">
              Launch AI Interview
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </div>
        </button>
      </div>
    </section>
  );
}
