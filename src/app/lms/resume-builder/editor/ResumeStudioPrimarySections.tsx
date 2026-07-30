'use client';

import { Bot, CheckCircle2, Mail, MapPin, Phone, Sparkles, UserRound, ScrollText } from 'lucide-react';
import { resumeAIImprovements } from '../../data/ai-mock';
import {
  INPUT_CLASS,
  StudioField,
  StudioSectionCard,
  TEXTAREA_CLASS,
  parseSkillEntries,
  type DerivedSectionState,
  type ResumeSections,
} from './studio-config';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import { CvGapCoach } from '@/components/resume/CvGapCoach';
import type { CvGapCoachItem } from '@/lib/cv-gap-coach';

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
          <WritingAssistField
            value={sections.summary}
            onChange={onSummaryChange}
            rows={12}
            className={`${TEXTAREA_CLASS} min-h-[220px] bg-slate-50/30 focus:bg-white`}
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
  onAppendKeyword,
  onSkillsChange,
  hasExperience,
  weakOrEmptyBullets,
  roleHint,
  targetRole,
  company,
  jobDescriptionSnippet,
  onApplyCoachFramed,
}: {
  collapsed: boolean;
  missingKeywords: string[];
  onToggleCollapse: () => void;
  sectionRef: (node: HTMLDivElement | null) => void;
  sectionState: DerivedSectionState;
  sections: ResumeSections;
  onAppendKeyword: (keyword: string) => void;
  onSkillsChange: (value: string) => void;
  hasExperience: boolean;
  weakOrEmptyBullets: boolean;
  roleHint?: string;
  targetRole?: string;
  company?: string;
  jobDescriptionSnippet?: string;
  onApplyCoachFramed: (payload: {
    item: CvGapCoachItem;
    framed: string;
    skillWriteup?: string;
    applyAs: 'experience' | 'summary' | 'skills';
  }) => void;
}) {
  return (
    <StudioSectionCard
      id="skills"
      title="Skills"
      helper="Add skill names. Use AI coach for gaps — content goes straight into the CV."
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
        <WritingAssistField
          value={sections.skills}
          onChange={onSkillsChange}
          rows={3}
          className={TEXTAREA_CLASS}
          placeholder="React, TypeScript, Testing…"
        />

        {missingKeywords.length > 0 ? (
          <div className="mt-2 max-h-20 overflow-y-auto [scrollbar-width:thin]">
            <div className="flex flex-wrap gap-1.5">
              {missingKeywords.map((keyword) => (
                <button
                  key={keyword}
                  type="button"
                  onClick={() => onAppendKeyword(keyword)}
                  className="rounded-md border border-sky-100 bg-sky-50 px-2 py-1 text-[11px] font-semibold text-sky-800 hover:bg-sky-100"
                >
                  + {keyword}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        <CvGapCoach
          missingKeywords={missingKeywords}
          existingSkillNames={Array.from(
            new Set(
              parseSkillEntries(sections.skills).map((e) => {
                if (!e.isWriteup) return e.text;
                const title = e.text.split(':')[0]?.trim();
                return title && title.length <= 56 ? title : '';
              }).filter(Boolean),
            ),
          )}
          hasExperience={hasExperience}
          weakOrEmptyBullets={weakOrEmptyBullets}
          roleHint={roleHint}
          targetRole={targetRole}
          company={company}
          jobDescriptionSnippet={jobDescriptionSnippet}
          onAppendKeyword={onAppendKeyword}
          onApplyFramed={onApplyCoachFramed}
        />
      </div>
    </StudioSectionCard>
  );
}
