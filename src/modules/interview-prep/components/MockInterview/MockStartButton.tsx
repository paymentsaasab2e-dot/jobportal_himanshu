'use client';

import { Mic2 } from 'lucide-react';

type MockStartButtonProps = {
  onStart: () => void;
};

export function MockStartButton({ onStart }: MockStartButtonProps) {
  return (
    <button
      type="button"
      onClick={onStart}
      className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl bg-[#28A8E1] px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-all duration-200 ease-in-out hover:shadow-md hover:scale-[1.02] active:scale-[0.98]"
    >
      <Mic2 className="h-5 w-5" strokeWidth={2} aria-hidden />
      Start AI mock interview
    </button>
  );
}
