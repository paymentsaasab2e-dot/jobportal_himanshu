'use client';

import { CalendarClock, ShieldCheck, Video } from 'lucide-react';

type RequestSummary = {
  pendingRequests: number;
  scheduledInterviews: number;
  completedInterviews: number;
  cancelledInterviews: number;
};

type LiveInterviewCardProps = {
  summary?: RequestSummary | null;
};

const LIVE_FEATURES = [
  'Schedule interviews with secure meeting link',
  'Join with camera, mic, chat, timer, and screen share',
  'Track status, notes, rating, and final result',
];

export function LiveInterviewCard({ summary }: LiveInterviewCardProps) {
  const stats = summary || {
    pendingRequests: 0,
    scheduledInterviews: 0,
    completedInterviews: 0,
    cancelledInterviews: 0,
  };
  return (
    <section className="rounded-2xl border border-emerald-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20">
          <Video className="h-6 w-6" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">Take Interview</h2>
          <p className="mt-0.5 text-sm font-normal text-gray-500">
            Request mock interview and track all request states from your dashboard.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-100 bg-emerald-50/35 p-5 space-y-4">
        <div className="space-y-1.5">
          <span className="inline-block rounded-md bg-emerald-600 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            Candidate request module
          </span>
          <p className="text-sm font-medium leading-relaxed text-gray-600">
            Submit your interview request with category, stack, difficulty, date/time, and notes.
            Your request is saved with a unique request ID and status tracking.
          </p>
        </div>

        <ul className="space-y-2">
          {LIVE_FEATURES.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-sm text-gray-700">
              <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500" />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
            <CalendarClock className="h-4 w-4 text-emerald-600" />
            Date / Time / Duration request
          </div>
          <div className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            Auth-protected candidate request
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <p className="font-semibold text-slate-800">Pending Requests</p>
            <p className="mt-1 text-base font-bold text-[#1F8FC2]">{stats.pendingRequests}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <p className="font-semibold text-slate-800">Scheduled Interviews</p>
            <p className="mt-1 text-base font-bold text-[#1F8FC2]">{stats.scheduledInterviews}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <p className="font-semibold text-slate-800">Completed Interviews</p>
            <p className="mt-1 text-base font-bold text-[#1F8FC2]">{stats.completedInterviews}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs">
            <p className="font-semibold text-slate-800">Cancelled Interviews</p>
            <p className="mt-1 text-base font-bold text-[#1F8FC2]">{stats.cancelledInterviews}</p>
          </div>
        </div>

      </div>
    </section>
  );
}
