'use client';

import { Suspense } from 'react';
import { LmsQuizzesPageFallback } from './quiz-page-helpers';
import { LmsQuizzesPageContent } from './quizzes-page-client';

export default function LmsQuizzesPage() {
  return (
    <Suspense fallback={<LmsQuizzesPageFallback />}>
      <LmsQuizzesPageContent />
    </Suspense>
  );
}
