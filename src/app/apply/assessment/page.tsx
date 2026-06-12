'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Clock, Loader2 } from 'lucide-react';
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
  const autoSubmitStartedRef = useRef(false);
  const lastTabLogAtRef = useRef(0);

  const assessment = (session?.assessment || {}) as Record<string, unknown>;
  const type = String(assessment.type || 'MCQ').toUpperCase();
  const config = (assessment.config || {}) as Record<string, unknown>;
  const mcqQuestions = (Array.isArray(config.questions) ? config.questions : []) as McqQuestion[];
  const accessToken = String(session?.accessToken || '');

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

  const handleSubmit = async () => {
    if (!accessToken || submitting) return;
    setSubmitting(true);
    try {
      let payload: Record<string, unknown> = answers;
      if (type === 'ESSAY') payload = { essay: essayText };
      if (type === 'CODING') payload = { code: essayText };
      if (type === 'VIDEO') payload = { videoNote: essayText };
      const result = await submitAssessmentSession(accessToken, payload, tenantDbName || undefined);
      const next = String(params.get('next') || '');
      if (next) {
        router.push(next);
      } else {
        router.push(`/applications${applicationId ? `/${applicationId}` : ''}`);
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-slate-600">
        <Loader2 className="size-5 animate-spin" /> Starting assessment…
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <p className="text-rose-600">{error}</p>
        <button type="button" className="mt-4 text-sm text-blue-600 underline" onClick={() => router.back()}>
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">{String(assessment.title || 'Assessment')}</h1>
            <p className="text-xs text-slate-500">{type} · Monitored attempt</p>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold tabular-nums">
            <Clock className="size-4" /> {timerLabel}
          </div>
        </div>

        {timeExpired ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
            <Clock className="size-4 shrink-0 mt-0.5" />
            {submitting ? 'Time is up — submitting your answers…' : 'Time is up — submit now to save your answers.'}
          </div>
        ) : null}

        {tabWarnings > 0 ? (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            Tab switch detected ({tabWarnings}). Repeated switches may flag your attempt.
          </div>
        ) : null}

        <div className="mt-6 space-y-6">
          {type === 'MCQ'
            ? mcqQuestions.map((q, qi) => (
                <div key={q.id}>
                  <p className="text-sm font-medium text-slate-800">
                    {qi + 1}. {q.prompt}
                  </p>
                  <div className="mt-2 space-y-2">
                    {(q.options || []).map((opt) => (
                      <label
                        key={opt.id}
                        className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={answers[q.id] === opt.id}
                          onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                        />
                        {opt.text}
                      </label>
                    ))}
                  </div>
                </div>
              ))
            : null}

          {type === 'ESSAY' || type === 'CODING' ? (
            <div>
              <p className="text-sm text-slate-700 mb-2">{String(config.prompt || 'Your response')}</p>
              <textarea
                className="min-h-[200px] w-full rounded-xl border border-slate-200 p-3 text-sm"
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder={type === 'CODING' ? 'Write your code here…' : 'Write your essay here…'}
              />
            </div>
          ) : null}

          {type === 'VIDEO' ? (
            <div>
              <p className="text-sm text-slate-700 mb-2">{String(config.prompt || 'Video response')}</p>
              <p className="text-xs text-slate-500 mb-2">
                Video upload recording will be enabled in a follow-up release. For now, paste a video link or notes.
              </p>
              <input
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                value={essayText}
                onChange={(e) => setEssayText(e.target.value)}
                placeholder="Video URL or notes"
              />
            </div>
          ) : null}
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={() => void handleSubmit()}
          className="mt-8 w-full rounded-xl bg-[#28A8E1] py-3 text-sm font-semibold text-white disabled:opacity-50"
        >
          {submitting ? 'Submitting…' : timeExpired ? 'Submit now' : 'Submit assessment'}
        </button>
      </div>
    </div>
  );
}

export default function AssessmentAttemptPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="size-6 animate-spin text-slate-400" />
        </div>
      }
    >
      <AssessmentAttemptContent />
    </Suspense>
  );
}
