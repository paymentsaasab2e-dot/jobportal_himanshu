'use client';

import { ChevronRight, Zap } from 'lucide-react';

type NextActionCardProps = {
  label: string;
  onAction?: () => void;
};

export function NextActionCard({ label, onAction }: NextActionCardProps) {
  return (
    <button
      type="button"
      onClick={onAction}
      className="group mt-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-white/15 px-4 py-3 text-left ring-1 ring-white/25 transition-all duration-200 ease-in-out hover:bg-white/25 hover:shadow-md hover:scale-[1.02] active:scale-[0.99]"
    >
      <span className="flex items-center gap-2 min-w-0">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#28A8E1] text-white shadow-sm">
          <Zap className="h-4 w-4" strokeWidth={2} aria-hidden />
        </span>
        <span className="min-w-0">
          <span className="block text-[11px] font-bold uppercase tracking-wide text-white/80">Next action</span>
          <span className="block text-sm font-bold text-white truncate">{label}</span>
        </span>
      </span>
      <ChevronRight
        className="h-5 w-5 shrink-0 text-white/70 transition-transform duration-200 ease-in-out group-hover:translate-x-0.5"
        aria-hidden
      />
    </button>
  );
}
