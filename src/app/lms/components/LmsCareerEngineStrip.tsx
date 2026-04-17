import Link from 'next/link';
import { Zap, TrendingUp, ChevronRight } from 'lucide-react';
import { lmsCareerEngine } from '../data/ai-mock';
import { useLmsState } from '../state/LmsStateProvider';

export function LmsCareerEngineStrip() {
  const { state } = useLmsState();
  const d = state.dashboardData;
  const cp = state.careerPath;
  
  const goalLabel = d?.profileContext?.targetRoles?.[0] || state.careerPath.role || lmsCareerEngine.goalLabel;
  const progressPct = cp.started && cp.roadmapItems?.length 
    ? Math.round((cp.completedStepIds.length / cp.roadmapItems.length) * 100) 
    : (d?.cvScore || lmsCareerEngine.progressPct);
    
  const readinessStage = progressPct > 80 ? 'Offer Stage' : progressPct > 50 ? 'Interview Ready' : 'Foundations';
  const nextAction = d?.careerPathSummary?.nextItem?.title || lmsCareerEngine.nextAction;
  const nextActionHref = d?.careerPathSummary?.nextItem?.route || lmsCareerEngine.nextActionHref;

  return (
    <div className="rounded-2xl border border-violet-200/90 bg-gradient-to-r from-white via-violet-50/50 to-white p-3 sm:p-4 shadow-sm lms-ai-glow mb-4 transition-all duration-200 hover:shadow-md">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md">
            <Zap className="h-4 w-4" strokeWidth={2} aria-hidden />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-violet-700">AI career engine</p>
            <p className="mt-0.5 text-base sm:text-lg font-bold text-gray-900 truncate">
              Your goal:{' '}
              <span className="text-violet-900">{goalLabel}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 lg:gap-4">
          <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-white/90 px-3 py-2 shadow-sm">
            <TrendingUp className="h-4 w-4 shrink-0 text-[#28A8E1]" strokeWidth={2} aria-hidden />
            <span className="text-sm font-bold text-gray-900">{progressPct}%</span>
            <span className="text-sm font-normal text-gray-500">→ {readinessStage}</span>
          </div>
          <Link
            href={nextActionHref}
            className="group inline-flex items-center gap-1 rounded-xl border border-[#28A8E1]/30 bg-[#28A8E1]/10 px-3 py-2 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-[#28A8E1]/15 hover:shadow-md hover:scale-[1.01] active:scale-[0.99]"
          >
            <span className="text-[#28A8E1]">Next:</span>
            <span className="truncate max-w-[150px]">{nextAction}</span>
            <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
