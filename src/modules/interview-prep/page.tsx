'use client';

import * as NextNavigation from 'next/navigation';
import { useInterviewPrep } from './hooks/useInterviewPrep';
import { InterviewHeader } from './components/InterviewHeader';
import { InterviewRoleOptions } from './components/InterviewRoleOptions';
import { LmsPageHeader } from '@/app/lms/components/LmsPageHeader';
import { TenantInterviewFormsPanel } from './components/TenantInterviewFormsPanel';

export default function InterviewPrepModulePage() {
  const router = NextNavigation.useRouter();
  const { data } = useInterviewPrep();

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

      <InterviewRoleOptions
        onRequestInterview={() => router.push('/lms/interview-prep/request-interview')}
        onBecomeInterviewer={() => router.push('/lms/interview-prep/become-interviewer')}
        onLaunchAiInterview={() => router.push('/Aimockinter')}
      />

      <TenantInterviewFormsPanel />
    </div>
  );
}
