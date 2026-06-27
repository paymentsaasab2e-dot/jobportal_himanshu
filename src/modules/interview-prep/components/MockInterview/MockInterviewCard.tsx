'use client';

import { Mic2 } from 'lucide-react';

type MockInterviewCardProps = {
  difficulty: string;
  role: string;
  onChangeConfig: (next: { difficulty: string; role: string }) => void;
  onStartMock: () => void;
};

export function MockInterviewCard({ onStartMock: _onStartMock }: MockInterviewCardProps) {
  return (
    <section className="rounded-2xl border border-violet-100 bg-white p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#28A8E1]/10 text-[#28A8E1] ring-1 ring-[#28A8E1]/20">
          <Mic2 className="h-6 w-6" strokeWidth={2} aria-hidden />
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-900">AI mock interview</h2>
          <p className="mt-0.5 text-sm font-normal text-gray-500">Choose your role and configure your session.</p>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/30 p-5 space-y-4">
        <div className="space-y-1.5">
          <span className="inline-block rounded-md bg-[#28A8E1] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-white">
            Be interviewed
          </span>
          <p className="text-sm font-medium leading-relaxed text-gray-600">
            Jump straight into the real-time AI mock session. You can seamlessly configure your role
            and interview parameters directly inside the module.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/Aimockinter';
          }}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-[#1a85b6] hover:shadow-md active:scale-[0.98]"
        >
          <Mic2 className="h-5 w-5 shrink-0" /> Launch AI Interview
        </button>
      </div>
    </section>
  );
}
