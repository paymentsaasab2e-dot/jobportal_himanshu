'use client';

import type { CSSProperties, ReactNode, Ref } from 'react';
import { 
  Expand, 
  X, 
  Download, 
  Sparkles, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  Mail, 
  Phone,
  Layout,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LmsStatusBadge } from '../../components/ux/LmsStatusBadge';
import ArcticTemplate from '@/components/cvtemplates/ArcticTemplate';
import ObsidianTemplate from '@/components/cvtemplates/ObsidianTemplate';
import SerifClassicTemplate from '@/components/cvtemplates/SerifClassicTemplate';
import {
  parseSkillTokens,
  prettifyTemplate,
  type ResumeSections,
  type SectionId,
} from './studio-config';

function DocumentSection({
  active,
  title,
  children,
}: {
  active: boolean;
  title: string;
  children: ReactNode;
}) {
  return (
    <section
      className={`rounded-2xl border px-4 py-3 transition-all duration-200 ${
        active
          ? 'border-sky-200 bg-sky-50/70 shadow-[0_10px_30px_-22px_rgba(40,168,225,0.7)]'
          : 'border-transparent bg-transparent'
      }`}
    >
      <h3 className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">{title}</h3>
      <div className="mt-2">{children}</div>
    </section>
  );
}

export function ResumeDocumentPaper({
  activeSection,
  contentId,
  paperRef,
  sections,
  style,
  template,
  className = '',
}: {
  activeSection: SectionId;
  contentId: string;
  paperRef?: Ref<HTMLDivElement>;
  sections: ResumeSections;
  style?: CSSProperties;
  template: string | null;
  className?: string;
}) {
  const fontClass = template === 'technical-depth' ? 'font-serif' : 'font-sans';

  // Map studio sections to template data structure
  const templateData = {
    name: sections.basics.name || 'Your Name',
    title: sections.basics.headline || 'Target headline',
    contact: {
      email: sections.basics.email,
      phone: sections.basics.phone,
      location: sections.basics.location,
    },
    summary: sections.summary,
    skills: parseSkillTokens(sections.skills).map(name => ({ name, level: 90 })),
    experience: sections.experience.map(exp => ({
      role: exp.role,
      company: exp.company,
      period: exp.duration,
      description: exp.bullets,
      tags: exp.bullets.split('\n').filter(b => b.startsWith('#')).map(b => b.slice(1).trim())
    })),
    education: sections.education.map(edu => ({
      degree: edu.degree,
      school: edu.institution,
      year: edu.duration,
    })),
  };

  if (template === 'arctic') {
    return (
      <div id={contentId} ref={paperRef} style={style} className={`mx-auto w-full max-w-[840px] shadow-none ${className}`}>
        <ArcticTemplate data={templateData} />
      </div>
    );
  }

  if (template === 'obsidian') {
    return (
      <div id={contentId} ref={paperRef} style={style} className={`mx-auto w-full max-w-[840px] shadow-none ${className}`}>
        <ObsidianTemplate data={templateData} />
      </div>
    );
  }

  if (template === 'serif-classic') {
    return (
      <div id={contentId} ref={paperRef} style={style} className={`mx-auto w-full max-w-[840px] shadow-none ${className}`}>
        <SerifClassicTemplate data={templateData} />
      </div>
    );
  }

  const headerClass =
    template === 'impact-focused'
      ? 'border-b-2 border-slate-950 pb-5 text-center'
      : template === 'modern-minimal'
        ? 'border-b border-slate-200 pb-5'
        : 'border-b border-slate-300 pb-5';

  return (
    <div
      id={contentId}
      ref={paperRef}
      style={style}
      className={`mx-auto min-h-[960px] w-full max-w-[840px] bg-white px-7 py-8 text-slate-900 shadow-none sm:px-10 sm:py-10 ${fontClass} ${className}`}
    >
      <header className={headerClass}>
        <h1
          className={`text-3xl font-black tracking-tight text-slate-950 ${
            template === 'impact-focused' ? 'text-center' : ''
          }`}
        >
          {sections.basics.name || 'Your Name'}
        </h1>
        <p
          className={`mt-2 text-sm font-bold uppercase tracking-[0.32em] text-slate-600 ${
            template === 'impact-focused' ? 'text-center' : ''
          }`}
        >
          {sections.basics.headline || 'Target headline'}
        </p>

        <div
          className={`mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500 ${
            template === 'impact-focused' ? 'justify-center' : ''
          }`}
        >
          {sections.basics.location ? <span>{sections.basics.location}</span> : null}
          {sections.basics.phone ? <span>{sections.basics.phone}</span> : null}
          {sections.basics.email ? <span>{sections.basics.email}</span> : null}
        </div>
      </header>

      <div className="mt-6 space-y-5">
        {sections.summary.trim() ? (
          <DocumentSection active={activeSection === 'summary'} title="Professional Summary">
            <p className="text-[13px] leading-6 text-slate-700">{sections.summary}</p>
          </DocumentSection>
        ) : null}

        {sections.skills.trim() ? (
          <DocumentSection active={activeSection === 'skills'} title="Core Skills">
            <div className="flex flex-wrap gap-2">
              {parseSkillTokens(sections.skills).map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-700"
                >
                  {skill}
                </span>
              ))}
            </div>
          </DocumentSection>
        ) : null}

        {sections.experience.length > 0 ? (
          <DocumentSection active={activeSection === 'experience'} title="Professional Experience">
            <div className="space-y-5">
              {sections.experience.map((entry) => {
                const bullets = entry.bullets
                  .split('\n')
                  .map((bullet) => bullet.replace(/^- /, '').trim())
                  .filter(Boolean);
                return (
                  <article key={entry.id}>
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">
                          {entry.role || 'Role'}
                        </h4>
                        <p className="text-[12px] font-semibold text-slate-600">
                          {entry.company || 'Company'}
                        </p>
                      </div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {entry.duration || 'Duration'}
                      </p>
                    </div>
                    {bullets.length > 0 ? (
                      <ul className="mt-3 list-disc space-y-1 pl-4 text-[12px] leading-5 text-slate-700">
                        {bullets.map((bullet) => (
                          <li key={`${entry.id}-${bullet}`}>{bullet}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="mt-2 text-[12px] text-slate-400">
                        Add measurable bullets to strengthen this role.
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          </DocumentSection>
        ) : null}

        {sections.education.length > 0 ? (
          <DocumentSection active={activeSection === 'education'} title="Education">
            <div className="space-y-4">
              {sections.education.map((entry) => (
                <article key={entry.id} className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">
                      {entry.institution || 'Institution'}
                    </h4>
                    <p className="text-[12px] font-medium text-slate-600">
                      {entry.degree || 'Degree'}
                    </p>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    {entry.duration || 'Year'}
                  </p>
                </article>
              ))}
            </div>
          </DocumentSection>
        ) : null}

        {activeSection === 'basics' ? (
          <DocumentSection active title="Header signal">
            <p className="text-[12px] text-slate-600">
              Your identity block is where recruiter scan confidence starts. Keep your headline specific and your contact line complete.
            </p>
          </DocumentSection>
        ) : null}
      </div>
    </div>
  );
}

export function ResumeStudioPreview({
  activeSection,
  onDownload,
  resumeHtml,
  sections,
  template,
}: {
  activeSection: SectionId;
  onDownload?: () => void;
  resumeHtml?: string;
  sections: ResumeSections;
  template: string | null;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const canRenderPortal = typeof document !== 'undefined';
  const inlineFrameRef = useRef<HTMLDivElement | null>(null);
  const inlinePaperRef = useRef<HTMLDivElement | null>(null);
  const [inlineScale, setInlineScale] = useState(0.42);
  const [inlinePaperHeight, setInlinePaperHeight] = useState(1080);
  const inlinePaperWidth = 840;

  useEffect(() => {
    const frame = inlineFrameRef.current;
    const paper = inlinePaperRef.current;
    if (!frame || !paper || typeof ResizeObserver === 'undefined') return;

    const measure = () => {
      const availableWidth = Math.max(240, frame.clientWidth - 18);
      const nextScale = Math.min(1, availableWidth / inlinePaperWidth);
      setInlineScale(nextScale);
      setInlinePaperHeight(paper.scrollHeight);
    };

    measure();

    const frameObserver = new ResizeObserver(measure);
    const paperObserver = new ResizeObserver(measure);
    frameObserver.observe(frame);
    paperObserver.observe(paper);

    window.addEventListener('resize', measure);

    return () => {
      frameObserver.disconnect();
      paperObserver.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, []);

  useEffect(() => {
    if (!isExpanded) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsExpanded(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isExpanded]);

  const inlineScaledWidth = inlinePaperWidth * inlineScale;
  const inlineScaledHeight = inlinePaperHeight * inlineScale;
  const inlineViewportHeight = Math.max(inlineScaledHeight + 12, 600);

  return (
    <>
      <div className="flex h-full flex-col rounded-[2rem] border border-slate-200/80 bg-gradient-to-b from-slate-100 via-slate-50 to-white p-4 shadow-[0_24px_60px_-36px_rgba(15,23,42,0.35)] sm:p-5">
        <div className="mb-4 flex items-center justify-between gap-3 px-1">
          <div className="flex items-center gap-3">
             <div className="flex h-7 items-center rounded-lg bg-sky-600 px-3 text-[10px] font-black uppercase tracking-widest text-white shadow-sm">
                STUDIO PREVIEW
             </div>
             
             {onDownload && (
               <button
                 onClick={onDownload}
                 className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-[10px] font-bold text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-sky-600 active:scale-95"
               >
                 <Download className="h-3 w-3" />
                 DOWNLOAD
               </button>
             )}
          </div>
          
          <LmsStatusBadge 
            label="System Template" 
            tone="info" 
          />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_28px_60px_-34px_rgba(15,23,42,0.25)]">
          <div className="border-b border-slate-100 bg-slate-50/80 px-5 py-3">
            <div className="flex items-center justify-between gap-3 text-xs text-slate-500">
              <span className="font-semibold">Resume document</span>
                <button
                  type="button"
                  onClick={() => setIsExpanded(true)}
                  className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 font-semibold text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
                >
                  <Expand className="h-3.5 w-3.5" strokeWidth={2} />
                  A4 preview
                </button>
            </div>
          </div>

          <div
            ref={inlineFrameRef}
            className="flex-1 overflow-y-auto bg-[linear-gradient(180deg,#ffffff_0%,#ffffff_78%,#f8fafc_100%)] py-4"
          >
            <div
              className="mx-auto"
              style={{
                width: inlineScaledWidth,
                minHeight: inlineScaledHeight,
              }}
            >
              <ResumeDocumentPaper
                activeSection={activeSection}
                contentId="resume-preview"
                paperRef={inlinePaperRef}
                className="!mx-0 !max-w-none"
                style={{
                  width: inlinePaperWidth,
                  transform: `scale(${inlineScale})`,
                  transformOrigin: 'top left',
                }}
                sections={sections}
                template={template}
              />
            </div>
          </div>
        </div>
      </div>

      {isExpanded && canRenderPortal
        ? createPortal(
            <div className="fixed inset-0 z-[560]">
              <button
                type="button"
                aria-label="Close full preview"
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
                onClick={() => setIsExpanded(false)}
              />

              <div className="absolute inset-0 flex items-center justify-center p-4 sm:p-6">
                <div className="relative flex h-[92vh] w-full max-w-[1120px] flex-col overflow-hidden rounded-[2rem] border border-white/50 bg-white/92 shadow-[0_32px_90px_-34px_rgba(15,23,42,0.55)] backdrop-blur-xl">
                  <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white/85 px-5 py-4 sm:px-6">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-slate-400">Full document preview</p>
                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {prettifyTemplate(template)} · A4 resume view
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsExpanded(false)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                    >
                      <X className="h-4 w-4" strokeWidth={2} />
                      Close
                    </button>
                  </div>

                  <div className="flex-1 overflow-auto bg-[radial-gradient(circle_at_top,#eef6ff,transparent_35%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_52%,#f8fafc_100%)] px-4 py-6 sm:px-8">
                    <div className="mx-auto w-full max-w-[900px] rounded-[2rem] border border-slate-200 bg-white shadow-[0_24px_60px_-30px_rgba(15,23,42,0.32)]">
                      <ResumeDocumentPaper
                        activeSection={activeSection}
                        contentId="resume-preview-expanded"
                        sections={sections}
                        template={template}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
