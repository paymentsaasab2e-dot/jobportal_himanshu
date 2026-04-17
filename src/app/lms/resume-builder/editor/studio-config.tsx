'use client';

import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  GraduationCap,
  LayoutTemplate,
  ScrollText,
  Sparkles,
  UserRound,
} from 'lucide-react';
import { LMS_CARD_CLASS, LMS_SECTION_TITLE } from '../../constants';
import { LmsStatusBadge } from '../../components/ux/LmsStatusBadge';
import type { ResumeEducation, ResumeExperience } from '../../state/LmsStateProvider';

export type SectionId =
  | 'basics'
  | 'summary'
  | 'experience'
  | 'education'
  | 'skills'
  | 'layout'
  | 'completion';

export type SectionStatus = 'complete' | 'progress' | 'warning';

export type SectionDescriptor = {
  id: SectionId;
  label: string;
  helper: string;
  icon: LucideIcon;
};

export type DerivedSectionState = {
  id: SectionId;
  progress: number;
  status: SectionStatus;
  statusLabel: string;
  missing: string[];
};

export type ResumeSections = {
  basics: {
    name: string;
    headline: string;
    email: string;
    phone: string;
    location: string;
  };
  summary: string;
  skills: string;
  experience: ResumeExperience[];
  education: ResumeEducation[];
};

export const SECTION_DEFINITIONS: SectionDescriptor[] = [
  { id: 'basics', label: 'Basics', helper: 'Identity and contact', icon: UserRound },
  { id: 'summary', label: 'Professional Summary', helper: 'Recruiter-facing intro', icon: ScrollText },
  { id: 'experience', label: 'Experience', helper: 'Impact and outcomes', icon: Briefcase },
  { id: 'education', label: 'Education', helper: 'Degree and timeline', icon: GraduationCap },
  { id: 'skills', label: 'Skills', helper: 'ATS keywords and strengths', icon: Sparkles },
  { id: 'layout', label: 'Layout', helper: 'Template and presentation', icon: LayoutTemplate },
  { id: 'completion', label: 'Finish', helper: 'Readiness and sync', icon: CheckCircle2 },
] as const;

export const TEMPLATE_OPTIONS = [
  {
    id: 'modern-minimal',
    label: 'Modern minimal',
    hint: 'Balanced spacing, clean hierarchy, and calm recruiter-first typography.',
    accent: 'from-sky-500/10 via-white to-white',
  },
  {
    id: 'impact-focused',
    label: 'Impact focused',
    hint: 'Metrics-forward framing with stronger headline emphasis.',
    accent: 'from-emerald-500/10 via-white to-white',
  },
  {
    id: 'technical-depth',
    label: 'Technical depth',
    hint: 'A denser document voice for projects, systems, and stack-heavy roles.',
    accent: 'from-violet-500/10 via-white to-white',
  },
  {
    id: 'arctic',
    label: 'Arctic',
    hint: 'A cool, crisp workspace with precise geometry and expansive whitespace.',
    accent: 'from-blue-500/10 via-white to-white',
  },
  {
    id: 'obsidian',
    label: 'Obsidian',
    hint: 'High-contrast, dark-mode inspired elegance for senior executive presence.',
    accent: 'from-slate-900/10 via-white to-white',
  },
  {
    id: 'serif-classic',
    label: 'Serif Classic',
    hint: 'Timeless typographic authority using premium serif font faces.',
    accent: 'from-amber-700/10 via-white to-white',
  },
] as const;

export const INPUT_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.02)] outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100';

export const TEXTAREA_CLASS =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 shadow-[0_1px_0_rgba(15,23,42,0.02)] outline-none transition-all placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100 resize-y';

export function clampPct(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

export function prettifyTemplate(template: string | null) {
  if (!template) return 'Default studio layout';
  return template
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function parseSkillTokens(skills: string) {
  return Array.from(
    new Set(
      skills
        .split(/[\n,]/)
        .map((entry) => entry.trim())
        .filter(Boolean)
    )
  );
}

export function completionTone(status: SectionStatus) {
  if (status === 'complete') return 'success' as const;
  if (status === 'warning') return 'warning' as const;
  return 'info' as const;
}

export function getSectionStatus(progress: number): {
  status: SectionStatus;
  statusLabel: string;
} {
  if (progress >= 90) return { status: 'complete', statusLabel: 'Ready' };
  if (progress >= 50) return { status: 'progress', statusLabel: 'In progress' };
  return { status: 'warning', statusLabel: 'Needs details' };
}

export function SectionStatusIcon({ status }: { status: SectionStatus }) {
  if (status === 'complete') {
    return <CheckCircle2 className="h-4 w-4 text-emerald-600" strokeWidth={2.2} />;
  }
  if (status === 'warning') {
    return <AlertTriangle className="h-4 w-4 text-amber-600" strokeWidth={2.2} />;
  }
  return <CircleDashed className="h-4 w-4 text-slate-400" strokeWidth={2.2} />;
}

export function StudioField({
  label,
  children,
}: {
  label?: string;
  helper?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      {label && (
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-400 translate-x-1">
          {label}
        </span>
      )}
      {children}
    </label>
  );
}

export function StudioSectionCard({
  id,
  title,
  helper,
  progress,
  statusLabel,
  status,
  icon: Icon,
  accent,
  actions,
  collapsed = false,
  collapsible = false,
  onToggleCollapse,
  sectionRef,
  children,
}: {
  id: SectionId;
  title: string;
  helper: string;
  progress: number;
  statusLabel: string;
  status: SectionStatus;
  icon: LucideIcon;
  accent: string;
  actions?: ReactNode;
  collapsed?: boolean;
  collapsible?: boolean;
  onToggleCollapse?: () => void;
  sectionRef: (node: HTMLDivElement | null) => void;
  children: ReactNode;
}) {
  return (
    <section
      ref={sectionRef}
      data-resume-section={id}
      className={`${LMS_CARD_CLASS} !p-4 overflow-hidden border-slate-200/90 bg-white shadow-[0_12px_32px_-20px_rgba(15,23,42,0.18)]`}
    >
      <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`} />
      
      <div
        className={`flex flex-wrap items-center justify-between gap-3 ${
          collapsed ? '' : 'border-b border-slate-100 pb-3'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-white shadow-sm">
            <Icon className="h-4 w-4" strokeWidth={2.1} />
          </div>
          <h2 className="text-base font-bold tracking-tight text-slate-900 truncate">{title}</h2>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <LmsStatusBadge label={`${progress}%`} tone={completionTone(status)} />
          <LmsStatusBadge label={statusLabel} tone={completionTone(status)} />
          {actions}
          {collapsible ? (
            <button
              type="button"
              onClick={onToggleCollapse}
              aria-expanded={!collapsed}
              aria-label={collapsed ? `Expand ${title}` : `Collapse ${title}`}
              className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:bg-slate-50 hover:text-slate-900"
            >
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  collapsed ? 'rotate-0' : 'rotate-180'
                }`}
                strokeWidth={2.4}
              />
            </button>
          ) : null}
        </div>
      </div>

      {!collapsed ? <div className="mt-4">{children}</div> : null}
    </section>
  );
}
