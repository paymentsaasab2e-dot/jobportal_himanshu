'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Shield,
} from 'lucide-react';
import {
  logProctoringEvent,
  startAssessmentSession,
  submitAssessmentSession,
} from '@/lib/phase2-assessment-api';

type McqQuestion = {
  id: string;
  prompt: string;
  options: Array<{ id: string; text: string }>;
};

type QuestionnaireQuestion = {
  id: string;
  kind?: string;
  prompt: string;
  required?: boolean;
  maxLength?: number;
  options?: Array<{ id: string; text: string }>;
};

type CodingQuestion = {
  id: string;
  title?: string;
  prompt: string;
  sampleInput?: string;
  sampleOutput?: string;
  marks?: number;
};

type StepKind = 'mcq' | 'questionnaire' | 'coding' | 'essay' | 'video' | 'coding-single';

type WizardStep = {
  key: string;
  kind: StepKind;
  index: number;
  total: number;
  mcq?: McqQuestion;
  questionnaire?: QuestionnaireQuestion;
  coding?: CodingQuestion;
};

function AssessmentAttemptContent() {
  const router = useRouter();
  const params = useSearchParams();
  const jobId = String(params.get('jobId') || '').trim();
  const candidateId = String(params.get('candidateId') || '').trim();
  const applicationId = String(params.get('applicationId') || '').trim();
  const jobAssessmentId = String(params.get('jobAssessmentId') || '').trim();
  const tenantDbName = String(params.get('tenantDbName') || '').trim();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [session, setSession] = useState<Record<string, unknown> | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [essayText, setEssayText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [tabWarnings, setTabWarnings] = useState(0);
  const [remaining, setRemaining] = useState(0);
  const [timeExpired, setTimeExpired] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const autoSubmitStartedRef = useRef(false);
  const lastTabLogAtRef = useRef(0);

  const assessment = (session?.assessment || {}) as Record<string, unknown>;
  const type = String(assessment.type || 'MCQ').toUpperCase();
  const config = (assessment.config || {}) as Record<string, unknown>;
  const mcqQuestions = (Array.isArray(config.questions) ? config.questions : []) as McqQuestion[];
  const questionnaireQuestions = (Array.isArray(config.questions)
    ? config.questions
    : []) as QuestionnaireQuestion[];
  const codingQuestions = (Array.isArray(config.questions) ? config.questions : []) as CodingQuestion[];
  const hasMultiCoding = type === 'CODING' && codingQuestions.length > 0;
  const accessToken = String(session?.accessToken || '');

  const steps = useMemo<WizardStep[]>(() => {
    if (type === 'MCQ') {
      return mcqQuestions.map((q, index) => ({
        key: q.id,
        kind: 'mcq' as const,
        index,
        total: mcqQuestions.length,
        mcq: q,
      }));
    }
    if (type === 'QUESTIONNAIRE') {
      return questionnaireQuestions.map((q, index) => ({
        key: q.id,
        kind: 'questionnaire' as const,
        index,
        total: questionnaireQuestions.length,
        questionnaire: q,
      }));
    }
    if (type === 'CODING' && hasMultiCoding) {
      return codingQuestions.map((q, index) => ({
        key: q.id,
        kind: 'coding' as const,
        index,
        total: codingQuestions.length,
        coding: q,
      }));
    }
    if (type === 'ESSAY') {
      return [{ key: 'essay', kind: 'essay', index: 0, total: 1 }];
    }
    if (type === 'CODING') {
      return [{ key: 'coding-single', kind: 'coding-single', index: 0, total: 1 }];
    }
    if (type === 'VIDEO') {
      return [{ key: 'video', kind: 'video', index: 0, total: 1 }];
    }
    return [];
  }, [type, mcqQuestions, questionnaireQuestions, codingQuestions, hasMultiCoding]);

  const currentStep = steps[stepIndex] || null;
  const totalSteps = steps.length;
  const progressPercent = totalSteps > 0 ? Math.round(((stepIndex + 1) / totalSteps) * 100) : 0;
  const isLastStep = stepIndex >= totalSteps - 1;

  const loadSession = useCallback(async () => {
    if (!jobId || !candidateId || !jobAssessmentId) {
      setError('Missing job, candidate, or assessment.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const started = await startAssessmentSession({
        jobId,
        candidateId,
        applicationId: applicationId || undefined,
        jobAssessmentId,
        tenantDbName: tenantDbName || undefined,
      });
      setSession(started);
      setRemaining(Number(started.remainingSeconds) || 0);
      setStepIndex(0);
      setStepError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start assessment');
    } finally {
      setLoading(false);
    }
  }, [applicationId, candidateId, jobAssessmentId, jobId, tenantDbName]);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  useEffect(() => {
    if (!accessToken || remaining <= 0) return;
    const t = window.setInterval(() => {
      setRemaining((r) => {
        const next = Math.max(0, r - 1);
        if (next === 0) setTimeExpired(true);
        return next;
      });
    }, 1000);
    return () => window.clearInterval(t);
  }, [accessToken, remaining]);

  useEffect(() => {
    if (!accessToken) return;
    const onTabSwitch = () => {
      const now = Date.now();
      if (now - lastTabLogAtRef.current < 2000) return;
      lastTabLogAtRef.current = now;
      void logProctoringEvent(accessToken, 'tab_switch', tenantDbName || undefined).then(() => {
        setTabWarnings((c) => c + 1);
      });
    };
    const onVis = () => {
      if (document.visibilityState === 'hidden') onTabSwitch();
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [accessToken, tenantDbName]);

  const timerLabel = useMemo(() => {
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, [remaining]);

  const timerUrgent = remaining > 0 && remaining <= 60;

  const isCurrentStepComplete = useCallback(() => {
    if (!currentStep) return false;
    if (currentStep.kind === 'mcq') {
      return Boolean(String(answers[currentStep.key] || '').trim());
    }
    if (currentStep.kind === 'questionnaire') {
      const q = currentStep.questionnaire;
      const value = String(answers[currentStep.key] || '').trim();
      const kind = String(q?.kind || '').toUpperCase() === 'MCQ' ? 'MCQ' : 'TEXT';
      if (kind === 'MCQ') return Boolean(value);
      if (q?.required === false) return true;
      return Boolean(value);
    }
    if (currentStep.kind === 'coding') {
      return Boolean(String(answers[currentStep.key] || '').trim());
    }
    if (currentStep.kind === 'essay' || currentStep.kind === 'coding-single' || currentStep.kind === 'video') {
      return Boolean(essayText.trim());
    }
    return false;
  }, [answers, currentStep, essayText]);

  const handleSubmit = async () => {
    if (!accessToken || submitting) return;
    setSubmitting(true);
    try {
      let payload: Record<string, unknown> = answers;
      if (type === 'ESSAY') payload = { essay: essayText };
      if (type === 'CODING' && !hasMultiCoding) payload = { code: essayText };
      if (type === 'VIDEO') payload = { videoNote: essayText };
      const result = await submitAssessmentSession(accessToken, payload, tenantDbName || undefined);
      const next = String(params.get('next') || '');
      if (next) {
        router.push(next);
      } else {
        const successQ = new URLSearchParams();
        successQ.set('applicationSubmitted', '1');
        if (jobId) successQ.set('jobId', jobId);
        if (applicationId) successQ.set('applicationId', applicationId);
        router.push(`/explore-jobs?${successQ.toString()}`);
      }
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Submit failed');
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (remaining > 0 || !accessToken || submitting || autoSubmitStartedRef.current) return;
    const status = String(session?.status || '');
    if (status === 'SUBMITTED') return;
    autoSubmitStartedRef.current = true;
    void handleSubmit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining, accessToken, submitting, session?.status]);

  const goNext = () => {
    if (!isCurrentStepComplete()) {
      setStepError('Please complete this question before continuing.');
      return;
    }
    setStepError(null);
    if (isLastStep) {
      void handleSubmit();
      return;
    }
    setStepIndex((i) => Math.min(i + 1, totalSteps - 1));
  };

  const goBack = () => {
    setStepError(null);
    setStepIndex((i) => Math.max(0, i - 1));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top,_#e8f6fc_0%,_#f8fafc_45%,_#f1f5f9_100%)]">
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-white/80 bg-white/90 px-8 py-7 shadow-xl shadow-slate-200/60 backdrop-blur">
          <Loader2 className="size-6 animate-spin text-[#2098C8]" />
          <p className="text-sm font-medium text-slate-600">Preparing your assessment…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-md rounded-2xl border border-rose-100 bg-white p-8 text-center shadow-lg">
          <p className="text-sm font-medium text-rose-600">{error}</p>
          <button
            type="button"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
            onClick={() => router.back()}
          >
            <ArrowLeft className="size-4" />
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="assessment-attempt-page relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top,_#e8f6fc_0%,_#f8fafc_42%,_#eef2f7_100%)] text-slate-900">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(rgba(15,23,42,0.06) 1px, transparent 1px)',
          backgroundSize: '18px 18px',
        }}
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-screen max-w-2xl flex-col px-4 py-6 sm:py-10">
        <header className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-[#2098C8]/25 bg-white/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-[#176F96] shadow-sm backdrop-blur">
              <Shield className="size-3.5" />
              Monitored attempt
            </div>
            <h1 className="truncate text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
              {String(assessment.title || 'Assessment')}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {type}
              {totalSteps > 1 ? ` · Question ${stepIndex + 1} of ${totalSteps}` : null}
            </p>
          </div>
          <div
            className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-sm font-bold tabular-nums shadow-sm backdrop-blur ${
              timerUrgent
                ? 'border-rose-200 bg-rose-50 text-rose-700'
                : 'border-white/80 bg-white/90 text-slate-800'
            }`}
          >
            <Clock className={`size-4 ${timerUrgent ? 'text-rose-500' : 'text-[#2098C8]'}`} />
            {timerLabel}
          </div>
        </header>

        {totalSteps > 1 ? (
          <div className="mb-5">
            <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              <span>Progress</span>
              <span>{progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-200/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#2098C8] to-[#3db8e0] transition-all duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {steps.map((step, idx) => {
                const done =
                  idx < stepIndex ||
                  (idx === stepIndex && isCurrentStepComplete()) ||
                  (idx < stepIndex);
                const answeredEarlier =
                  idx < stepIndex ||
                  (step.kind === 'mcq' || step.kind === 'questionnaire' || step.kind === 'coding'
                    ? Boolean(String(answers[step.key] || '').trim())
                    : Boolean(essayText.trim()));
                const isCurrent = idx === stepIndex;
                return (
                  <span
                    key={step.key}
                    className={`flex h-2.5 w-2.5 rounded-full transition-colors ${
                      isCurrent
                        ? 'bg-[#2098C8] ring-4 ring-[#2098C8]/20'
                        : answeredEarlier || done
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                    }`}
                    title={`Question ${idx + 1}`}
                  />
                );
              })}
            </div>
          </div>
        ) : null}

        {timeExpired ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50/90 px-3.5 py-2.5 text-sm text-sky-900 shadow-sm">
            <Clock className="mt-0.5 size-4 shrink-0" />
            {submitting
              ? 'Time is up — submitting your answers…'
              : 'Time is up — submit now to save your answers.'}
          </div>
        ) : null}

        {tabWarnings > 0 ? (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50/90 px-3.5 py-2.5 text-sm text-amber-900 shadow-sm">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            Tab switch detected ({tabWarnings}). Repeated switches may flag your attempt.
          </div>
        ) : null}

        <div className="flex flex-1 flex-col rounded-[1.5rem] border border-white/80 bg-white/95 p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.35)] ring-1 ring-slate-900/5 backdrop-blur sm:p-7">
          {currentStep?.kind === 'mcq' && currentStep.mcq ? (
            <QuestionShell
              number={stepIndex + 1}
              total={totalSteps}
              prompt={currentStep.mcq.prompt}
            >
              <div className="space-y-2.5">
                {(currentStep.mcq.options || []).map((opt, oi) => {
                  const selected = answers[currentStep.key] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStepError(null);
                        setAnswers((prev) => ({ ...prev, [currentStep.key]: opt.id }));
                      }}
                      className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition ${
                        selected
                          ? 'border-[#2098C8] bg-[#E8F6FC] shadow-sm ring-1 ring-[#2098C8]/25'
                          : 'border-slate-200 bg-white hover:border-[#2098C8]/40 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                          selected
                            ? 'bg-[#2098C8] text-white'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {selected ? <Check className="size-3.5" /> : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="font-medium text-slate-800">{opt.text}</span>
                    </button>
                  );
                })}
              </div>
            </QuestionShell>
          ) : null}

          {currentStep?.kind === 'questionnaire' && currentStep.questionnaire ? (
            <QuestionShell
              number={stepIndex + 1}
              total={totalSteps}
              prompt={currentStep.questionnaire.prompt}
              required={
                String(currentStep.questionnaire.kind || '').toUpperCase() !== 'MCQ' &&
                currentStep.questionnaire.required !== false
              }
            >
              {String(currentStep.questionnaire.kind || '').toUpperCase() === 'MCQ' ? (
                <div className="space-y-2.5">
                  {(currentStep.questionnaire.options || []).map((opt, oi) => {
                    const selected = answers[currentStep.key] === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setStepError(null);
                          setAnswers((prev) => ({ ...prev, [currentStep.key]: opt.id }));
                        }}
                        className={`flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left text-sm transition ${
                          selected
                            ? 'border-[#2098C8] bg-[#E8F6FC] shadow-sm ring-1 ring-[#2098C8]/25'
                            : 'border-slate-200 bg-white hover:border-[#2098C8]/40 hover:bg-slate-50'
                        }`}
                      >
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                            selected
                              ? 'bg-[#2098C8] text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {selected ? <Check className="size-3.5" /> : String.fromCharCode(65 + oi)}
                        </span>
                        <span className="font-medium text-slate-800">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <textarea
                  className="min-h-[140px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2098C8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2098C8]/15"
                  value={answers[currentStep.key] || ''}
                  maxLength={currentStep.questionnaire.maxLength || 1000}
                  onChange={(e) => {
                    setStepError(null);
                    setAnswers((prev) => ({ ...prev, [currentStep.key]: e.target.value }));
                  }}
                  placeholder="Type your answer…"
                />
              )}
            </QuestionShell>
          ) : null}

          {currentStep?.kind === 'coding' && currentStep.coding ? (
            <QuestionShell
              number={stepIndex + 1}
              total={totalSteps}
              prompt={
                currentStep.coding.title
                  ? `${currentStep.coding.title}\n\n${currentStep.coding.prompt}`
                  : currentStep.coding.prompt
              }
            >
              {currentStep.coding.sampleInput ? (
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Sample input
                  </p>
                  <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-emerald-300">
                    {currentStep.coding.sampleInput}
                  </pre>
                </div>
              ) : null}
              {currentStep.coding.sampleOutput ? (
                <div className="mb-3">
                  <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    Sample output
                  </p>
                  <pre className="mt-1 overflow-x-auto rounded-xl bg-slate-900 p-3 text-xs text-sky-300">
                    {currentStep.coding.sampleOutput}
                  </pre>
                </div>
              ) : null}
              <textarea
                className="min-h-[180px] w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#2098C8] focus:outline-none focus:ring-4 focus:ring-[#2098C8]/20"
                value={answers[currentStep.key] || ''}
                onChange={(e) => {
                  setStepError(null);
                  setAnswers((prev) => ({ ...prev, [currentStep.key]: e.target.value }));
                }}
                placeholder="Write your solution here…"
              />
            </QuestionShell>
          ) : null}

          {currentStep?.kind === 'essay' ? (
            <QuestionShell number={1} total={1} prompt={String(config.prompt || 'Your response')}>
              <textarea
                className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2098C8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2098C8]/15"
                value={essayText}
                onChange={(e) => {
                  setStepError(null);
                  setEssayText(e.target.value);
                }}
                placeholder="Write your essay here…"
              />
            </QuestionShell>
          ) : null}

          {currentStep?.kind === 'coding-single' ? (
            <QuestionShell number={1} total={1} prompt={String(config.prompt || 'Your response')}>
              <textarea
                className="min-h-[220px] w-full rounded-2xl border border-slate-200 bg-slate-950 p-4 font-mono text-sm text-slate-100 placeholder:text-slate-500 focus:border-[#2098C8] focus:outline-none focus:ring-4 focus:ring-[#2098C8]/20"
                value={essayText}
                onChange={(e) => {
                  setStepError(null);
                  setEssayText(e.target.value);
                }}
                placeholder="Write your code here…"
              />
            </QuestionShell>
          ) : null}

          {currentStep?.kind === 'video' ? (
            <QuestionShell number={1} total={1} prompt={String(config.prompt || 'Video response')}>
              <p className="mb-3 text-xs text-slate-500">
                Video upload recording will be enabled in a follow-up release. For now, paste a video
                link or notes.
              </p>
              <input
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2098C8] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#2098C8]/15"
                value={essayText}
                onChange={(e) => {
                  setStepError(null);
                  setEssayText(e.target.value);
                }}
                placeholder="Video URL or notes"
              />
            </QuestionShell>
          ) : null}

          {stepError ? (
            <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {stepError}
            </p>
          ) : null}

          <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-5">
            <button
              type="button"
              onClick={goBack}
              disabled={stepIndex === 0 || submitting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ArrowLeft className="size-4" />
              Back
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={goNext}
              className="inline-flex items-center gap-2 rounded-xl bg-[#2098C8] px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#2098C8]/25 transition hover:bg-[#1A86B3] disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Submitting…
                </>
              ) : isLastStep || timeExpired ? (
                <>
                  <CheckCircle2 className="size-4" />
                  {timeExpired ? 'Submit now' : 'Submit assessment'}
                </>
              ) : (
                <>
                  Next
                  <ArrowRight className="size-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuestionShell({
  number,
  total,
  prompt,
  required,
  children,
}: {
  number: number;
  total: number;
  prompt: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="animate-in fade-in slide-in-from-right-2 duration-200">
      <div className="mb-4 flex items-center gap-2">
        <span className="inline-flex items-center rounded-full bg-[#E8F6FC] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-[#176F96]">
          Question {number}
          {total > 1 ? ` / ${total}` : ''}
        </span>
        {required ? <span className="text-xs font-medium text-rose-500">Required</span> : null}
      </div>
      <p className="mb-5 whitespace-pre-wrap text-base font-semibold leading-relaxed text-slate-900 sm:text-lg">
        {prompt}
        {required ? <span className="text-rose-500"> *</span> : null}
      </p>
      {children}
    </div>
  );
}

export default function AssessmentAttemptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <Loader2 className="size-6 animate-spin text-[#2098C8]" />
        </div>
      }
    >
      <AssessmentAttemptContent />
    </Suspense>
  );
}
