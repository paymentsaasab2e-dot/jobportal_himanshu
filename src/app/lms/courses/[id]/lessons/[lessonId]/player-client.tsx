'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, Lock, NotebookPen, PlayCircle } from 'lucide-react';
import type { LmsCourseModule, LmsLessonType } from '../../../../data/ai-mock';
import { LMS_CARD_CLASS, LMS_PAGE_SUBTITLE, LMS_SECTION_TITLE } from '../../../../constants';
import { LmsProgressBar } from '../../../../components/LmsProgressBar';
import { useLmsState } from '../../../../state/LmsStateProvider';
import { useLmsToast } from '../../../../components/ux/LmsToastProvider';
import { LmsStatusBadge } from '../../../../components/ux/LmsStatusBadge';
import type { FlatCourseLesson } from '../../../course-utils';

type Mode = 'learn' | 'review';

type LessonDetailsMap = Record<
  string,
  {
    type: LmsLessonType;
    intro: string;
    keyTakeaways: string[];
    practiceTask: string;
    resources: string[];
  }
>;

type Props = {
  course: { id: string; title: string; description: string; duration: string; level: 'Beginner' | 'Intermediate' };
  courseMeta: {
    category: string;
    skills: string[];
    keywords: string[];
    outcomes: string[];
    whyRecommended: string;
    recommendedNextId: string | null;
  };
  modules: LmsCourseModule[];
  flatLessons: FlatCourseLesson[];
  initialIndex: number;
  mode: Mode;
  lessonDetails: LessonDetailsMap;
};

