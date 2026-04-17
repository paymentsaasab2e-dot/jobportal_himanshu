'use client';

import type { LmsCourseModule } from '../../data/ai-mock';
import { useMemo } from 'react';
import Link from 'next/link';
import { PlayCircle, RotateCcw } from 'lucide-react';
import { LmsProgressBar } from '../../components/LmsProgressBar';
import { useLmsState } from '../../state/LmsStateProvider';
import { useLmsToast } from '../../components/ux/LmsToastProvider';
import { LmsCtaButton } from '../../components/ux/LmsCtaButton';
import { flattenCourseLessons } from '../course-utils';

export function CoursePlayerClient({
  courseId,
  modules,
  recommendedNextId,
}: {
  courseId: string;
  modules: LmsCourseModule[];
  recommendedNextId?: string | null;
}) {
  const { state, setCourseProgress, setCourseLessonIndex, setLastActiveCourseId } = useLmsState();
  const toast = useLmsToast();

  const lessons = useMemo(() => flattenCourseLessons(modules), [modules]);
  const totalLessons = lessons.length;
  const currentIndex = state.courseLessonIndex[courseId] ?? 0;
  const derivedPct = totalLessons > 0 ? Math.round(((currentIndex + 0) / totalLessons) * 100) : 0;
  const pct = state.courseProgress[courseId] ?? derivedPct;

  const primaryLabel = pct >= 100 ? 'Review' : pct > 0 ? 'Continue' : 'Start';

  const startHref =
    pct >= 100
      ? `/lms/courses/${courseId}?mode=review`
      : lessons.length > 0
        ? `/lms/courses/${courseId}/lessons/${lessons[Math.min(lessons.length - 1, Math.max(0, currentIndex))].lessonId}`
        : `/lms/courses/${courseId}`;

  const startOrContinue = () => {
    setLastActiveCourseId(courseId);
    const nextIdx = Math.min(totalLessons, Math.max(0, currentIndex));
    setCourseLessonIndex(courseId, nextIdx);
    if (pct === 0) setCourseProgress(courseId, 1);
    toast.push({ title: `${primaryLabel}ing course`, message: 'Mock player progress is stored locally.', tone: 'info' });
  };

  const markNextDone = () => {
    const next = Math.min(totalLessons, currentIndex + 1);
    setCourseLessonIndex(courseId, next);
    const nextPct = totalLessons > 0 ? Math.round((next / totalLessons) * 100) : 0;
    setCourseProgress(courseId, nextPct);
    setLastActiveCourseId(courseId);
    toast.push({
      title: nextPct >= 100 ? 'Course completed' : 'Progress saved',
      message: nextPct >= 100 ? 'Nice—review anytime.' : `You are now at ${nextPct}%.`,
      tone: nextPct >= 100 ? 'success' : 'info',
    });
  };

  const reset = () => {
    setCourseLessonIndex(courseId, 0);
    setCourseProgress(courseId, 0);
    toast.push({ title: 'Progress reset', message: 'Local progress cleared for this course.', tone: 'warning' });
  };

  return (
    <div className="space-y-4">
      <LmsProgressBar value={pct} />

      <div className="flex flex-col sm:flex-row gap-2">
        <Link
          href={startHref}
          onClick={startOrContinue}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
        >
          <PlayCircle className="h-4 w-4" strokeWidth={2} />
          {primaryLabel}
        </Link>
        <LmsCtaButton
          variant="secondary"
          onClick={markNextDone}
          disabled={pct >= 100}
          leftIcon={<PlayCircle className="h-4 w-4 text-[#28A8E1]" strokeWidth={2} />}
        >
          Mark next lesson done
        </LmsCtaButton>
        <LmsCtaButton variant="ghost" onClick={reset} leftIcon={<RotateCcw className="h-4 w-4" strokeWidth={2} />}>
          Reset
        </LmsCtaButton>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-gray-500">
        <span>Current lesson index: {Math.min(totalLessons, currentIndex)}/{totalLessons}</span>
        <span className="text-gray-300">·</span>
        <Link href="/lms/courses" className="text-[#28A8E1] font-semibold hover:underline">
          Browse courses
        </Link>
      </div>

      {pct >= 100 ? (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/30 p-3">
          <p className="text-sm font-bold text-emerald-900">Completed</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link
              href={`/lms/courses/${courseId}?mode=review`}
              className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:opacity-95"
            >
              Review course
            </Link>
            <button
              type="button"
              onClick={reset}
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
            >
              Restart course
            </button>
            {recommendedNextId ? (
              <Link
                href={`/lms/courses/${recommendedNextId}`}
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-semibold text-gray-900 hover:bg-gray-50"
              >
                Next recommended
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

