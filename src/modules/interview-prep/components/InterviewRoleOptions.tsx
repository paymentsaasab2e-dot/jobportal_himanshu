'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, UserCheck, UserRoundSearch } from 'lucide-react';
import { TokenSpendButton, CourseAccessBadge } from '@/app/lms/components/ux/TokenSpendButton';
import { fetchTokenUnlocks, spendTokenService } from '@/lib/tokens-api';

const INTERVIEWER_COST = 20;
const INTERVIEWER_SERVICE = 'lms.interview.unlock-interviewer';

type Props = {
  onRequestInterview: () => void;
  onBecomeInterviewer: () => void;
  onLaunchAiInterview: () => void;
};

export function InterviewRoleOptions({
  onRequestInterview,
  onBecomeInterviewer,
  onLaunchAiInterview,
}: Props) {
  const [interviewerUnlocked, setInterviewerUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const unlocks = await fetchTokenUnlocks();
        if (cancelled) return;
        setInterviewerUnlocked(Boolean(unlocks[INTERVIEWER_SERVICE]));
      } catch {
        // ignore — show locked CTAs
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#2098C8]">
          Interview roles
        </p>
        <h3 className="mt-1 text-xl font-bold text-slate-900">Choose how you want to continue</h3>
        <p className="mt-1 text-sm text-slate-600">
          Be interviewed is free to start — you only pay the interviewer&apos;s fee when matched.
          Interviewer access unlocks once. Or launch an AI mock interview anytime.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-2xl border border-[#BFE7F8] bg-[#F4FBFF] p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2098C8]/15 text-[#1F8FC2]">
              <UserRoundSearch className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-bold text-slate-900">Be Interviewed</p>
                <CourseAccessBadge accessTier="free" tokenCost={0} />
              </div>
              <p className="text-sm text-slate-600">
                Free to request. After match, pay the interviewer&apos;s set token fee.
              </p>
            </div>
          </div>
          <div className="mt-4">
            <button
              type="button"
              onClick={onRequestInterview}
              className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-[#2098C8] px-4 py-2.5 text-sm font-semibold text-white"
            >
              Request interview
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600/10 text-emerald-700">
              <UserCheck className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-base font-bold text-slate-900">Become Interviewer</p>
                <CourseAccessBadge accessTier="premium" tokenCost={INTERVIEWER_COST} />
              </div>
              <p className="text-sm text-slate-600">
                Unlock once, then set your own session token fee per interview.
              </p>
            </div>
          </div>
          <div className="mt-4">
            {loading ? (
              <p className="text-xs text-slate-500">Checking unlock…</p>
            ) : interviewerUnlocked ? (
              <button
                type="button"
                onClick={onBecomeInterviewer}
                className="inline-flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white"
              >
                Open interviewer page
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <TokenSpendButton
                tokenCost={INTERVIEWER_COST}
                label="Unlock"
                onSpend={async () => {
                  await spendTokenService(INTERVIEWER_SERVICE);
                  setInterviewerUnlocked(true);
                  onBecomeInterviewer();
                }}
              />
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={onLaunchAiInterview}
          className="group rounded-2xl border border-blue-200 bg-blue-50/50 p-4 text-left transition hover:border-blue-300 hover:shadow-sm"
        >
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#2098C8]/15 text-[#1F8FC2]">
              <UserRoundSearch className="h-5 w-5" />
            </span>
            <div>
              <p className="text-base font-bold text-slate-900">AI mock interview</p>
              <p className="text-sm text-slate-600">Choose your role and configure your session.</p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <span className="inline-flex rounded-full bg-[#2098C8] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              Be interviewed
            </span>
            <p className="text-sm text-slate-600">
              Jump straight into the real-time AI mock session. Configure role and interview
              parameters inside the module.
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
