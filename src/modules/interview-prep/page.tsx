'use client';

import { useRouter } from 'next/navigation';
import { useInterviewPrep } from './hooks/useInterviewPrep';
import { InterviewHeader } from './components/InterviewHeader';
import { MockInterviewCard } from './components/MockInterview/MockInterviewCard';
import { LmsPageHeader } from '@/app/lms/components/LmsPageHeader';
import { useLmsOverlay } from '@/app/lms/components/overlays/LmsOverlayProvider';
import { TenantInterviewFormsPanel } from './components/TenantInterviewFormsPanel';

export default function InterviewPrepModulePage() {
  const router = useRouter();
  const overlay = useLmsOverlay();
  const { data, mockConfig, setMockConfig, onStartMock } = useInterviewPrep();

  return (
    <div className="space-y-8 pb-2 -mt-1">
      <LmsPageHeader
        eyebrow="AI interview operating system"
        title="Interview prep"
        subtitle="Practice mock interviews and apply to tenant-published interview forms."
      />

      <InterviewHeader
        data={{
          goal: data.goal,
          readiness: data.readiness,
          nextAction: data.nextAction,
          scores: data.scores,
        }}
        onNextAction={() => router.push('/Aimockinter')}
      />

      <TenantInterviewFormsPanel />

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
