'use client';

import { Sparkles } from 'lucide-react';
import { lmsSharedIntelligence, lmsCrossPageFlowHint } from '../data/ai-mock';
import { useLmsState } from '../state/LmsStateProvider';

export function LmsSharedIntelligenceHint() {
  const { state } = useLmsState();
  const intelligence = state.dashboardData?.intelligence;
  
  const summary = intelligence?.summary || lmsSharedIntelligence.weakTopicSummary;
  const flow = intelligence?.flowLabel || lmsCrossPageFlowHint;

  return (
    <div className="group mb-6 rounded-2xl border border-blue-100 bg-gradient-to-r from-blue-50/50 to-white p-4 shadow-sm transition-all duration-300 hover:shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-200 transition-transform duration-300 group-hover:rotate-12">
            <Sparkles className="h-5 w-5" strokeWidth={2} />
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#28A8E1]">
              AI Connected
            </p>
            <p className="text-[13px] font-medium leading-relaxed text-slate-600">
              {summary}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 self-end rounded-lg bg-white/80 px-3 py-1.5 text-[11px] font-bold text-slate-400 shadow-sm sm:self-center">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#28A8E1]" />
          Flow Analysis Live
        </div>
      </div>
    </div>
  );
}
