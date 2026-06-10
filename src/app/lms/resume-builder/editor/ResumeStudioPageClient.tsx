'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  FileText,
  LayoutTemplate,
  RotateCcw,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LMS_CARD_CLASS } from '../../constants';
import { useLmsToast } from '../../components/ux/LmsToastProvider';
import CVEditor from '@/components/cveditor/CVEditor';
import { 
  fetchResumeHtml, 
  saveResumeHtml, 
  improveResumeText, 
  exportResumePdf 
} from '../../api/client';
import {
  ResumeEducation,
  ResumeExperience,
  useLmsState,
} from '../../state/LmsStateProvider';
import { resumeAtsRisks, resumeJobMatch, resumeRecruiterSimulation } from '../../data/ai-mock';
import { ResumeStudioNavigator } from './ResumeStudioNavigator';
import { ResumeStudioPreview } from './ResumeStudioPreview';
import {
  ResumeStudioBasicsSection,
  ResumeStudioSkillsSection,
  ResumeStudioSummarySection,
} from './ResumeStudioPrimarySections';
import {
  ResumeStudioCompletionSection,
  ResumeStudioEducationSection,
  ResumeStudioExperienceSection,
  ResumeStudioLayoutSection,
} from './ResumeStudioSecondarySections';
import {
  clampPct,
  getSectionStatus,
  parseSkillTokens,
  type DerivedSectionState,
  type ResumeSections,
  type SectionId,
  SECTION_DEFINITIONS,
} from './studio-config';

type CollapsibleSectionId = Exclude<SectionId, 'completion'>;

