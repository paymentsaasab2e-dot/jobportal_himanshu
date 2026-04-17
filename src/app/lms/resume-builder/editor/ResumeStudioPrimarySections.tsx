'use client';

import { Bot, CheckCircle2, Mail, MapPin, Phone, Sparkles, UserRound, ScrollText } from 'lucide-react';
import { resumeAIImprovements } from '../../data/ai-mock';
import {
  INPUT_CLASS,
  StudioField,
  StudioSectionCard,
  TEXTAREA_CLASS,
  type DerivedSectionState,
  type ResumeSections,
} from './studio-config';

export function ResumeStudioBasicsSection({
  collapsed,
  onToggleCollapse,
  sections,
  sectionState,
  sectionRef,
  onBasicsChange,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  sections: ResumeSections;
  sectionState: DerivedSectionState;
  sectionRef: (node: HTMLDivElement | null) => void;
  onBasicsChange: (field: keyof ResumeSections['basics'], value: string) => void;
}) {
  return (
    <StudioSectionCard
      id="basics"
      title="Basics"
      helper="Start with a strong identity block: clear role targeting, complete contact details, and recruiter-friendly alignment."
      progress={sectionState.progress}
      status={sectionState.status}
      statusLabel={sectionState.statusLabel}
      icon={UserRound}
      accent="from-sky-500 via-cyan-400 to-sky-200"
      collapsed={collapsed}
      collapsible
      onToggleCollapse={onToggleCollapse}
      sectionRef={sectionRef}
    >
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <StudioField label="Full name">
          <input
            value={sections.basics.name}
            onChange={(event) => onBasicsChange('name', event.target.value)}
            className={INPUT_CLASS}
            placeholder="Alex Developer"
          />
        </StudioField>

        <StudioField label="Headline">
          <input
            value={sections.basics.headline}
            onChange={(event) => onBasicsChange('headline', event.target.value)}
            className={INPUT_CLASS}
            placeholder="Frontend Engineer"
          />
        </StudioField>

        <StudioField label="Email">
          <input
            value={sections.basics.email}
            onChange={(event) => onBasicsChange('email', event.target.value)}
            className={INPUT_CLASS}
            placeholder="alex@example.com"
          />
        </StudioField>

        <StudioField label="Phone">
          <input
            value={sections.basics.phone}
            onChange={(event) => onBasicsChange('phone', event.target.value)}
            className={INPUT_CLASS}
            placeholder="(555) 123-4567"
          />
        </StudioField>

        <div className="md:col-span-2">
          <StudioField label="Location">
            <input
              value={sections.basics.location}
              onChange={(event) => onBasicsChange('location', event.target.value)}
              className={INPUT_CLASS}
              placeholder="San Francisco, CA"
            />
          </StudioField>
        </div>
      </div>
    </StudioSectionCard>
  );
}

export function ResumeStudioSummarySection({
  collapsed,
  onToggleCollapse,
  sections,
  sectionState,
  sectionRef,
  summaryWordCount,
  onImproveSummary,
  onGenerateSummary,
  onSummaryChange,
}: {
  collapsed: boolean;
  onToggleCollapse: () => void;
  sections: ResumeSections;
  sectionState: DerivedSectionState;
  sectionRef: (node: HTMLDivElement | null) => void;
  summaryWordCount: number;
  onImproveSummary: () => void;
  onGenerateSummary: () => void;
  onSummaryChange: (value: string) => void;
}) {
  return (
    <StudioSectionCard
      id="summary"
      title="Professional Summary"
      helper="This should feel like an executive summary for your candidacy: who you are, what you drive, and where your strengths show up."
      progress={sectionState.progress}
      status={sectionState.status}
      statusLabel={sectionState.statusLabel}
      icon={ScrollText}
      accent="from-cyan-500 via-sky-400 to-cyan-200"
      collapsed={collapsed}
      collapsible
      onToggleCollapse={onToggleCollapse}
      sectionRef={sectionRef}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-3 text-[11px] font-bold text-sky-800 transition-all hover:bg-sky-100 active:scale-95"
            onClick={onGenerateSummary}
          >
            <Sparkles className="h-3 w-3" strokeWidth={2.4} />
            Generate with AI
          </button>
          <button
            type="button"
            className="inline-flex h-8 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 px-3 text-[11px] font-bold text-slate-800 transition-all hover:bg-slate-100 active:scale-95"
            onClick={onImproveSummary}
          >
            <Bot className="h-3 w-3" strokeWidth={2.4} />
            Improve content
          </button>
        </div>

        <div className="relative group">
          <textarea
            value={sections.summary}
            onChange={(event) => onSummaryChange(event.target.value)}
            rows={7}
            className={`${TEXTAREA_CLASS} bg-slate-50/30 focus:bg-white`}
            placeholder="Write a sharp overview of your experience, strengths, and recruiter-facing value."
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
          <span className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-white px-2.5 py-1 shadow-sm">
            <ScrollText className="h-3 w-3" />
            {summaryWordCount} words
          </span>
          <span className="flex items-center gap-1.5 rounded-lg border border-slate-100 bg-white px-2.5 py-1 shadow-sm">
            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
            Recruiter-optimized format
          </span>
        </div>
      </div>
    </StudioSectionCard>
  );
}

export function ResumeStudioSkillsSection({
  collapsed,
  missingKeywords,
  onToggleCollapse,
  sectionRef,
  sectionState,
  sections,
  skillTokens,
  onAppendKeyword,
  onSkillsChange,
}: {
  collapsed: boolean;
  missingKeywords: string[];
  onToggleCollapse: () => void;
  sectionRef: (node: HTMLDivElement | null) => void;
  sectionState: DerivedSectionState;
  sections: ResumeSections;
  skillTokens: string[];
  onAppendKeyword: (keyword: string) => void;
  onSkillsChange: (value: string) => void;
}) {
  return (
    <StudioSectionCard
      id="skills"
      title="Skills"
      helper="Keep this section ATS-aware: list the stack, specialties, and keywords that hiring teams are likely to scan first."
      progress={sectionState.progress}
      status={sectionState.status}
      statusLabel={sectionState.statusLabel}
      icon={Sparkles}
      accent="from-amber-500 via-orange-400 to-rose-200"
      collapsed={collapsed}
      collapsible
      onToggleCollapse={onToggleCollapse}
      sectionRef={sectionRef}
    >
      <div>
        <textarea
          value={sections.skills}
          onChange={(event) => onSkillsChange(event.target.value)}
          rows={5}
          className={TEXTAREA_CLASS}
          placeholder="React, TypeScript, Accessibility, Design Systems, Performance, Testing"
        />

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Current stack</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {skillTokens.length > 0 ? (
                skillTokens.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                  >
                    {skill}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-dashed border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-400">
                  No keywords added yet
                </span>
              )}
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400">Suggested keywords</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {missingKeywords.length > 0 ? (
                missingKeywords.map((keyword) => (
                  <button
                    key={keyword}
                    type="button"
                    onClick={() => onAppendKeyword(keyword)}
                    className="rounded-full border border-sky-100 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition-colors hover:bg-sky-100"
                  >
                    Add {keyword}
                  </button>
                ))
              ) : (
                <span className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800">
                  Keyword coverage looks healthy
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudioSectionCard>
  );
}
