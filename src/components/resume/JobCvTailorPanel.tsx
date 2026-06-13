'use client';

import { AlertTriangle, ArrowRight, BookmarkCheck, CheckCircle2, Sparkles } from 'lucide-react';
import { CvJdMatchScoreRing } from '@/components/resume/CvJdMatchScoreRing';
import type { CvJdMatchBreakdown, JobCvTailorContext } from '@/lib/job-cv-tailor';
import { useTranslations } from 'next-intl';

type JobCvTailorPanelProps = {
  context: JobCvTailorContext;
  cvMatchBreakdown: CvJdMatchBreakdown;
  missingKeywords: string[];
  suggestions: string[];
  isSaving: boolean;
  isApplying: boolean;
  isApplyingSuggestions: boolean;
  onAppendKeyword: (keyword: string) => void;
  onTailorSummary: () => void;
  onApplySuggestions: () => void;
  onSaveCv: () => void;
  onApply: () => void;
};

export function JobCvTailorPanel({
  context,
  cvMatchBreakdown,
  missingKeywords,
  suggestions,
  isSaving,
  isApplying,
  isApplyingSuggestions,
  onAppendKeyword,
  onTailorSummary,
  onApplySuggestions,
  onSaveCv,
  onApply,
}: JobCvTailorPanelProps) {
  const te = useTranslations('exploreJobs');
  const breakdownFitKey =
    cvMatchBreakdown.fitLabel === 'strong'
      ? 'cvJdMatchStrong'
      : cvMatchBreakdown.fitLabel === 'good'
        ? 'cvJdMatchGood'
        : 'cvJdMatchWeak';
  const fitLabel = te(breakdownFitKey);
  const profileSignalScore =
    typeof context.profileMatchScore === 'number' &&
    Math.abs(context.profileMatchScore - cvMatchBreakdown.score) >= 5
      ? context.profileMatchScore
      : undefined;

  return (
    <section className="overflow-hidden rounded-[24px] border border-[rgba(40,168,225,0.22)] bg-[linear-gradient(180deg,rgba(40,168,225,0.10),rgba(255,255,255,0.98))] shadow-[0_18px_40px_rgba(40,168,225,0.10)]">
      <div className="border-b border-[rgba(40,168,225,0.14)] px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-4 sm:flex-row sm:items-start">
          <div className="min-w-0 flex-1 space-y-2">
            <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#28A8E1]">
              <Sparkles className="h-3.5 w-3.5" strokeWidth={2.2} />
              Tailor CV for this role
            </p>
            <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">
              {context.title}
              <span className="font-medium text-slate-500"> @ {context.company}</span>
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                {te('cvFitPercent', { score: cvMatchBreakdown.score })}
              </span>
              {fitLabel ? (
                <span className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-600">
                  {fitLabel}
                </span>
              ) : null}
            </div>
          </div>

          <CvJdMatchScoreRing
            breakdown={cvMatchBreakdown}
            profileMatchScore={profileSignalScore}
          />
          </div>

          <div className="flex shrink-0 flex-wrap gap-2">
            <button
              type="button"
              onClick={onSaveCv}
              disabled={isSaving || isApplying || isApplyingSuggestions}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? 'Saving…' : 'Save CV'}
            </button>
            <button
              type="button"
              onClick={onApply}
              disabled={isSaving || isApplying || isApplyingSuggestions}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(40,168,225,0.25)] transition hover:bg-[#28A8DF] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isApplying ? 'Applying…' : 'Apply to job'}
              <ArrowRight className="h-4 w-4" strokeWidth={2.2} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-2">
        <div className="space-y-4 border-b border-slate-100 px-5 py-4 sm:px-6 lg:border-b-0 lg:border-r">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">JD alignment insight</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {context.reasoning || te('defaultReasoning')}
            </p>
          </div>

          {context.matchedSkills.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {te('whereYouAlign')}
              </p>
              <div className="flex flex-wrap gap-2">
                {context.matchedSkills.map((skill) => (
                  <span
                    key={`matched-${skill}`}
                    className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {context.missingSkills.length > 0 ? (
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                <AlertTriangle className="h-3.5 w-3.5" />
                {te('strengthenNext')}
              </p>
              <div className="flex flex-wrap gap-2">
                {context.missingSkills.map((skill) => (
                  <button
                    key={`missing-${skill}`}
                    type="button"
                    onClick={() => onAppendKeyword(skill)}
                    className="inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800 transition hover:bg-amber-100"
                  >
                    + {skill}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-4 px-5 py-4 sm:px-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Suggestions from JD</p>
            <ul className="mt-2 space-y-2">
              {suggestions.map((item, index) => (
                <li
                  key={`suggestion-${index}`}
                  className="flex items-start gap-2 rounded-xl border border-slate-100 bg-white/80 px-3 py-2 text-sm text-slate-600"
                >
                  <BookmarkCheck className="mt-0.5 h-4 w-4 shrink-0 text-[#28A8E1]" strokeWidth={2.1} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {missingKeywords.length > 0 ? (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-400">Add to CV for ATS</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {missingKeywords.slice(0, 8).map((keyword) => (
                  <button
                    key={`kw-${keyword}`}
                    type="button"
                    onClick={() => onAppendKeyword(keyword)}
                    className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100"
                  >
                    Add {keyword}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          <button
            type="button"
            onClick={onApplySuggestions}
            disabled={isSaving || isApplying || isApplyingSuggestions}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-4 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(40,168,225,0.28)] transition hover:bg-[#28A8DF] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-4 w-4" strokeWidth={2.2} />
            {isApplyingSuggestions ? 'Applying suggestions…' : 'Apply all suggestions to CV'}
          </button>

          <button
            type="button"
            onClick={onTailorSummary}
            disabled={isSaving || isApplying || isApplyingSuggestions}
            className="inline-flex w-full items-center justify-center rounded-xl border border-[rgba(40,168,225,0.20)] bg-white px-4 py-2.5 text-sm font-semibold text-[#28A8E1] transition hover:bg-[rgba(40,168,225,0.06)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Tailor summary only
          </button>
        </div>
      </div>
    </section>
  );
}