export function ResumeStudioPageClient() {
  const search = useSearchParams();
  const toast = useLmsToast();
  const {
    state,
    addPlannedItem,
    markResumeSaved,
    resetResumeDraft,
    setResumeDraftSections,
    setResumeTemplate,
    syncResumeDraftToBackend,
    generateResumeSummaryWithAi,
    analyzeResumeWithAi,
    syncResumeToCareerPath,
  } = useLmsState();

  const template = search.get('template');
  const focus = search.get('focus');

  const draft = state.resumeDraft;
  const sections = draft.sections;

  const [activeSection, setActiveSection] = useState<SectionId>('basics');
  const [collapsedSections, setCollapsedSections] = useState<Record<CollapsibleSectionId, boolean>>({
    basics: false,
    summary: false,
    experience: false,
    education: false,
    skills: false,
    layout: false,
  });
  const sectionRefs = useRef<Record<SectionId, HTMLDivElement | null>>({
    basics: null,
    summary: null,
    experience: null,
    education: null,
    skills: null,
    layout: null,
    completion: null,
  });

  const [editorMode, setEditorMode] = useState<'studio' | 'ai'>('studio');
  const [resumeHtml, setResumeHtml] = useState('');
  const [isHtmlLoading, setIsHtmlLoading] = useState(false);
  const [isHtmlSaving, setIsHtmlSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const editorScrollRef = useRef<HTMLElement | null>(null);
  const previewShellRef = useRef<HTMLElement | null>(null);
  const [editorPanelHeight, setEditorPanelHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const previewShell = previewShellRef.current;
    if (!previewShell || typeof ResizeObserver === 'undefined') return;

    const syncEditorHeight = () => {
      if (window.innerWidth < 1280) {
        setEditorPanelHeight(undefined);
        return;
      }
      setEditorPanelHeight(previewShell.getBoundingClientRect().height);
    };

    syncEditorHeight();

    const observer = new ResizeObserver(syncEditorHeight);
    observer.observe(previewShell);
    window.addEventListener('resize', syncEditorHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', syncEditorHeight);
    };
  }, [sections, draft.template, activeSection, editorMode]);

  useEffect(() => {
    const loadHtml = async () => {
      setIsHtmlLoading(true);
      try {
        const data = await fetchResumeHtml();
        if (data?.resume_html) {
          setResumeHtml(data.resume_html);
        }
      } catch (err) {
        console.error('Failed to load resume HTML', err);
      } finally {
        setIsHtmlLoading(false);
      }
    };
    loadHtml();
  }, []);

  useEffect(() => {
    if (editorMode === 'ai' && !resumeHtml && !isHtmlLoading) {
      if (sections.basics.name) {
        setResumeHtml(`
          <div class="resume-container">
            <h1>${sections.basics.name}</h1>
            <p>${sections.basics.headline}</p>
            <p>${sections.basics.location} | ${sections.basics.email}</p>
            <h2>Summary</h2>
            <p>${sections.summary}</p>
          </div>
        `);
      }
    }
  }, [editorMode, resumeHtml, sections.basics, isHtmlLoading]);

  const setSectionRef = useCallback(
    (id: SectionId) => (node: HTMLDivElement | null) => {
      sectionRefs.current[id] = node;
    },
    []
  );

  const expandSection = useCallback((id: CollapsibleSectionId) => {
    setCollapsedSections((current) =>
      current[id] ? { ...current, [id]: false } : current
    );
  }, []);

  const toggleSectionCollapse = useCallback((id: CollapsibleSectionId) => {
    setCollapsedSections((current) => ({ ...current, [id]: !current[id] }));
    setActiveSection(id);
  }, []);

  const scrollToSection = useCallback(
    (id: SectionId) => {
      if (id !== 'completion') {
        expandSection(id);
      }

      window.requestAnimationFrame(() => {
        const target = sectionRefs.current[id];
        const scrollContainer = editorScrollRef.current;
        if (!target) return;

        if (window.matchMedia('(min-width: 1280px)').matches && scrollContainer) {
          // Internal scrolling for desktop
          const top = target.offsetTop - 8; // Small buffer for top padding
          scrollContainer.scrollTo({ top, behavior: 'smooth' });
        } else {
          // Global window scrolling for mobile
          const nextTop = target.getBoundingClientRect().top + window.scrollY - 172;
          window.scrollTo({ top: nextTop, behavior: 'smooth' });
        }
        
        setActiveSection(id);
      });
    },
    [expandSection]
  );

  useEffect(() => {
    if (template) setResumeTemplate(template);
  }, [setResumeTemplate, template]);

  useEffect(() => {
    if (!focus) return;
    if (!SECTION_DEFINITIONS.some((section) => section.id === focus)) return;

    const frame = window.requestAnimationFrame(() => {
      scrollToSection(focus as SectionId);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [focus, scrollToSection]);

  useEffect(() => {
    const handleScroll = () => {
      const closest = SECTION_DEFINITIONS.map((section) => {
        const node = sectionRefs.current[section.id];
        if (!node) return { id: section.id, distance: Number.POSITIVE_INFINITY };
        return {
          id: section.id,
          distance: Math.abs(node.getBoundingClientRect().top - 188),
        };
      }).sort((left, right) => left.distance - right.distance)[0];

      if (closest) {
        setActiveSection((current) => (current === closest.id ? current : closest.id));
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const skillTokens = useMemo(() => parseSkillTokens(sections.skills), [sections.skills]);
  const draftText = `${sections.summary}\n${sections.skills}\n${sections.experience
    .map((entry) => `${entry.role} ${entry.company} ${entry.bullets}`)
    .join('\n')}`.toLowerCase();

  const missingKeywords = useMemo(
    () =>
      resumeRecruiterSimulation.missingKeywords.filter(
        (keyword) => !draftText.includes(keyword.toLowerCase())
      ),
    [draftText]
  );

  const basicsMissing = useMemo(() => {
    const missing: string[] = [];
    if (!sections.basics.name.trim()) missing.push('full name');
    if (!sections.basics.headline.trim()) missing.push('target headline');
    if (!sections.basics.email.trim()) missing.push('email');
    if (!sections.basics.phone.trim()) missing.push('phone');
    if (!sections.basics.location.trim()) missing.push('location');
    return missing;
  }, [sections.basics]);

  const summaryWordCount = useMemo(
    () => sections.summary.trim().split(/\s+/).filter(Boolean).length,
    [sections.summary]
  );

  const sectionStates = useMemo<Record<SectionId, DerivedSectionState>>(() => {
    const experienceFilled = sections.experience.length
      ? sections.experience.map((entry) => {
          const bullets = entry.bullets
            .split('\n')
            .map((bullet) => bullet.trim())
            .filter(Boolean);
          const score =
            (entry.company.trim() ? 1 : 0) +
            (entry.role.trim() ? 1 : 0) +
            (entry.duration.trim() ? 1 : 0) +
            (bullets.length > 0 ? 1 : 0) +
            (bullets.length >= 2 ? 1 : 0);
          return (score / 5) * 100;
        })
      : [];

    const educationFilled = sections.education.length
      ? sections.education.map((entry) => {
          const score =
            (entry.institution.trim() ? 1 : 0) +
            (entry.degree.trim() ? 1 : 0) +
            (entry.duration.trim() ? 1 : 0);
          return (score / 3) * 100;
        })
      : [];

    const basicsProgress = clampPct(((5 - basicsMissing.length) / 5) * 100);
    const summaryProgress = clampPct(
      sections.summary.trim().length === 0
        ? 0
        : Math.min(100, 35 + summaryWordCount * 2.2)
    );
    const experienceProgress = clampPct(
      sections.experience.length === 0
        ? 0
        : experienceFilled.reduce((sum, value) => sum + value, 0) / experienceFilled.length
    );
    const educationProgress = clampPct(
      sections.education.length === 0
        ? 0
        : educationFilled.reduce((sum, value) => sum + value, 0) / educationFilled.length
    );
    const skillsProgress = clampPct(
      sections.skills.trim().length === 0
        ? 0
        : Math.min(100, skillTokens.length * 12 + Math.max(0, 24 - missingKeywords.length * 6))
    );
    const layoutProgress = draft.template ? 100 : 62;

    return {
      basics: {
        id: 'basics',
        progress: basicsProgress,
        missing: basicsMissing.length > 0 ? [`Missing ${basicsMissing.join(', ')}`] : [],
        ...getSectionStatus(basicsProgress),
      },
      summary: {
        id: 'summary',
        progress: summaryProgress,
        missing:
          summaryWordCount === 0
            ? ['Add a concise recruiter-facing introduction']
            : summaryWordCount < 24
              ? ['Add more scope, outcomes, or target-role detail']
              : [],
        ...getSectionStatus(summaryProgress),
      },
      experience: {
        id: 'experience',
        progress: experienceProgress,
        missing:
          sections.experience.length === 0
            ? ['Add at least one recent role']
            : sections.experience.some((entry) => entry.bullets.trim().length === 0)
              ? ['Add bullets with outcomes for every role']
              : [],
        ...getSectionStatus(experienceProgress),
      },
      education: {
        id: 'education',
        progress: educationProgress,
        missing: sections.education.length === 0 ? ['Add education details or certification history'] : [],
        ...getSectionStatus(educationProgress),
      },
      skills: {
        id: 'skills',
        progress: skillsProgress,
        missing:
          missingKeywords.length > 0
            ? [`Consider adding: ${missingKeywords.slice(0, 3).join(', ')}`]
            : skillTokens.length === 0
              ? ['List the stack you want recruiters and ATS tools to catch']
              : [],
        ...getSectionStatus(skillsProgress),
      },
      layout: {
        id: 'layout',
        progress: layoutProgress,
        missing: draft.template ? [] : ['Choose a template that matches your target role'],
        ...getSectionStatus(layoutProgress),
      },
      completion: {
        id: 'completion',
        progress: 0,
        missing: [],
        ...getSectionStatus(0),
      },
    };
  }, [
    basicsMissing,
    draft.template,
    missingKeywords,
    sections.education,
    sections.experience,
    sections.skills,
    sections.summary,
    skillTokens.length,
    summaryWordCount,
  ]);

  const completedSectionsCount = useMemo(
    () =>
      ['basics', 'summary', 'experience', 'education', 'skills', 'layout'].filter(
        (sectionId) => sectionStates[sectionId as SectionId].status === 'complete'
      ).length,
    [sectionStates]
  );

  const editorProgress = useMemo(() => {
    const relevantSections = ['basics', 'summary', 'experience', 'education', 'skills', 'layout'];
    const total = relevantSections.reduce((sum, id) => sum + sectionStates[id as SectionId].progress, 0);
    return clampPct(total / relevantSections.length);
  }, [sectionStates]);

  const keywordCoverage = useMemo(() => {
    const total = resumeRecruiterSimulation.missingKeywords.length || 1;
    return clampPct(((total - missingKeywords.length) / total) * 100);
  }, [missingKeywords.length]);

  const atsReadiness = useMemo(
    () => clampPct(editorProgress * 0.7 + keywordCoverage * 0.3),
    [editorProgress, keywordCoverage]
  );

  const completionState = useMemo<DerivedSectionState>(() => {
    const missing: string[] = [];
    if (basicsMissing.length > 0) missing.push('Complete your contact block.');
    if (summaryWordCount < 24) missing.push('Strengthen the professional summary.');
    if (missingKeywords.length > 0) missing.push('Cover role-specific ATS keywords.');
    if (sections.experience.length === 0) missing.push('Add one or more experience entries.');
    if (sections.education.length === 0) missing.push('Fill in education or certification details.');

    return {
      id: 'completion',
      progress: editorProgress,
      missing,
      ...getSectionStatus(editorProgress),
    };
  }, [
    basicsMissing.length,
    editorProgress,
    missingKeywords.length,
    sections.education.length,
    sections.experience.length,
    summaryWordCount,
  ]);

  const targetRole = sections.basics.headline.trim() || 'Target role not set';

  const readinessHighlights = useMemo(() => {
    const highlights = [
      `${skillTokens.length || 0} core skill keywords mapped`,
      `${sections.experience.length} experience section${sections.experience.length === 1 ? '' : 's'} in draft`,
      `${completedSectionsCount}/6 primary sections recruiter-ready`,
    ];
    if (missingKeywords.length > 0) {
      highlights.push(`Missing keywords still visible: ${missingKeywords.slice(0, 2).join(', ')}`);
    }
    return highlights;
  }, [completedSectionsCount, missingKeywords, sections.experience.length, skillTokens.length]);

  const handleBasicsChange = (field: keyof ResumeSections['basics'], value: string) => {
    setResumeDraftSections({ basics: { ...sections.basics, [field]: value } });
  };

  const handleUpdateExperience = (id: string, field: keyof ResumeExperience, value: string) => {
    setResumeDraftSections({
      experience: sections.experience.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    });
  };

  const handleAddExperience = () => {
    const nextExperience: ResumeExperience = {
      id: `exp-${Date.now()}`,
      company: '',
      role: '',
      duration: '',
      bullets: '',
    };
    setResumeDraftSections({ experience: [nextExperience, ...sections.experience] });
    toast.push({
      title: 'Experience section expanded',
      message: 'A new role block is ready for bullet-driven edits.',
      tone: 'info',
    });
  };

  const handleUpdateEducation = (id: string, field: keyof ResumeEducation, value: string) => {
    setResumeDraftSections({
      education: sections.education.map((entry) =>
        entry.id === id ? { ...entry, [field]: value } : entry
      ),
    });
  };

  const handleAddEducation = () => {
    const nextEducation: ResumeEducation = {
      id: `edu-${Date.now()}`,
      institution: '',
      degree: '',
      duration: '',
    };
    setResumeDraftSections({ education: [nextEducation, ...sections.education] });
    toast.push({
      title: 'Education block added',
      message: 'Use this for formal education, bootcamps, or certifications.',
      tone: 'info',
    });
  };

  const handleImproveSummary = () => {
    const draftSummary = sections.summary.trim();
    const addition =
      'ATS-ready focus: Frontend engineer who improves component systems, accessibility quality, and measurable product performance.';
    const nextSummary = draftSummary.includes(addition)
      ? draftSummary
      : draftSummary
        ? `${draftSummary}\n\n${addition}`
        : addition;
    setResumeDraftSections({ summary: nextSummary });
    toast.push({
      title: 'Summary improved',
      message: 'Added a sharper recruiter-facing value proposition to the draft.',
      tone: 'info',
    });
  };

  const handleGenerateSummary = async () => {
    if (!sections.basics.headline.trim()) {
      toast.push({
        title: 'Headline required',
        message: 'Please set a headline in the Basics section first to guide the AI.',
        tone: 'warning',
      });
      return;
    }

    try {
      toast.push({
        title: 'Generating summary...',
        message: 'AI is crafting a professional overview based on your headline.',
        tone: 'info',
      });
      await generateResumeSummaryWithAi(sections.basics.headline);
      toast.push({
        title: 'Summary generated',
        message: 'A new professional summary has been drafted for you.',
        tone: 'success',
      });
    } catch (err) {
      toast.push({
        title: 'Generation failed',
        message: 'Could not generate summary with AI at this time.',
        tone: 'warning',
      });
    }
  };

  const handleAppendKeyword = (keyword: string) => {
    if (sections.skills.toLowerCase().includes(keyword.toLowerCase())) {
      toast.push({
        title: 'Keyword already present',
        message: `${keyword} is already included in your skills stack.`,
        tone: 'info',
      });
      return;
    }

    const nextSkills = sections.skills.trim() ? `${sections.skills.trim()}, ${keyword}` : keyword;
    setResumeDraftSections({ skills: nextSkills });
    toast.push({
      title: 'Keyword added',
      message: `${keyword} was added to the skills section.`,
      tone: 'success',
    });
  };

  const handleSaveHtml = async () => {
    setIsHtmlSaving(true);
    try {
      await saveResumeHtml(resumeHtml);
      toast.push({ title: 'Resume saved', message: 'Your rich-text changes were preserved.', tone: 'success' });
    } catch (err) {
      toast.push({ title: 'Save failed', message: 'Could not reach backend to save your content.', tone: 'warning' });
    } finally {
      setIsHtmlSaving(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      console.log('🚀 [Resume Studio] Starting Backend PDF Export...');
      let finalHtml = '';

      // If in studio mode, we prioritize the HTML from the actual preview DOM
      if (editorMode === 'studio') {
        const previewElement = document.getElementById('resume-preview') || 
                               document.getElementById('resume-preview-expanded') ||
                               document.querySelector('[id*="resume-preview"]');
        
        if (previewElement) {
          // Clone the preview to prepare it for PDF export (remove scaling/UI hacks)
          const clone = previewElement.cloneNode(true) as HTMLElement;
          clone.style.transform = 'none';
          clone.style.transformOrigin = 'unset';
          clone.style.width = '100%';
          clone.style.maxWidth = 'none';
          clone.style.margin = '0';
          clone.style.padding = '0';
          clone.style.boxShadow = 'none';
          
          finalHtml = clone.outerHTML;
        }
      }

      // Fallback to the rich-text state if studio capture failed or if in AI mode
      if (!finalHtml || finalHtml.includes('Start editing your resume...')) {
        finalHtml = resumeHtml;
      }

      if (!finalHtml || finalHtml.trim().length < 50 || finalHtml.includes('Start editing your resume...')) {
        toast.push({ 
          title: 'Content not found', 
          message: 'We could not capture the resume content. Please ensure you have added some details and try again.', 
          tone: 'warning' 
        });
        setIsExportingPdf(false);
        return;
      }

      const blob = await exportResumePdf(finalHtml);
      if (blob) {
        console.log('✅ [Resume Studio] PDF Blob received from backend');
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const fileName = sections.basics.name 
          ? `Resume_${sections.basics.name.replace(/\s+/g, '_')}.pdf`
          : 'My_Resume.pdf';
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        toast.push({ title: 'Export complete', message: 'Your PDF has been generated successfully.', tone: 'success' });
      }
    } catch (err: any) {
      console.error('❌ [Resume Studio] PDF Export Critical Failure:', err);
      const userMessage = err.message || 'Could not generate PDF on the server. Please try again later.';
      toast.push({ 
        title: 'Export failed', 
        message: userMessage, 
        tone: 'error' 
      });
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleAnalyzeResume = async () => {
    try {
      await analyzeResumeWithAi();
      toast.push({ title: 'Analysis complete', message: 'AI has evaluated your readiness.', tone: 'success' });
    } catch (err) {
      toast.push({ title: 'Analysis failed', message: 'Could not analyze resume.', tone: 'warning' });
    }
  };

  const handleSyncResume = async () => {
    const toastId = `sync-${Date.now()}`;
    const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
    try {
      toast.push({ id: toastId, title: 'Saving draft...', message: 'Syncing with secure cloud storage.', tone: 'info' });
      await Promise.all([syncResumeDraftToBackend(), minDelay]);
      toast.dismiss(toastId);
      toast.push({
        title: 'Draft saved',
        message: 'Your resume studio state was preserved in the database.',
        tone: 'success'
      });
      await syncResumeToCareerPath();
    } catch (err: any) {
      toast.dismiss(toastId);
      const errorMessage = err?.message || 'Could not sync with backend. Local changes are still active.';
      toast.push({
        title: 'Save failed',
        message: errorMessage,
        tone: 'error'
      });
    }
  };

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            @media print {
              body * { visibility: hidden; }
              #resume-preview, #resume-preview * { visibility: visible; }
              #resume-preview {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                max-width: none !important;
                min-height: auto !important;
                transform: none !important;
                transform-origin: top left !important;
                box-shadow: none !important;
                border: none !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
              }
              .hide-on-print {
                display: none !important;
              }
              .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
              }
              .custom-scrollbar::-webkit-scrollbar-track {
                background: transparent;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb {
                background: #e2e8f0;
                border-radius: 10px;
              }
              .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                background: #cbd5e1;
              }
            }
          `,
        }}
      />

      <div className="w-full min-w-0 max-w-full space-y-6 overflow-x-hidden pb-12">
        <div className="space-y-6">
          {editorMode === 'studio' ? (
            <>
              <section className="hide-on-print">
                <ResumeStudioNavigator
                  activeSection={activeSection}
                  completionState={completionState}
                  editorProgress={editorProgress}
                  keywordCoverage={keywordCoverage}
                  atsReadiness={atsReadiness}
                  onSelect={scrollToSection}
                  sectionStates={sectionStates}
                  analysis={draft.analysis}
                />
              </section>

              <div className="grid min-w-0 grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)] xl:items-start xl:gap-6 2xl:grid-cols-[minmax(0,1fr)_480px] 2xl:gap-8">
                <aside
                  id="resume-preview-shell"
                  ref={previewShellRef}
                  className="hide-on-print hidden flex-col gap-5 xl:sticky xl:top-[calc(var(--app-header-height,5.75rem)+0.75rem)] xl:flex"
                >
                  <ResumeStudioPreview 
                    sections={sections} 
                    template={draft.template} 
                    activeSection={activeSection} 
                    resumeHtml={resumeHtml}
                    onDownload={handleExportPdf}
                  />
                </aside>

                <main 
                  ref={editorScrollRef}
                  style={editorPanelHeight ? { height: editorPanelHeight } : undefined}
                  className="relative min-w-0 space-y-4 xl:min-h-0 xl:overflow-y-auto xl:pr-2 xl:pt-0 xl:custom-scrollbar"
                >
                  <ResumeStudioBasicsSection
                    collapsed={collapsedSections.basics}
                    sections={sections}
                    sectionState={sectionStates.basics}
                    sectionRef={setSectionRef('basics')}
                    onToggleCollapse={() => toggleSectionCollapse('basics')}
                    onBasicsChange={handleBasicsChange}
                  />

                  <ResumeStudioSummarySection
                    collapsed={collapsedSections.summary}
                    sections={sections}
                    sectionState={sectionStates.summary}
                    sectionRef={setSectionRef('summary')}
                    summaryWordCount={summaryWordCount}
                    onToggleCollapse={() => toggleSectionCollapse('summary')}
                    onImproveSummary={handleImproveSummary}
                    onGenerateSummary={handleGenerateSummary}
                    onSummaryChange={(value) => setResumeDraftSections({ summary: value })}
                  />

                  <ResumeStudioExperienceSection
                    collapsed={collapsedSections.experience}
                    onAddExperience={handleAddExperience}
                    onToggleCollapse={() => toggleSectionCollapse('experience')}
                    onRemoveExperience={(id) =>
                      setResumeDraftSections({
                        experience: sections.experience.filter((entry) => entry.id !== id),
                      })
                    }
                    onUpdateExperience={handleUpdateExperience}
                    sectionRef={setSectionRef('experience')}
                    sectionState={sectionStates.experience}
                    sections={sections}
                  />

                  <ResumeStudioEducationSection
                    collapsed={collapsedSections.education}
                    onAddEducation={handleAddEducation}
                    onToggleCollapse={() => toggleSectionCollapse('education')}
                    onRemoveEducation={(id) =>
                      setResumeDraftSections({
                        education: sections.education.filter((entry) => entry.id !== id),
                      })
                    }
                    onUpdateEducation={handleUpdateEducation}
                    sectionRef={setSectionRef('education')}
                    sectionState={sectionStates.education}
                    sections={sections}
                  />

                  <ResumeStudioSkillsSection
                    collapsed={collapsedSections.skills}
                    missingKeywords={missingKeywords}
                    onToggleCollapse={() => toggleSectionCollapse('skills')}
                    sectionRef={setSectionRef('skills')}
                    sectionState={sectionStates.skills}
                    sections={sections}
                    skillTokens={skillTokens}
                    onAppendKeyword={handleAppendKeyword}
                    onSkillsChange={(value) => setResumeDraftSections({ skills: value })}
                  />

                  <ResumeStudioLayoutSection
                    collapsed={collapsedSections.layout}
                    currentTemplate={draft.template}
                    onToggleCollapse={() => toggleSectionCollapse('layout')}
                    onSelectTemplate={(templateId, templateLabel) => {
                      setResumeTemplate(templateId);
                      toast.push({ title: 'Template updated', message: templateLabel, tone: 'info' });
                    }}
                    sectionRef={setSectionRef('layout')}
                    sectionState={sectionStates.layout}
                    sections={sections}
                  />

                  <ResumeStudioCompletionSection
                    sectionRef={(node) => (sectionRefs.current.completion = node)}
                    completionState={sectionStates.completion}
                    editorProgress={editorProgress}
                    atsReadiness={atsReadiness}
                    keywordCoverage={keywordCoverage}
                    readinessHighlights={readinessHighlights}
                    draftStatus={draft.updatedAtLabel}
                    targetRole={targetRole}
                    analysis={draft.analysis}
                    isAnalyzing={draft.isAnalyzing}
                    onAnalyze={handleAnalyzeResume}
                    onSync={handleSyncResume}
                  />
                </main>
              </div>
            </>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              {isHtmlLoading ? (
                <div className="flex min-h-[600px] items-center justify-center rounded-[2rem] border border-slate-200 bg-white/50 backdrop-blur-sm">
                  <div className="text-center">
                    <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-sky-600"></div>
                    <p className="mt-4 text-sm font-bold text-slate-600">Syncing AI documents...</p>
                  </div>
                </div>
              ) : (
                <div className="overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-2xl">
                   <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                     <div>
                       <h3 className="text-sm font-bold text-slate-900">AI Rich Editor</h3>
                       <p className="text-xs text-slate-500 font-medium">Free-form editing with TipTap and AI improvement tools.</p>
                     </div>
                     <div className="flex gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700 border border-amber-100">
                          <Sparkles className="h-3 w-3" />
                          AI POWERED
                        </span>
                     </div>
                   </div>
                   <CVEditor
                     content={resumeHtml}
                     onUpdate={setResumeHtml}
                     onImproveText={improveResumeText}
                   />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
