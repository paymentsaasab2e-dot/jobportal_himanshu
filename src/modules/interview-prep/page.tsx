'use client';

import * as NextNavigation from 'next/navigation';
import { useInterviewPrep } from './hooks/useInterviewPrep';
import { InterviewHeader } from './components/InterviewHeader';
import { MockInterviewCard } from './components/MockInterview/MockInterviewCard';
import { InterviewRoleOptions } from './components/InterviewRoleOptions';
import { LmsPageHeader } from '@/app/lms/components/LmsPageHeader';
import { TenantInterviewFormsPanel } from './components/TenantInterviewFormsPanel';
import { startInterviewSession } from '@/app/lms/api/client';
import { showErrorToast } from '@/components/common/toast/toast';
import { notifyInsufficientTokens } from '@/lib/token-errors';

export default function InterviewPrepModulePage() {
  const router = NextNavigation.useRouter();
  const { data, mockConfig, setMockConfig } = useInterviewPrep();

  const launchMockWithTokens = async () => {
    try {
      await startInterviewSession({
        type: 'MOCK',
        topic: `${mockConfig.role} - ${mockConfig.difficulty}`,
      });
      sessionStorage.setItem('lms:mock-interview-paid', '1');
      router.push('/Aimockinter');
    } catch (err) {
      if (!notifyInsufficientTokens(err)) {
        showErrorToast('Could not start', err instanceof Error ? err.message : 'Try again');
      }
      throw err;
    }
  };

  return (
    <div className="space-y-8 pb-2 -mt-1">
      <LmsPageHeader
        eyebrow="AI interview operating system"
        title="Interview prep"
        subtitle="Unlock premium interview flows with coins, then practice or apply as interviewer."
      />

      <InterviewHeader
        data={{
          goal: data.goal,
          readiness: data.readiness,
          nextAction: data.nextAction,
          scores: data.scores,
        }}
        onNextAction={() => {
          void launchMockWithTokens();
        }}
        nextActionTokenCost={25}
      />

      <InterviewRoleOptions
        onRequestInterview={() => router.push('/lms/interview-prep/request-interview')}
        onBecomeInterviewer={() => router.push('/lms/interview-prep/become-interviewer')}
      />

      <div className="grid gap-5 lg:grid-cols-2">
        <MockInterviewCard
          difficulty={mockConfig.difficulty}
          role={mockConfig.role}
          onChangeConfig={(next) => setMockConfig(next)}
          onStartMock={() => undefined}
        />
      </div>

      <TenantInterviewFormsPanel />
    </div>
  );
}
