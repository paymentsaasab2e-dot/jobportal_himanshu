'use client';

import { Target } from 'lucide-react';
import { NextActionCard } from './NextActionCard';
import { PerformanceSnapshot } from './PerformanceSnapshot';
import type { InterviewPrepData } from '../types/interview.types';

type InterviewHeaderProps = {
  data: Pick<InterviewPrepData, 'goal' | 'readiness' | 'nextAction' | 'scores'>;
  onNextAction?: () => void;
};

export function InterviewHeader({ data, onNextAction }: InterviewHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl p-5 sm:p-6 shadow-sm transition-all duration-200 ease-in-out hover:shadow-md">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#1e3a5f] via-[#2563ab] to-[#28A8E1] opacity-95"
        aria-hidden
      />
      <div
        className="absolute -right-20 -top-20 h-56 w-56 rounded-full bg-violet-400/25 blur-3xl lms-ai-glow pointer-events-none"
        aria-hidden
      />
      <div className="relative z-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3 min-w-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/25">
              <Target className="h-6 w-6 text-white" strokeWidth={2} aria-hidden />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-white/70">AI interview OS</p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-bold text-white tracking-tight">Your goal</h1>
              <p className="mt-1 text-xl font-bold text-white/95">{data.goal}</p>
            </div>
          </div>
          <div className="w-full lg:max-w-md lg:shrink-0">
            <div className="flex items-center justify-between gap-2 text-sm font-semibold text-white">
              <span>Readiness</span>
              <span className="tabular-nums">{data.readiness}%</span>
            </div>
            <div className="mt-2 h-2.5 rounded-full bg-white/15 overflow-hidden ring-1 ring-white/10">
              <div
                className="h-full rounded-full bg-white transition-[width] duration-700 ease-out shadow-sm"
                style={{ width: `${data.readiness}%` }}
              />
            </div>
          </div>
        </div>

        <NextActionCard label={data.nextAction} onAction={onNextAction} />

        <PerformanceSnapshot scores={data.scores} />
      </div>
    </div>
  );
}
