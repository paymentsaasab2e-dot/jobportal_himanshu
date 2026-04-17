/* eslint-disable react/no-unescaped-entities */
'use client';

import { useEffect } from 'react';
import { FileText, LayoutTemplate, Sparkles, Briefcase, Bot, Eye, X, Check, AlertTriangle } from 'lucide-react';
import { LMS_CARD_CLASS, LMS_CARD_INTERACTIVE, LMS_PAGE_SUBTITLE, LMS_SECTION_TITLE } from '../constants';
import { AISectionHeading, AIScoreCard, AIActionChips } from '../components/ai';
import {
  resumeAIScores,
  resumeAIImprovements,
  resumeAIChips,
  resumeRecruiterSimulation,
  resumeJobMatch,
  resumeBeforeAfter,
  resumeAtsRisks,
  lmsSharedIntelligence,
} from '../data/ai-mock';
import Link from 'next/link';
import { useLmsToast } from '../components/ux/LmsToastProvider';
import { useLmsState } from '../state/LmsStateProvider';
import { useRouter } from 'next/navigation';

const TEMPLATES = [
  { name: 'Modern minimal', hint: 'Clean sections, strong hierarchy', icon: LayoutTemplate },
  { name: 'Impact focused', hint: 'Metrics-forward for product & growth', icon: Sparkles },
  { name: 'Technical depth', hint: 'Projects and stack up front', icon: Briefcase },
];

