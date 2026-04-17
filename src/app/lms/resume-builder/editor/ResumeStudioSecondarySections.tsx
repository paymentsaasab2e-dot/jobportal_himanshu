'use client';

import {
  AlertTriangle,
  ArrowRight,
  Briefcase,
  CheckCircle2,
  Clock3,
  GraduationCap,
  LayoutTemplate,
  Plus,
  Sparkles,
  Target,
  Trash2,
  ChevronDown,
} from 'lucide-react';
import { useState } from 'react';
import { LmsCtaButton } from '../../components/ux/LmsCtaButton';
import { LmsStatusBadge } from '../../components/ux/LmsStatusBadge';
import type { ResumeEducation, ResumeExperience, LmsResumeAnalysisResult } from '../../state/LmsStateProvider';
import {
  INPUT_CLASS,
  StudioField,
  StudioSectionCard,
  TEMPLATE_OPTIONS,
  TEXTAREA_CLASS,
  type DerivedSectionState,
  type ResumeSections,
  type SectionId,
} from './studio-config';
import { ResumeDocumentPaper } from './ResumeStudioPreview';

export function ResumeStudioExperienceSection({
  collapsed,
  onAddExperience,
  onToggleCollapse,
  onRemoveExperience,
  onUpdateExperience,
  sectionRef,
  sectionState,
  sections,
}: {
  collapsed: boolean;
  onAddExperience: () => void;
  onToggleCollapse: () => void;
  onRemoveExperience: (id: string) => void;
  onUpdateExperience: (id: string, field: keyof ResumeExperience, value: string) => void;
  sectionRef: (node: HTMLDivElement | null) => void;
  sectionState: DerivedSectionState;
  sections: ResumeSections;
}) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItemExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <StudioSectionCard
      id="experience"
      title="Experience"
      helper="Treat each role like a recruiter-ready story block: company, scope, timeline, and outcome-led bullets."
      progress={sectionState.progress}
      status={sectionState.status}
      statusLabel={sectionState.statusLabel}
      icon={Briefcase}
      accent="from-emerald-500 via-teal-400 to-cyan-200"
      collapsed={collapsed}
      collapsible
      onToggleCollapse={onToggleCollapse}
      sectionRef={sectionRef}
      actions={
        <button
          type="button"
          onClick={onAddExperience}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      }
    >
      <div className="space-y-4">
        {sections.experience.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
            <p className="text-base font-bold text-slate-900">Add your first experience entry</p>
            <p className="mt-2 text-sm text-slate-500">
              Roles become much stronger when they include specific responsibilities, measurable outcomes, and stack context.
            </p>
            <div className="mt-5">
              <LmsCtaButton
                variant="secondary"
                leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
                onClick={onAddExperience}
              >
                Add experience entry
              </LmsCtaButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.experience.map((entry, index) => (
              <article
                key={entry.id}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-3.5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.25)]"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex cursor-pointer items-center gap-3 min-w-0"
                    onClick={() => toggleItemExpand(entry.id)}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 shadow-sm transition-all hover:text-slate-900">
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${expandedItems[entry.id] ? 'rotate-180' : 'rotate-0'}`} 
                        strokeWidth={2.4} 
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Experience {String(index + 1).padStart(2, '0')}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-slate-900 truncate">
                        {entry.role || 'Role title'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveExperience(entry.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-100 bg-white text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>

                {expandedItems[entry.id] && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <StudioField label="Company">
                        <input
                          value={entry.company}
                          onChange={(event) => onUpdateExperience(entry.id, 'company', event.target.value)}
                          className={INPUT_CLASS}
                          placeholder="Tech Corp"
                        />
                      </StudioField>

                      <StudioField label="Role">
                        <input
                          value={entry.role}
                          onChange={(event) => onUpdateExperience(entry.id, 'role', event.target.value)}
                          className={INPUT_CLASS}
                          placeholder="Frontend Engineer"
                        />
                      </StudioField>
                    </div>

                    <div className="mt-4">
                      <StudioField label="Impact bullets">
                        <textarea
                          value={entry.bullets}
                          onChange={(event) => onUpdateExperience(entry.id, 'bullets', event.target.value)}
                          rows={6}
                          className={TEXTAREA_CLASS}
                          placeholder="- Shipped feature X and improved conversion by Y%&#10;- Reduced page load time by Z%"
                        />
                      </StudioField>
                      <div className="mt-3">
                        <StudioField label="Dates">
                          <input
                            value={entry.duration}
                            onChange={(event) => onUpdateExperience(entry.id, 'duration', event.target.value)}
                            className={INPUT_CLASS}
                            placeholder="Jan 2024 - Present"
                          />
                        </StudioField>
                      </div>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {sections.experience.length > 0 ? (
          <button
            type="button"
            onClick={onAddExperience}
            className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-slate-300 bg-white py-4 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            Add another experience entry
          </button>
        ) : null}
      </div>
    </StudioSectionCard>
  );
}

export function ResumeStudioEducationSection({
  collapsed,
  onAddEducation,
  onToggleCollapse,
  onRemoveEducation,
  onUpdateEducation,
  sectionRef,
  sectionState,
  sections,
}: {
  collapsed: boolean;
  onAddEducation: () => void;
  onToggleCollapse: () => void;
  onRemoveEducation: (id: string) => void;
  onUpdateEducation: (id: string, field: keyof ResumeEducation, value: string) => void;
  sectionRef: (node: HTMLDivElement | null) => void;
  sectionState: DerivedSectionState;
  sections: ResumeSections;
}) {
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItemExpand = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <StudioSectionCard
      id="education"
      title="Education"
      helper="Keep this section compact, clear, and credible. It can also hold certifications or focused learning programs."
      progress={sectionState.progress}
      status={sectionState.status}
      statusLabel={sectionState.statusLabel}
      icon={GraduationCap}
      accent="from-violet-500 via-fuchsia-400 to-rose-200"
      collapsed={collapsed}
      collapsible
      onToggleCollapse={onToggleCollapse}
      sectionRef={sectionRef}
      actions={
        <button
          type="button"
          onClick={onAddEducation}
          className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-sky-600 text-white shadow-sm transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" strokeWidth={2.5} />
        </button>
      }
    >
      <div className="space-y-4">
        {sections.education.length === 0 ? (
          <div className="rounded-[1.6rem] border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
            <p className="text-base font-bold text-slate-900">Add an education or certification block</p>
            <p className="mt-2 text-sm text-slate-500">
              This helps close trust gaps and supports ATS parsing for early-career or role-switching resumes.
            </p>
            <div className="mt-5">
              <LmsCtaButton
                variant="secondary"
                leftIcon={<Plus className="h-4 w-4" strokeWidth={2} />}
                onClick={onAddEducation}
              >
                Add education entry
              </LmsCtaButton>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.education.map((entry, index) => (
              <article
                key={entry.id}
                className="rounded-[1.4rem] border border-slate-200 bg-slate-50/70 p-3.5 shadow-[0_8px_24px_-16px_rgba(15,23,42,0.25)]"
              >
                <div className="flex items-center justify-between">
                  <div 
                    className="flex cursor-pointer items-center gap-3 min-w-0"
                    onClick={() => toggleItemExpand(entry.id)}
                  >
                    <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white border border-slate-200 text-slate-400 shadow-sm transition-all hover:text-slate-900">
                      <ChevronDown 
                        className={`h-4 w-4 transition-transform duration-200 ${expandedItems[entry.id] ? 'rotate-180' : 'rotate-0'}`} 
                        strokeWidth={2.4} 
                      />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
                        Education {String(index + 1).padStart(2, '0')}
                      </p>
                      <p className="mt-0.5 text-base font-bold text-slate-900 truncate">
                        {entry.institution || 'Institution'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveEducation(entry.id)}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-rose-100 bg-white text-rose-600 transition-colors hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
                  </button>
                </div>

                {expandedItems[entry.id] && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <StudioField label="Institution">
                        <input
                          value={entry.institution}
                          onChange={(event) => onUpdateEducation(entry.id, 'institution', event.target.value)}
                          className={INPUT_CLASS}
                          placeholder="State University"
                        />
                      </StudioField>

                      <StudioField label="Degree or program">
                        <input
                          value={entry.degree}
                          onChange={(event) => onUpdateEducation(entry.id, 'degree', event.target.value)}
                          className={INPUT_CLASS}
                          placeholder="B.S. Computer Science"
                        />
                      </StudioField>
                    </div>

                    <div className="mt-4 md:max-w-xs">
                      <StudioField label="Year or duration">
                        <input
                          value={entry.duration}
                          onChange={(event) => onUpdateEducation(entry.id, 'duration', event.target.value)}
                          className={INPUT_CLASS}
                          placeholder="2019 - 2023"
                        />
                      </StudioField>
                    </div>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}

        {sections.education.length > 0 ? (
          <button
            type="button"
            onClick={onAddEducation}
            className="flex w-full items-center justify-center gap-2 rounded-[1.4rem] border border-dashed border-slate-300 bg-white py-4 text-sm font-semibold text-slate-700 transition-all hover:border-slate-400 hover:bg-slate-50"
          >
            <Plus className="h-4 w-4" strokeWidth={2.2} />
            Add another education entry
          </button>
        ) : null}
      </div>
    </StudioSectionCard>
  );
}

export function ResumeStudioLayoutSection({
  collapsed,
  currentTemplate,
  onToggleCollapse,
  onSelectTemplate,
  sectionRef,
  sectionState,
  sections,
}: {
  collapsed: boolean;
  currentTemplate: string | null;
  onToggleCollapse: () => void;
  onSelectTemplate: (templateId: string, templateLabel: string) => void;
  sectionRef: (node: HTMLDivElement | null) => void;
  sectionState: DerivedSectionState;
  sections: ResumeSections;
}) {
  return (
    <StudioSectionCard
      id="layout"
      title="Configure layout"
      helper="Choose the presentation mode that best fits the role you are targeting while keeping the same content and save logic."
      progress={sectionState.progress}
      status={sectionState.status}
      statusLabel={sectionState.statusLabel}
      icon={LayoutTemplate}
      accent="from-slate-900 via-slate-700 to-slate-400"
      collapsed={collapsed}
      collapsible
      onToggleCollapse={onToggleCollapse}
      sectionRef={sectionRef}
    >
      <div className="grid grid-cols-2 gap-4 py-2">
        {TEMPLATE_OPTIONS.map((option) => {
          const selected = currentTemplate === option.id;

          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelectTemplate(option.id, option.label)}
              className={`group flex min-w-[140px] max-w-[180px] flex-1 flex-col rounded-[2.2rem] border p-2 text-center transition-all duration-300 ${
                selected
                  ? 'border-sky-400 bg-sky-50 shadow-[0_20px_40px_-24px_rgba(40,168,225,0.45)]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
              }`}
            >
              <div className={`relative aspect-[4/5] w-full overflow-hidden rounded-[1.8rem] border border-slate-100/90 bg-white transition-all duration-300 ${
                selected ? 'ring-2 ring-sky-100' : 'group-hover:scale-[0.98]'
              }`}>
                <div className="absolute inset-0 origin-top-left scale-[0.16] pointer-events-none">
                   <div className="w-[840px]">
                      <ResumeDocumentPaper 
                        activeSection="layout" 
                        contentId={`mini-${option.id}`} 
                        sections={sections} 
                        template={option.id}
                        className="!shadow-none !px-8 !py-6 !min-h-0"
                      />
                   </div>
                </div>
                {/* Subtle overlay to soften the content for the tiny view */}
                <div className="absolute inset-0 bg-white/5 backdrop-blur-[0.5px]" />
              </div>

              <div className="my-3 flex flex-col items-center">
                <p className={`text-[10px] font-black uppercase tracking-[0.18em] ${selected ? 'text-sky-700' : 'text-slate-500'}`}>
                  {option.label}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </StudioSectionCard>
  );
}

export function ResumeStudioCompletionSection({
  atsReadiness,
  completionState,
  draftStatus,
  editorProgress,
  keywordCoverage,
  readinessHighlights,
  sectionRef,
  targetRole,
  onAnalyze,
  onSync,
  analysis,
  isAnalyzing,
}: {
  atsReadiness: number;
  completionState: DerivedSectionState;
  draftStatus: string;
  editorProgress: number;
  keywordCoverage: number;
  readinessHighlights: string[];
  sectionRef: (node: HTMLDivElement | null) => void;
  targetRole: string;
  onAnalyze: () => void;
  onSync: () => void;
  analysis?: LmsResumeAnalysisResult;
  isAnalyzing: boolean;
}) {
  return (
    <StudioSectionCard
      id="completion"
      title="Ready to lock this draft?"
      helper="This is the final studio step: review completion, confirm recruiter readiness, then sync the result into your LMS career path."
      progress={completionState.progress}
      status={completionState.status}
      statusLabel={completionState.statusLabel}
      icon={CheckCircle2}
      accent="from-sky-600 via-cyan-500 to-emerald-400"
      sectionRef={sectionRef}
      actions={
        <button
          type="button"
          disabled={isAnalyzing}
          className="inline-flex items-center gap-2 rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100 disabled:opacity-50"
          onClick={onAnalyze}
        >
          <Sparkles className={`h-3.5 w-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} strokeWidth={2} />
          {isAnalyzing ? 'Analyzing...' : 'Refresh AI Insights'}
        </button>
      }
    >
      <div className="space-y-4">
        <div className="rounded-[1.6rem] border border-slate-200 bg-slate-50/70 p-5">
          <div className="flex flex-wrap items-center gap-3">
            <LmsStatusBadge
              label={`${editorProgress}% studio complete`}
              tone={editorProgress >= 85 ? 'success' : 'warning'}
            />
            <LmsStatusBadge
              label={`${atsReadiness}% ATS readiness`}
              tone={atsReadiness >= 80 ? 'success' : 'warning'}
            />
            <LmsStatusBadge
              label={`${keywordCoverage}% keyword coverage`}
              tone={keywordCoverage >= 70 ? 'success' : 'warning'}
            />
          </div>

          <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400"
              style={{ width: `${editorProgress}%` }}
            />
          </div>

          {analysis && (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-sky-100 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-2 text-sky-900">
                  <Briefcase className="h-4 w-4" />
                  <h4 className="text-sm font-bold">Recruiter's 3-Second View</h4>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
                  "{analysis.recruiterView}"
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[1.8rem] border border-sky-100 bg-[linear-gradient(180deg,rgba(239,248,255,0.9),rgba(255,255,255,0.96))] p-6 shadow-[0_18px_44px_-28px_rgba(40,168,225,0.45)]">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-sky-700">Final action</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
            Confirm and sync this version
          </h3>
          
          <div className="mt-6">
            <LmsCtaButton
              className="w-full"
              leftIcon={<ArrowRight className="h-4 w-4" strokeWidth={2.1} />}
              onClick={onSync}
            >
              Confirm & Sync to Career Path
            </LmsCtaButton>
          </div>
        </div>
      </div>
    </StudioSectionCard>
  );
}
