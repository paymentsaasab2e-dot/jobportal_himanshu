'use client';

import type { LmsCourseModule } from '../../data/ai-mock';
import { useMemo } from 'react';
import { CheckCircle2, Lock, PlayCircle } from 'lucide-react';
import { LMS_CARD_CLASS } from '../../constants';
import { useLmsState } from '../../state/LmsStateProvider';
import { useLmsToast } from '../../components/ux/LmsToastProvider';

type Mode = 'learn' | 'review';

type FlatLesson = {
  moduleId: string;
  moduleTitle: string;
  lessonId: string;
  lessonTitle: string;
  estMin: number;
};

function flatten(modules: LmsCourseModule[]): FlatLesson[] {
  const out: FlatLesson[] = [];
  for (const m of modules) {
    for (const l of m.lessons) {
      out.push({
        moduleId: m.id,
        moduleTitle: m.title,
        lessonId: l.id,
        lessonTitle: l.title,
        estMin: l.estMin,
      });
    }
  }
  return out;
}

export function CourseLessonsClient({ courseId, modules, mode }: { courseId: string; modules: LmsCourseModule[]; mode: Mode }) {
  const toast = useLmsToast();
  const { state, setCourseLessonIndex, setCourseProgress, setLastActiveCourseId } = useLmsState();

  const flat = useMemo(() => flatten(modules), [modules]);
  const total = flat.length;
  const currentIndex = Math.min(total, Math.max(0, state.courseLessonIndex[courseId] ?? 0));
  const pct = state.courseProgress[courseId] ?? (total ? Math.round((currentIndex / total) * 100) : 0);

  const isCompleted = (idx: number) => idx < currentIndex;
  const isCurrent = (idx: number) => idx === currentIndex;

  const isLocked = (idx: number) => {
    if (mode === 'review') return false;
    // In learn mode, allow current + completed; lock future.
    return idx > currentIndex;
  };

  const openLesson = (idx: number) => {
    if (isLocked(idx)) {
      toast.push({ title: 'Locked', message: 'Complete the current lesson first (mock).', tone: 'warning' });
      return;
    }
    setLastActiveCourseId(courseId);
    setCourseLessonIndex(courseId, idx);
    toast.push({ title: 'Lesson opened', message: flat[idx]?.lessonTitle ?? 'Lesson', tone: 'info' });
  };

  const completeCurrent = () => {
    const next = Math.min(total, currentIndex + 1);
    setCourseLessonIndex(courseId, next);
    const nextPct = total ? Math.round((next / total) * 100) : 0;
    setCourseProgress(courseId, nextPct);
    setLastActiveCourseId(courseId);
    toast.push({
      title: nextPct >= 100 ? 'Course completed' : 'Lesson completed',
      message: nextPct >= 100 ? 'Nice—review anytime.' : `${nextPct}% complete`,
      tone: nextPct >= 100 ? 'success' : 'info',
    });
  };

  // Group back into module sections for display while still using flat index for state.
  let cursor = 0;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {modules.map((m) => {
        const start = cursor;
        const end = cursor + m.lessons.length;
        cursor = end;
        return (
          <div key={m.id} className={`${LMS_CARD_CLASS} transition-all duration-200 hover:shadow-md`}>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-base font-bold text-gray-900">{m.title}</p>
                <p className="mt-1 text-xs font-medium text-gray-500">
                  {end - start} lessons · {pct}% course complete
                </p>
              </div>
              <button
                type="button"
                onClick={completeCurrent}
                disabled={mode === 'review' || pct >= 100}
                className={`shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
                  mode === 'review' || pct >= 100
                    ? 'border border-gray-200 bg-white text-gray-400 cursor-not-allowed opacity-70'
                    : 'bg-[#28A8E1] text-white hover:opacity-95 hover:shadow-sm active:scale-[0.98]'
                }`}
              >
                Mark current done
              </button>
            </div>

            <ul className="mt-4 space-y-2">
              {flat.slice(start, end).map((l, i) => {
                const idx = start + i;
                const locked = isLocked(idx);
                const completed = isCompleted(idx);
                const current = isCurrent(idx);
                return (
                  <li key={l.lessonId}>
                    <button
                      type="button"
                      onClick={() => openLesson(idx)}
                      className={`w-full flex items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-blue-100 ${
                        current
                          ? 'border-[#28A8E1]/40 bg-[#28A8E1]/10 shadow-sm'
                          : completed
                            ? 'border-emerald-100 bg-emerald-50/30 hover:shadow-sm'
                            : locked
                              ? 'border-gray-200 bg-white opacity-70'
                              : 'border-gray-100 bg-white hover:bg-gray-50 hover:shadow-sm'
                      }`}
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-gray-900 truncate">{l.lessonTitle}</span>
                        <span className="block text-xs font-medium text-gray-500">{l.estMin} min</span>
                      </span>
                      <span className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold text-gray-600">
                        {locked ? (
                          <Lock className="h-4 w-4 text-gray-400" strokeWidth={2} aria-hidden />
                        ) : completed ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-700" strokeWidth={2} aria-hidden />
                        ) : (
                          <PlayCircle className="h-4 w-4 text-[#28A8E1]" strokeWidth={2} aria-hidden />
                        )}
                        {locked ? 'Locked' : completed ? 'Completed' : current ? 'Current' : 'Open'}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

