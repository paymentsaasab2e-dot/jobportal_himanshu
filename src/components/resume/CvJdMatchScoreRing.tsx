'use client';

import type { CvJdMatchBreakdown } from '@/lib/job-cv-tailor';
import { useTranslations } from 'next-intl';

const FIT_STYLES = {
  strong: {
    ring: 'text-emerald-500',
    badge: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    labelKey: 'cvJdMatchStrong',
  },
  good: {
    ring: 'text-amber-500',
    badge: 'border-amber-200 bg-amber-50 text-amber-700',
    labelKey: 'cvJdMatchGood',
  },
  weak: {
    ring: 'text-rose-500',
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    labelKey: 'cvJdMatchWeak',
  },
} as const;

export function CvJdMatchScoreRing({
  breakdown,
  profileMatchScore,
}: {
  breakdown: CvJdMatchBreakdown;
  profileMatchScore?: number;
}) {
  const te = useTranslations('exploreJobs');
  const style = FIT_STYLES[breakdown.fitLabel];
  const circumference = 314;
  const offset = circumference - (circumference * breakdown.score) / 100;

  return (
    <div className="flex shrink-0 flex-col items-center gap-2 rounded-[20px] border border-[rgba(40,168,225,0.16)] bg-white/90 px-4 py-3 shadow-[0_12px_28px_rgba(40,168,225,0.08)] sm:min-w-[148px]">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">{te('cvJdMatchTitle')}</p>

      <div className="relative h-20 w-20">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 120 120" aria-hidden>
          <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-slate-100" />
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="currentColor"
            strokeWidth="10"
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className={style.ring}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-bold leading-none text-slate-900">{breakdown.score}%</span>
          <span className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-slate-400">{te('matchLabel')}</span>
        </div>
      </div>

      <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] ${style.badge}`}>
        {te(style.labelKey)}
      </span>

      <p className="text-center text-[10px] font-medium leading-snug text-slate-500">{te('cvJdMatchLive')}</p>

      <div className="grid w-full grid-cols-2 gap-1.5 text-center">
        <div className="rounded-lg bg-slate-50 px-2 py-1">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{te('cvJdMatchKeywords')}</p>
          <p className="text-xs font-bold text-slate-800">{breakdown.keywordCoverage}%</p>
        </div>
        <div className="rounded-lg bg-slate-50 px-2 py-1">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">{te('cvJdMatchSkills')}</p>
          <p className="text-xs font-bold text-slate-800">{breakdown.matchedSkillsCoverage}%</p>
        </div>
      </div>

      {typeof profileMatchScore === 'number' ? (
        <p className="text-center text-[10px] font-medium text-slate-500">
          {te('cvJdMatchProfile', { score: profileMatchScore })}
        </p>
      ) : null}
    </div>
  );
}
