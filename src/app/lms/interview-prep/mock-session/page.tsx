'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useEffect, useState, useMemo, type SVGProps } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, SkipForward, Play, AlertCircle } from 'lucide-react';
import { LMS_CARD_CLASS } from '@/app/lms/constants';
import { CAREER_STEP_IDS } from '@/app/lms/data/ai-mock';
import { LmsSkeleton } from '@/app/lms/components/states/LmsSkeleton';
import { generateMockQuestions } from '@/modules/interview-prep/data/mockInterviewData';
import { useInterviewPrep } from '@/modules/interview-prep/hooks/useInterviewPrep';
import { useLmsToast } from '@/app/lms/components/ux/LmsToastProvider';
import { useLmsState } from '@/app/lms/state/LmsStateProvider';
import type { MockQuestion, MockSessionResult } from '@/modules/interview-prep/types/interview.types';

function MockInterviewSessionFallback() {
  return (
    <div className={LMS_CARD_CLASS}>
      <LmsSkeleton lines={5} />
    </div>
  );
}

function MockInterviewSessionContent() {
  const router = useRouter();
  const sp = useSearchParams();
  const role = sp.get('role') ?? 'Unknown Role';
  const diff = sp.get('diff') ?? 'Unknown Diff';
  const toast = useLmsToast();
  const { saveMockSession } = useInterviewPrep();
  const { careerSetStepCompletion } = useLmsState();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [time, setTime] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const questions = useMemo<MockQuestion[]>(() => {
    const q1 = generateMockQuestions('system');
    const q2 = generateMockQuestions('technical');
    const q3 = generateMockQuestions('hr');
    return [q1[0], q2[0], q3[0], q2[1]].filter(Boolean);
  }, []);

  useEffect(() => {
    if (isFinished || questions.length === 0) return;
    const timer = setInterval(() => setTime((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [isFinished, questions.length]);

  const q = questions[index];

  const handleNext = () => {
    const nextAnswers = q ? { ...answers, [q.id]: currentAnswer } : answers;
    setAnswers(nextAnswers);
    if (index >= questions.length - 1) {
      finishSession(nextAnswers);
    } else {
      const nextQuestion = questions[index + 1];
      setIndex(i => i + 1);
      setCurrentAnswer(nextQuestion ? nextAnswers[nextQuestion.id] || '' : '');
    }
  };

  const finishSession = (finalAnswers: Record<string, string>) => {
    setIsFinished(true);
    const result: MockSessionResult = {
      id: `session-${Date.now()}`,
      config: { difficulty: diff, role },
      answers: finalAnswers,
      createdAt: Date.now(),
      strengths: ['Clear pacing', 'Good technical buzzwords'],
      improvements: ['Give more concrete examples', 'Avoid rambling on behavioral'],
      gaps: ['Scalability patterns'],
    };
    saveMockSession(result);
    careerSetStepCompletion(CAREER_STEP_IDS.mockInterview, true);
    toast.push({ title: 'Session Saved', message: 'Mock interview completed successfully.', tone: 'success' });
  };

  if (!q && !isFinished) {
    return <div className="p-8">Initializing mock session...</div>;
  }

  if (isFinished) {
    return (
      <div className="space-y-8 pb-8 max-w-2xl mx-auto mt-8">
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-8 w-8" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Session Complete</h1>
          <p className="text-gray-500">You completed {questions.length} questions in {Math.floor(time / 60)}m {time % 60}s.</p>
        </div>

        <div className={LMS_CARD_CLASS}>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Initial AI Feedback (Mock)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-4">
              <h3 className="text-sm font-bold text-emerald-800">Strengths Detected</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-emerald-900/80">
                <li>Structured approach</li>
                <li>Clear technical terminology</li>
              </ul>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
              <h3 className="text-sm font-bold text-amber-800">Areas to Improve</h3>
              <ul className="mt-2 list-disc pl-5 text-sm text-amber-900/80">
                <li>Time management on deep dives</li>
                <li>Specific metrics in STAR</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => router.push('/lms/interview-prep')}
            className="flex-1 rounded-2xl bg-[#28A8E1] px-5 py-3 text-sm font-bold text-white hover:bg-[#208bc0] hover:shadow-md transition-all active:scale-[0.98]"
          >
            Return to prep dashboard
          </button>
          <button
            onClick={() => router.push('/lms/career-path')}
            className="flex-1 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-900 hover:bg-gray-50 transition-all active:scale-[0.98]"
          >
            View Career Path
          </button>
        </div>
      </div>
    );
  }

  const mins = Math.floor(time / 60).toString().padStart(2, '0');
  const secs = (time % 60).toString().padStart(2, '0');

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <div className="flex items-center justify-between border-b border-gray-100 pb-4">
        <Link href="/lms/interview-prep" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900">
          <ArrowLeft className="h-4 w-4" /> Exit session (progress will be lost)
        </Link>
        <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm">
          <Clock className="h-4 w-4 text-violet-600" />
          {mins}:{secs}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700 font-bold">
          Q{index + 1}
        </div>
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">
            {role} • {diff} • {q.category}
          </p>
          <p className="text-sm text-gray-600">Question {index + 1} of {questions.length}</p>
        </div>
      </div>

      <div className={`${LMS_CARD_CLASS} space-y-5 shadow-md border-violet-100`}>
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gray-100 ring-1 ring-gray-200">
            <Play className="h-6 w-6 text-gray-400" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-snug tracking-tight">
              {q.prompt}
            </h2>
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-orange-50 border border-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-800">
              <AlertCircle className="h-4 w-4" /> Placeholder: Audio playback disabled
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <label htmlFor="answer" className="sr-only">Your answer</label>
          <textarea
            id="answer"
            value={currentAnswer}
            onChange={(e) => setCurrentAnswer(e.target.value)}
            placeholder="Type your answer here, or click the mic to speak (mock)..."
            className="w-full h-40 bg-transparent text-sm font-medium text-gray-900 placeholder:text-gray-400 outline-none resize-none"
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-gray-100">
          <button
            type="button"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            onClick={() => {
              setCurrentAnswer('');
              handleNext();
            }}
          >
            <SkipForward className="h-4 w-4" /> Skip question
          </button>
          
          <button
            type="button"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-[#208bc0] hover:shadow-md active:scale-[0.98]"
            onClick={handleNext}
          >
            {index >= questions.length - 1 ? (
              <>
                <CheckCircle2 className="h-5 w-5" /> Finish Mock
              </>
            ) : (
              <>
                Save & Next <ArrowLeft className="h-4 w-4 rotate-180" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MockInterviewSession() {
  return (
    <Suspense fallback={<MockInterviewSessionFallback />}>
      <MockInterviewSessionContent />
    </Suspense>
  );
}

function CheckCircle2(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
