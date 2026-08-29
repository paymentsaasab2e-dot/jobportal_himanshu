'use client';

import { Mic2 } from 'lucide-react';
import { TokenSpendButton, CourseAccessBadge } from '@/app/lms/components/ux/TokenSpendButton';
import { startInterviewSession } from '@/app/lms/api/client';

const MOCK_TOKEN_COST = 25;

type MockInterviewCardProps = {
  difficulty: string;
  role: string;
  onChangeConfig: (next: { difficulty: string; role: string }) => void;
  onStartMock: () => void | Promise<void>;
};

export function MockInterviewCard({
  difficulty,
  role,
}: MockInterviewCardProps) {
  const unlockAndLaunch = async () => {
    await startInterviewSession({
      type: 'MOCK',
      topic: `${role} - ${difficulty}`,
    });
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('lms:mock-interview-paid', '1');
      window.location.href = '/Aimockinter';
    }
  };

  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#2098C8]/10 text-[#2098C8] ring-1 ring-[#2098C8]/20">
          <Mic2 className="h-6 w-6" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">AI mock interview</h2>
            <CourseAccessBadge accessTier="premium" tokenCost={MOCK_TOKEN_COST} />
          </div>
          <p className="mt-0.5 text-sm font-normal text-gray-500">
            Unlock with coins, then launch your AI mock session.
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 space-y-4">
        <div className="space-y-1.5">
          <span className="inline-block rounded-md bg-[#2098C8] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            Be interviewed
          </span>
          <p className="text-sm font-medium leading-relaxed text-gray-600">
            Premium AI mock interview. Unlock once to launch, then configure role and parameters inside
            the module.
          </p>
        </div>
        <TokenSpendButton
          tokenCost={MOCK_TOKEN_COST}
          label="Unlock & launch"
          lockedLabel="Need"
          onSpend={unlockAndLaunch}
        />
      </div>
    </section>
  );
}
