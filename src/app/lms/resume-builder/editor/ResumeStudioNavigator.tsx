'use client';

import { LMS_CARD_CLASS } from '../../constants';
import type { LmsResumeAnalysisResult } from '../../state/LmsStateProvider';
import {
  SECTION_DEFINITIONS,
  SectionStatusIcon,
  type DerivedSectionState,
  type SectionId,
} from './studio-config';

export function ResumeStudioNavigator({
  activeSection,
  completionState,
  editorProgress,
  keywordCoverage,
  atsReadiness,
  onSelect,
  sectionStates,
  analysis,
}: {
  activeSection: SectionId;
  completionState: DerivedSectionState;
  editorProgress: number;
  keywordCoverage: number;
  atsReadiness: number;
  onSelect: (id: SectionId) => void;
  sectionStates: Record<SectionId, DerivedSectionState>;
  analysis?: LmsResumeAnalysisResult;
}) {
  return (
    <div className={`${LMS_CARD_CLASS} border-slate-200/90 bg-white shadow-[0_18px_48px_-32px_rgba(15,23,42,0.24)] !p-4`}>
      {/* Top row: title + stats */}
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between mb-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">Section map</p>
          <p className="mt-0.5 text-base font-bold tracking-tight text-slate-900">Navigate the resume studio</p>
        </div>

        {/* Compact stat chips */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Progress</p>
            <p className="text-sm font-bold text-slate-900">{editorProgress}%</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">Keywords</p>
            <p className="text-sm font-bold text-slate-900">{keywordCoverage}%</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">ATS</p>
            <p className="text-sm font-bold text-slate-900">{atsReadiness}%</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 py-1.5 shadow-[0_4px_12px_-8px_rgba(40,168,225,0.4)]">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-600">AI Score</p>
            <p className="text-sm font-bold text-sky-900">{analysis?.readinessScore ?? '??'}%</p>
          </div>
        </div>
      </div>

      {/* Section cards — compact grid */}
      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {SECTION_DEFINITIONS.map((section) => {
          const stateForSection =
            section.id === 'completion' ? completionState : sectionStates[section.id];
          const Icon = section.icon;
          const active = activeSection === section.id;

          return (
            <button
              key={section.id}
              type="button"
              onClick={() => onSelect(section.id)}
              className={`flex w-full flex-col items-start gap-1.5 rounded-xl border px-3 py-2.5 text-left transition-all duration-200 ${
                active
                  ? 'border-sky-200 bg-sky-50 shadow-[0_8px_16px_-12px_rgba(40,168,225,0.6)]'
                  : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-1">
                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg ${
                  active ? 'bg-sky-600 text-white' : 'bg-white text-slate-500'
                }`}>
                  <Icon className="h-3.5 w-3.5" strokeWidth={2.1} />
                </div>
                <SectionStatusIcon status={stateForSection.status} />
              </div>

              <div className="min-w-0 w-full">
                <p className="text-xs font-semibold text-slate-900 leading-tight truncate">{section.label}</p>
                {/* Progress bar */}
                <div className="mt-1.5 flex items-center gap-1.5">
                  <div className="h-1 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${
                        stateForSection.status === 'complete'
                          ? 'bg-emerald-500'
                          : stateForSection.status === 'warning'
                            ? 'bg-amber-400'
                            : 'bg-sky-500'
                      }`}
                      style={{ width: `${stateForSection.progress}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-[10px] font-bold text-slate-400">
                    {stateForSection.progress}%
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
