'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useInterviewPrep } from './hooks/useInterviewPrep';
import { InterviewHeader } from './components/InterviewHeader';
import { QuestionGeneratorGrid } from './components/QuestionGenerator/QuestionGeneratorGrid';
import { MockInterviewCard } from './components/MockInterview/MockInterviewCard';
import { LMS_PAGE_SUBTITLE } from '@/app/lms/constants';
import { useLmsOverlay } from '@/app/lms/components/overlays/LmsOverlayProvider';
import { useLmsToast } from '@/app/lms/components/ux/LmsToastProvider';
import { useLmsState } from '@/app/lms/state/LmsStateProvider';

export default function InterviewPrepModulePage() {
  const router = useRouter();
  const overlay = useLmsOverlay();
  const toast = useLmsToast();
  const { addPlannedItem, setSelectedSkill } = useLmsState();
  const { data, mockConfig, setMockConfig, generatedSet, setGeneratedSet, onStartMock, onGenerateQuestions } =
    useInterviewPrep();

  const openGeneratedSet = () => {
    if (!generatedSet) return;
    overlay.openSheet({
      title: 'Generated question set',
      description: 'Your custom practice set is ready.',
      content: (
        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Type</p>
          <p className="text-sm font-semibold text-gray-900">{generatedSet.kind}</p>
          <ul className="mt-2 space-y-2 list-decimal pl-5 text-sm text-gray-700">
            {generatedSet.questions.map((q) => (
              <li key={q.id}>{q.prompt}</li>
            ))}
          </ul>
        </div>
      ),
      footer: (
        <div className="flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            className="flex-1 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
            onClick={() => {
              setGeneratedSet(null);
              overlay.close();
              router.push(`/lms/interview-prep/sets/${generatedSet.id}`);
            }}
          >
            Start practice
          </button>
          <button
            type="button"
            className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-800 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm"
            onClick={() => {
              addPlannedItem({ 
                id: `ip:set:${generatedSet.kind}`, 
                type: 'topic', 
                label: `Practice: ${generatedSet.kind}`, 
                href: `/lms/interview-prep/sets/${generatedSet.id}`,
                sourceModule: 'interview-prep',
                sourceLabel: 'Question Bank'
              });
              toast.push({ title: 'Added to plan', message: 'Saved this set for later practice.', tone: 'success' });
              overlay.close();
            }}
          >
            Add to plan
          </button>
        </div>
      ),
      size: 'lg',
    });
  };

  useEffect(() => {
    if (!generatedSet) return;
    openGeneratedSet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [generatedSet]);

  return (
    <div className="space-y-8 pb-2 -mt-8">
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-violet-700">AI interview operating system</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-1 tracking-tight">Interview preparation</h1>
        <p className={LMS_PAGE_SUBTITLE}>
          Modular, API-ready shell — mock data and console hooks until your AI services ship.
        </p>
      </div>

      <InterviewHeader
        data={{
          goal: data.goal,
          readiness: data.readiness,
          nextAction: data.nextAction,
          scores: data.scores,
        }}
        onNextAction={() => router.push('/Aimockinter')}
      />



      <QuestionGeneratorGrid
        items={data.questionGenerator}
        onGenerate={(kind) => {
          onGenerateQuestions(kind);
          toast.push({ title: 'Generated set', message: 'Review the questions in the sheet.', tone: 'info' });
        }}
      />

      <MockInterviewCard
        difficulty={mockConfig.difficulty}
        role={mockConfig.role}
        onChangeConfig={(next) => setMockConfig(next)}
        onStartMock={async () => {
          const cfg = await onStartMock();
          overlay.openSheet({
            title: 'Start mock interview',
            description: 'Frontend-only launch flow (mock).',
            content: (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-900">Config</p>
                <ul className="text-sm text-gray-700 list-disc pl-5">
                  <li>Difficulty: {cfg.difficulty}</li>
                  <li>Role focus: {cfg.role}</li>
                </ul>
                <p className="mt-3 text-sm font-normal text-gray-600">
                  Starting will add a practice item to your Career Path plan (local-only).
                </p>
              </div>
            ),
            footer: (
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  className="flex-1 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
                  onClick={() => {
                    overlay.close();
                    router.push(`/Aimockinter`);
                  }}
                >
                  Start
                </button>
                <button
                  type="button"
                  className="flex-1 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 transition-all duration-200 hover:bg-gray-50 hover:shadow-sm active:scale-[0.98]"
                  onClick={overlay.close}
                >
                  Cancel
                </button>
              </div>
            ),
          });
        }}
      />

    </div>
  );
}
