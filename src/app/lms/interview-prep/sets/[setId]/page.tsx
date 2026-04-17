'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, Shuffle, Check } from 'lucide-react';
import { LMS_CARD_CLASS, LMS_PAGE_SUBTITLE } from '@/app/lms/constants';
import { useInterviewPrep } from '@/modules/interview-prep/hooks/useInterviewPrep';
import { useLmsState } from '@/app/lms/state/LmsStateProvider';
import { useLmsToast } from '@/app/lms/components/ux/LmsToastProvider';
import type { QuestionSet, MockQuestion } from '@/modules/interview-prep/types/interview.types';

export default function QuestionSetWorkspace() {
  const router = useRouter();
  const params = useParams() as { setId: string };
  const toast = useLmsToast();
  const { savedSets } = useInterviewPrep();
  const { addPlannedItem } = useLmsState();

  const [set, setSet] = useState<QuestionSet | null>(null);
  const [index, setIndex] = useState(0);
  const [practiced, setPracticed] = useState<Record<string, boolean>>({});

  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const s = savedSets.find((x) => x.id === params.setId);
    if (s) setSet(s);
    setIsLoaded(true);
  }, [params.setId, savedSets]);

  const q = set ? set.questions[index] : null;

  if (!isLoaded) {
    return (
      <div className="space-y-8 pb-8">
        <div className="min-w-0">
          <Link href="/lms/interview-prep" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to prep
          </Link>
        </div>
        <p className="text-gray-500">Loading set...</p>
      </div>
    );
  }

  if (!set || !q) {
    return (
      <div className="space-y-8 pb-8">
        <div className="min-w-0">
          <Link href="/lms/interview-prep" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
            <ArrowLeft className="h-4 w-4" /> Back to prep
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-20 bg-gray-50 border border-gray-100 rounded-3xl">
          <p className="text-gray-500 font-medium">Question set not found or no longer exists.</p>
          <Link href="/lms/interview-prep" className="mt-4 inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-[#208bc0]">
            Return to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const isDone = practiced[q.id];

  return (
    <div className="space-y-8 pb-8">
      <div className="min-w-0">
        <Link href="/lms/interview-prep" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to prep
        </Link>
        <div className="mt-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-violet-700">Practice Workspace</p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1 tracking-tight">{set.kind} questions</h1>
            <p className={LMS_PAGE_SUBTITLE}>Question {index + 1} of {set.questions.length}</p>
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-50 text-violet-900 px-4 py-2 text-sm font-semibold transition-all hover:bg-violet-100"
            onClick={() => {
              setSet(prev => prev ? { ...prev, questions: [...prev.questions].sort(() => Math.random() - 0.5) } : prev);
              setIndex(0);
            }}
          >
            <Shuffle className="h-4 w-4" />
            Shuffle
          </button>
        </div>
      </div>

      <div className={`${LMS_CARD_CLASS} space-y-6 md:p-8`}>
        <div>
          <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-800 border border-blue-100">
            {q.category} • {q.difficulty}
          </span>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">{q.prompt}</h2>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/50 p-4">
          <p className="text-sm font-bold text-violet-900">Hint</p>
          <p className="mt-1 text-sm text-violet-800/80">{q.hint}</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-900">Follow-up prompts</p>
          <ul className="list-disc pl-5 text-sm text-gray-600">
            {q.followUp.map(f => <li key={f}>{f}</li>)}
          </ul>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-bold text-gray-900">Rubric / What to highlight</p>
          <p className="text-sm text-gray-600 border-l-2 border-gray-200 pl-3">{q.rubric}</p>
        </div>

        <div className="pt-6 mt-6 border-t border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            className={`inline-flex items-center gap-2 rounded-xl border ${isDone ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-white border-gray-200 text-gray-800 hover:bg-gray-50'} px-5 py-2.5 text-sm font-bold transition-all active:scale-[0.98]`}
            onClick={() => setPracticed(p => ({ ...p, [q.id]: !p[q.id] }))}
          >
            {isDone ? <CheckCircle2 className="h-5 w-5" /> : <div className="h-5 w-5 rounded-full border-2 border-current opacity-30" />}
            {isDone ? 'Marked as practiced' : 'Mark practiced'}
          </button>

          <div className="flex items-center gap-2">
            <button
              disabled={index === 0}
              className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50 text-gray-900 hover:bg-gray-50 active:scale-[0.98]"
              onClick={() => setIndex(i => Math.max(0, i - 1))}
            >
              Previous
            </button>
            <button
              disabled={index === set.questions.length - 1}
              className="rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50 hover:bg-[#208bc0] hover:shadow-md active:scale-[0.98]"
              onClick={() => setIndex(i => Math.min(set.questions.length - 1, i + 1))}
            >
              Next question
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
         <button
            type="button"
            className="text-sm font-bold text-gray-500 hover:text-gray-900"
            onClick={() => {
              addPlannedItem({ 
                id: `ip:q:${q.id}`, 
                type: 'topic', 
                label: `Review question: ${q.prompt.slice(0, 30)}...`, 
                href: `/lms/interview-prep/sets/${set.id}`,
                sourceModule: 'interview-prep',
                sourceLabel: 'Question Drill',
                context: `Specific interview question from the "${set.kind}" set. Focus on: ${q.rubric.substring(0, 50)}...`
              });
              toast.push({ title: 'Added to plan', message: 'Saved question for review.', tone: 'success' });
            }}
          >
            + Add this question to study plan
          </button>
      </div>

    </div>
  );
}