export function LessonPlayerClient({ course, courseMeta, flatLessons, initialIndex, mode, lessonDetails }: Props) {
  const router = useRouter();
  const toast = useLmsToast();
  const { state, setCourseLessonIndex, setCourseProgress, setLastActiveCourseId } = useLmsState();

  const total = flatLessons.length;
  const persistedIndex = Math.max(0, Math.min(total - 1, state.courseLessonIndex[course.id] ?? initialIndex));
  const activeIndex = initialIndex;
  const current = flatLessons[activeIndex];
  const pct = state.courseProgress[course.id] ?? Math.round((persistedIndex / Math.max(1, total)) * 100);
  const completed = pct >= 100;
  const key = `${course.id}:${current.lessonId}`;
  const noteStorageKey = `lmsCourseNote:${course.id}:${current.lessonId}`;
  const [notes, setNotes] = useState(() => {
    try {
      return sessionStorage.getItem(noteStorageKey) ?? '';
    } catch {
      return '';
    }
  });
  const detail = lessonDetails[key] ?? {
    type: 'reading' as LmsLessonType,
    intro: `This lesson content is a frontend-only placeholder for "${current.lessonTitle}".`,
    keyTakeaways: ['Understand the core idea', 'Apply it in one realistic task', 'Connect it to interviews'],
    practiceTask: 'Write a short summary and one concrete example from your own experience.',
    resources: ['Reference notes (mock)', 'Practice prompts (mock)'],
  };

  useEffect(() => {
    setLastActiveCourseId(course.id);
    setCourseLessonIndex(course.id, activeIndex);
  }, [activeIndex, course.id, setCourseLessonIndex, setLastActiveCourseId]);

  const isLocked = (idx: number) => mode !== 'review' && idx > persistedIndex;
  const isCompleted = (idx: number) => idx < persistedIndex;
  const isCurrent = (idx: number) => idx === activeIndex;
  const nextLessonLocked = activeIndex < total - 1 && isLocked(activeIndex + 1);

  const goLesson = (idx: number) => {
    const clamped = Math.max(0, Math.min(total - 1, idx));
    if (isLocked(clamped)) {
      toast.push({ title: 'Locked', message: 'Complete previous lessons first.', tone: 'warning' });
      return;
    }
    const lesson = flatLessons[clamped];
    router.push(`/lms/courses/${course.id}/lessons/${lesson.lessonId}${mode === 'review' ? '?mode=review' : ''}`);
  };

  const markComplete = () => {
    if (mode === 'review') return;
    const next = Math.min(total, Math.max(persistedIndex, activeIndex + 1));
    setCourseLessonIndex(course.id, next);
    const nextPct = Math.round((next / Math.max(1, total)) * 100);
    setCourseProgress(course.id, nextPct);
    toast.push({
      title: nextPct >= 100 ? 'Course completed' : 'Lesson completed',
      message: nextPct >= 100 ? 'Review mode is now available.' : `${nextPct}% complete`,
      tone: nextPct >= 100 ? 'success' : 'info',
    });
  };

  const saveNotes = () => {
    try {
      sessionStorage.setItem(noteStorageKey, notes);
      toast.push({ title: 'Notes saved', message: 'Saved locally in this browser session.', tone: 'success' });
    } catch {
      toast.push({ title: 'Could not save notes', message: 'Storage unavailable in this context.', tone: 'warning' });
    }
  };

  const nextRecommendedHref = courseMeta.recommendedNextId ? `/lms/courses/${courseMeta.recommendedNextId}` : '/lms/courses';

  return (
    <div className="space-y-8">
      <div className="min-w-0">
        <Link href={`/lms/courses/${course.id}${mode === 'review' ? '?mode=review' : ''}`} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to course overview
        </Link>
        <h1 className="mt-3 text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">{current.lessonTitle}</h1>
        <p className={LMS_PAGE_SUBTITLE}>{detail.intro}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <LmsStatusBadge label={detail.type} tone="info" />
          <LmsStatusBadge label={mode === 'review' ? 'Review mode' : 'Learn mode'} tone={mode === 'review' ? 'warning' : 'neutral'} />
          <span className="text-xs font-medium text-gray-500">
            Lesson {activeIndex + 1}/{total} · {current.estMin} min
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <aside className="xl:col-span-4 space-y-4">
          <div className={`${LMS_CARD_CLASS} sticky top-[calc(var(--app-header-height,5.75rem)+1rem)]`}>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Course progress</p>
            <div className="mt-3">
              <LmsProgressBar value={pct} />
            </div>
            <div className="mt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => goLesson(activeIndex - 1)}
                disabled={activeIndex <= 0}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold border ${
                  activeIndex <= 0 ? 'border-gray-200 text-gray-400 bg-white cursor-not-allowed' : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                Previous lesson
              </button>
              <button
                type="button"
                onClick={() => goLesson(activeIndex + 1)}
                disabled={activeIndex >= total - 1 || nextLessonLocked}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold border ${
                  activeIndex >= total - 1 || nextLessonLocked
                    ? 'border-gray-200 text-gray-400 bg-white cursor-not-allowed'
                    : 'border-gray-200 bg-white text-gray-900 hover:bg-gray-50'
                }`}
              >
                Next lesson
              </button>
              <button
                type="button"
                onClick={markComplete}
                disabled={completed || mode === 'review'}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold ${
                  completed || mode === 'review'
                    ? 'bg-[#28A8E1]/40 text-white cursor-not-allowed'
                    : 'bg-[#28A8E1] text-white hover:opacity-95'
                }`}
              >
                {mode === 'review' ? 'Read-only in review mode' : completed ? 'Completed' : 'Mark lesson complete'}
              </button>
            </div>
            {nextLessonLocked ? (
              <p className="mt-3 text-xs font-medium text-amber-700">
                Complete this lesson to unlock the next one.
              </p>
            ) : null}

            <div className="mt-5 pt-4 border-t border-gray-100">
              <p className="text-sm font-bold text-gray-900 mb-2">Curriculum</p>
              <div className="space-y-2 max-h-[42vh] overflow-auto pr-1">
                {flatLessons.map((l, idx) => (
                  <button
                    key={l.lessonId}
                    type="button"
                    onClick={() => goLesson(idx)}
                    className={`w-full text-left rounded-xl border px-3 py-2 transition-all ${
                      isCurrent(idx)
                        ? 'border-[#28A8E1]/40 bg-[#28A8E1]/10'
                        : isCompleted(idx)
                          ? 'border-emerald-100 bg-emerald-50/30'
                          : isLocked(idx)
                            ? 'border-gray-200 bg-white opacity-70'
                            : 'border-gray-100 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0">
                        <span className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">{l.moduleTitle}</span>
                        <span className="block text-sm font-semibold text-gray-900 truncate">{l.lessonTitle}</span>
                      </span>
                      <span className="shrink-0">
                        {isLocked(idx) ? (
                          <Lock className="h-4 w-4 text-gray-400" strokeWidth={2} />
                        ) : isCompleted(idx) ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" strokeWidth={2} />
                        ) : (
                          <PlayCircle className="h-4 w-4 text-[#28A8E1]" strokeWidth={2} />
                        )}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        <main className="xl:col-span-8 space-y-5">
          <section className={`${LMS_CARD_CLASS} min-h-[16rem]`}>
            <p className="text-xs font-bold uppercase tracking-wide text-gray-400 mb-2">Learning canvas</p>
            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 p-6">
              <p className="text-base font-semibold text-gray-900">
                {detail.type === 'video'
                  ? 'Video lesson placeholder'
                  : detail.type === 'exercise'
                    ? 'Interactive exercise placeholder'
                    : detail.type === 'mock'
                      ? 'Mock interview drill placeholder'
                      : 'Reading lesson placeholder'}
              </p>
              <p className="mt-2 text-sm text-gray-600">
                Frontend-only content panel. Replace with real media/interactive backend sources later.
              </p>
            </div>
          </section>

          <section className={`${LMS_CARD_CLASS}`}>
            <h2 className={LMS_SECTION_TITLE}>Key takeaways</h2>
            <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1.5">
              {detail.keyTakeaways.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ul>
          </section>

          <section className={`${LMS_CARD_CLASS}`}>
            <h2 className={LMS_SECTION_TITLE}>Practice task</h2>
            <p className="mt-2 text-sm text-gray-700">{detail.practiceTask}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {detail.resources.map((r) => (
                <span key={r} className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700">
                  {r}
                </span>
              ))}
            </div>
          </section>

          <section className={`${LMS_CARD_CLASS}`}>
            <div className="flex items-center gap-2">
              <NotebookPen className="h-4 w-4 text-[#28A8E1]" strokeWidth={2} />
              <h2 className={LMS_SECTION_TITLE}>Quick notes</h2>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Capture your takeaway from this lesson…"
              rows={5}
              className="mt-3 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            <button
              type="button"
              onClick={saveNotes}
              className="mt-3 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-900 hover:bg-gray-50"
            >
              Save notes
            </button>
          </section>

          {completed ? (
            <section className={`${LMS_CARD_CLASS} border-emerald-100 bg-emerald-50/20`}>
              <p className="text-sm font-bold text-emerald-900">Course completed</p>
              <p className="mt-1 text-sm text-emerald-950/80">
                You can now review any lesson freely or continue to the next recommended course.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <Link
                  href={`/lms/courses/${course.id}?mode=review`}
                  className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95"
                >
                  Review course
                </Link>
                <Link
                  href={nextRecommendedHref}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-900 hover:bg-gray-50"
                >
                  Continue to next course
                  <ArrowRight className="h-4 w-4" strokeWidth={2} />
                </Link>
              </div>
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