export default function LmsResumeBuilderPage() {
  const router = useRouter();
  const toast = useLmsToast();
  const { state, setResumeTemplate, analyzeResumeWithAi } = useLmsState();
  const hasDraft = state.resumeDraft.updatedAtLabel !== 'Not saved yet';

  useEffect(() => {
    if (hasDraft && !state.resumeDraft.analysis && !state.resumeDraft.isAnalyzing) {
      analyzeResumeWithAi();
    }
  }, [hasDraft, state.resumeDraft.analysis, state.resumeDraft.isAnalyzing, analyzeResumeWithAi]);

  const analysis = state.resumeDraft.analysis;
  const isAnalyzing = state.resumeDraft.isAnalyzing;

  const dynamicScores = analysis ? [
    { id: 'ats', title: 'ATS Score', score: analysis.readinessScore, text: 'Keyword overlap and structural parsing.' },
    { id: 'impact', title: 'Impact score', score: Math.round(analysis.readinessScore * 0.9), text: 'Measurable results in bullets.' },
    { id: 'readability', title: 'Readability', score: 85, text: 'Layout and visual scanning.' },
  ] : resumeAIScores;
  return (
    <div className="space-y-8">
      <div className="min-w-0 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1 tracking-tight">Resume builder</h1>
          <p className={LMS_PAGE_SUBTITLE}>
            Conversion-focused flow — recruiter scan, job match, and ATS risk before you apply (mock).
          </p>
        </div>
        <Link
          href="/lms/resume-builder/editor"
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md hover:scale-[1.01] active:scale-[0.98] cursor-pointer shrink-0"
        >
          <FileText className="h-4 w-4" strokeWidth={2} />
          {hasDraft ? 'Continue editing' : 'Create resume'}
        </Link>
      </div>

      <p className="text-xs font-medium text-gray-500 border-l-2 border-violet-200 pl-3 -mt-2">
        Linked to career engine: {lmsSharedIntelligence.resumeToReadiness}
      </p>

      <section className="space-y-4 rounded-2xl border border-violet-100 bg-white/70 p-5 sm:p-6 shadow-sm transition-shadow duration-200 hover:shadow-md">
        <AISectionHeading title="AI resume assistant" />
        <p className="text-sm font-normal text-gray-500 -mt-2">
          Mock scores and suggestions — designed to map 1:1 to future analyzer endpoints.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {isAnalyzing ? (
            <div className="col-span-3 flex py-10 items-center justify-center gap-3 text-[#28A8E1]">
              <Sparkles className="h-6 w-6 animate-pulse" />
              <p className="font-bold">AI is analyzing your resume content...</p>
            </div>
          ) : (
            dynamicScores.map((s) => (
              <AIScoreCard key={s.id} title={s.title} score={s.score} supportingText={s.text} visual="bar" />
            ))
          )}
        </div>

        <div className={`${LMS_CARD_CLASS} transition-all duration-200 hover:shadow-md`}>
          <div className="flex items-center gap-2 mb-3">
            <Bot className="h-5 w-5 text-violet-600" strokeWidth={2} />
            <h3 className="text-base font-bold text-gray-900">Suggested improvements</h3>
          </div>
          <ul className="list-disc pl-5 space-y-2 text-sm font-normal text-gray-600">
            {analysis?.nextSteps?.length 
              ? analysis.nextSteps.map((line) => <li key={line}>{line}</li>)
              : resumeAIImprovements.map((line) => (
                <li key={line}>{line}</li>
              ))
            }
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-900">Quick AI actions</p>
          <AIActionChips
            actions={resumeAIChips}
            onAction={(a) => {
              if (a.id === 'summary') return router.push('/lms/resume-builder/editor?focus=summary');
              if (a.id === 'bullets') return router.push('/lms/resume-builder/editor?focus=experience');
              if (a.id === 'kw') return router.push('/lms/resume-builder/editor?focus=skills');
              if (a.id === 'tailor') return router.push('/lms/resume-builder/editor?focus=summary');
              toast.push({ title: 'AI action (mock)', message: a.label, tone: 'info' });
            }}
          />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Eye className="h-5 w-5 text-gray-800" strokeWidth={2} />
          <h2 className={LMS_SECTION_TITLE}>Recruiter simulation mode</h2>
        </div>
        <div className={`${LMS_CARD_CLASS} transition-all duration-200 hover:shadow-md border-slate-200`}>
          <p className="text-sm font-bold text-gray-900">
            {resumeRecruiterSimulation.scanSeconds} sec scan result
          </p>
          <p className="mt-2 text-sm font-normal text-gray-500">
            {analysis?.recruiterView || "First impression: strong layout; keywords for testing & measurable impact need work."}
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase text-gray-400 mb-1">Identified Strengths</p>
              <ul className="text-sm font-semibold text-emerald-800 space-y-1">
                {analysis?.strengths?.length 
                  ? analysis.strengths.map((k) => <li key={k}>· {k}</li>)
                  : resumeRecruiterSimulation.missingKeywords.map((k) => (
                    <li key={k}>· {k}</li>
                  ))
                }
              </ul>
            </div>
            <div>
              <p className="text-xs font-bold uppercase text-gray-400 mb-1">Gaps found</p>
              <ul className="text-sm font-normal text-gray-600 space-y-1">
                {analysis?.gaps?.length
                  ? analysis.gaps.map((b) => <li key={b}>“{b}”</li>)
                  : resumeRecruiterSimulation.weakBullets.map((b) => (
                    <li key={b}>“{b}”</li>
                  ))
                }
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={LMS_SECTION_TITLE}>Job match score</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className={`${LMS_CARD_CLASS} lg:col-span-2 transition-all duration-200 hover:shadow-md`}>
            <p className="text-sm font-normal text-gray-500">Target posting (mock)</p>
            <p className="text-lg font-bold text-gray-900 mt-1">
              {resumeJobMatch.title} @ {resumeJobMatch.company}
            </p>
            <ul className="mt-3 space-y-1 text-sm font-normal text-gray-600">
              {resumeJobMatch.improve.map((i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#28A8E1] font-bold">→</span>
                  {i}
                </li>
              ))}
            </ul>
          </div>
          <AIScoreCard
            title="Match score"
            score={resumeJobMatch.score}
            supportingText="Weighted on skills, impact, and keyword overlap (placeholder)."
            visual="ring"
          />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className={LMS_SECTION_TITLE}>Before vs after AI improvement</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={`${LMS_CARD_CLASS} border-rose-100 bg-rose-50/20 transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center gap-2 text-rose-800 mb-2">
              <X className="h-4 w-4" strokeWidth={2} />
              <span className="text-sm font-bold">Old bullet</span>
            </div>
            <p className="text-sm font-normal text-gray-700">{resumeBeforeAfter.before}</p>
          </div>
          <div className={`${LMS_CARD_CLASS} border-emerald-100 bg-emerald-50/20 transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-center gap-2 text-emerald-800 mb-2">
              <Check className="h-4 w-4" strokeWidth={2} />
              <span className="text-sm font-bold">Improved bullet</span>
            </div>
            <p className="text-sm font-normal text-gray-700">{resumeBeforeAfter.after}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={LMS_SECTION_TITLE}>ATS risk alerts</h2>
        <ul className="space-y-2">
          {resumeAtsRisks.map((risk) => (
            <li
              key={risk}
              className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-2 text-sm font-semibold text-amber-950"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" strokeWidth={2} />
              {risk}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-4">
        <h2 className={LMS_SECTION_TITLE}>Templates</h2>
        <p className="text-sm text-gray-500 font-normal -mt-2">Preview layouts—content syncs when you wire the backend.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {TEMPLATES.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.name} className={LMS_CARD_INTERACTIVE}>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-900 text-white">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{t.name}</h3>
                  </div>
                  <div
                    className={`${LMS_CARD_CLASS} !p-4 border-dashed border-gray-200 bg-gradient-to-br from-gray-50 to-white`}
                  >
                    <div className="space-y-2">
                      <div className="h-2 w-3/4 rounded bg-gray-200" />
                      <div className="h-2 w-1/2 rounded bg-gray-100" />
                      <div className="mt-3 space-y-1.5">
                        <div className="h-1.5 w-full rounded bg-gray-100" />
                        <div className="h-1.5 w-5/6 rounded bg-gray-100" />
                        <div className="h-1.5 w-4/6 rounded bg-gray-100" />
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 font-normal">{t.hint}</p>
                  <button
                    type="button"
                    className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98] cursor-pointer"
                    onClick={() => {
                      const slug = t.name === 'Modern minimal' ? 'modern-minimal' : t.name === 'Impact focused' ? 'impact-focused' : 'technical-depth';
                      setResumeTemplate(slug);
                      toast.push({ title: 'Template selected', message: t.name, tone: 'info' });
                      router.push(`/lms/resume-builder/editor?template=${encodeURIComponent(slug)}`);
                    }}
                  >
                    Use template
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
