'use client';

import { Suspense } from 'react';
import { LMS_CARD_CLASS } from '../../constants';
import { LmsSkeleton } from '../../components/states/LmsSkeleton';
import { ResumeStudioPageClient } from './ResumeStudioPageClient';

function ResumeEditorPageFallback() {
  return (
    <div className={LMS_CARD_CLASS}>
      <LmsSkeleton lines={8} />
    </div>
  );
}

export default function ResumeEditorPage() {
  return (
    <Suspense fallback={<ResumeEditorPageFallback />}>
      <ResumeStudioPageClient />
    </Suspense>
  );
}
