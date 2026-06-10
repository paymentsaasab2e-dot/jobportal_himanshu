'use client';

import { LMS_CARD_CLASS } from '../../constants';
import type { LmsResumeAnalysisResult } from '../../state/LmsStateProvider';
import {
  SECTION_DEFINITIONS,
  SectionStatusIcon,
  type DerivedSectionState,
  type SectionId,
} from './studio-config';

const NAV_SHORT_LABELS: Partial<Record<SectionId, string>> = {
  summary: 'Summary',
};

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
    <div className={`${LMS_CARD_CLASS} min-w-0 overflow-hidden border-slate-200/90 bg-white shadow-[0_18px_48px_-32px_rgba(15,23,42,0.24)] !p-3`}>
      <div className="mb-2.5 flex min-w-0 flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400">Section map</p>
          <p className="mt-0.5 text-sm font-bold tracking-tight text-slate-900">Navigate the resume studio</p>
        </div>

        <div className="flex min-w-0 flex-wrap gap-1.5">
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Progress</p>
            <p className="text-xs font-bold text-slate-900">{editorProgress}%</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">Keywords</p>
            <p className="text-xs font-bold text-slate-900">{keywordCoverage}%</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 px-2 py-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-slate-400">ATS</p>
            <p className="text-xs font-bold text-slate-900">{atsReadiness}%</p>
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-sky-100 bg-sky-50 px-2 py-1 shadow-[0_4px_12px_-8px_rgba(40,168,225,0.4)]">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-sky-600">AI Score</p>
            <p className="text-xs font-bold text-sky-900">{analysis?.readinessScore ?? '??'}%</p>
          </div>
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
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
              className={`flex w-full min-w-0 flex-col items-start gap-1 rounded-lg border px-2 py-1.5 text-left transition-all duration-200 ${
                active
                  ? 'border-sky-200 bg-sky-50 shadow-[0_6px_12px_-10px_rgba(40,168,225,0.6)]'
                  : 'border-slate-200/80 bg-slate-50/70 hover:border-slate-300 hover:bg-white'
              }`}
            >
              <div className="flex w-full items-center justify-between gap-0.5">
                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md ${
                  active ? 'bg-sky-600 text-white' : 'bg-white text-slate-500'
                }`}>
                  <Icon className="h-3 w-3" strokeWidth={2.1} />
                </div>
                <div className="scale-90">
                  <SectionStatusIcon status={stateForSection.status} />
                </div>
              </div>

              <div className="min-w-0 w-full">
                <p className="truncate text-[11px] font-semibold leading-tight text-slate-900">
                  {NAV_SHORT_LABELS[section.id] ?? section.label}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  <div className="h-0.5 flex-1 overflow-hidden rounded-full bg-slate-100">
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
                  <span className="shrink-0 text-[9px] font-bold text-slate-400">
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
