'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { ArrowLeft, BookOpen, CheckCircle2, ListChecks, Sparkles } from 'lucide-react';
import { LMS_CARD_CLASS, LMS_PAGE_SUBTITLE, LMS_SECTION_TITLE } from '../../constants';
import { lmsCourseMeta } from '../../data/ai-mock';
import { CoursePlayerClient } from './player-client';
import { CourseLessonsClient } from './CourseLessonsClient';
import { LmsEmptyState } from '../../components/states/LmsEmptyState';
import { LmsSkeleton } from '../../components/states/LmsSkeleton';
import { enrollCourse, fetchCourseDetail } from '../../api/client';
import { CourseAccessBadge, TokenSpendButton } from '../../components/ux/TokenSpendButton';

export default function LmsCourseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const { id } = use(params);
  const sp = searchParams ? use(searchParams) : {};
  const mode = sp.mode === 'review' ? 'review' : 'learn';

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCourseDetail(id);
        setCourse(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleUnlock = async () => {
    await enrollCourse(id);
    const data = await fetchCourseDetail(id);
    setCourse(data);
  };

  if (loading) {
    return (
      <div className="space-y-8 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <LmsSkeleton lines={8} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-8">
        <div className="min-w-0">
          <Link
            href="/lms/courses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to courses
          </Link>
        </div>
        <LmsEmptyState
          title="Course not found"
          body={`We couldn't find a course with id “${id}”.`}
          action={
            <Link
              href="/lms/courses"
              className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
            >
              Browse courses
            </Link>
          }
        />
      </div>
    );
  }

  const meta = lmsCourseMeta[id] || {};

  const displayModules = [
    {
      moduleId: 'm-1',
      moduleTitle: 'Course Content',
      lessons: (course.lessons || []).map((l: any) => ({
        lessonId: l.id,
        lessonTitle: l.title,
        type: l.type,
        duration: `${l.durationMinutes} min`,
      })),
    },
  ];

  const totalLessons = displayModules.reduce((acc, m) => acc + m.lessons.length, 0);
  const isLocked = Boolean(course.isLocked) && Number(course.tokenCost) > 0;
  const tokenCost = Number(course.tokenCost) || 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <Link
            href="/lms/courses"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={2} />
            Back to courses
          </Link>
          <h1 className="application-detail-title mt-3">{course.title}</h1>
          <p className={`${LMS_PAGE_SUBTITLE} mt-1`}>{course.description}</p>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-gray-600">
            <CourseAccessBadge
              accessTier={course.accessTier}
              tokenCost={tokenCost}
              isCertified={course.isCertified}
            />
            <span className="inline-flex items-center gap-1 rounded-full bg-gray-50 border border-gray-200 px-3 py-1 font-semibold">
              <BookOpen className="h-4 w-4 text-gray-500" strokeWidth={2} />
              {course.estimatedHours}h
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-100 px-3 py-1 font-semibold text-violet-900">
              <ListChecks className="h-4 w-4 text-violet-700" strokeWidth={2} />
              {totalLessons} lessons
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white border border-gray-200 px-3 py-1 font-semibold text-gray-800">
              Mode: {mode === 'review' ? 'Review' : 'Learn'}
            </span>
          </div>
        </div>

        <div className={`${LMS_CARD_CLASS} sm:max-w-sm space-y-3`}>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Access</p>
          {isLocked ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600">
                This is a <strong>{course.accessTier || 'premium'}</strong> course. Unlock to access
                full lessons.
              </p>
              <TokenSpendButton tokenCost={tokenCost} onSpend={handleUnlock} />
            </div>
          ) : (
            <div className="mt-1">
              <CoursePlayerClient
                courseId={course.id}
                modules={displayModules}
                recommendedNextId={meta?.recommendedNextId}
              />
            </div>
          )}
        </div>
      </div>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className={`${LMS_CARD_CLASS} xl:col-span-2 transition-all duration-200 hover:shadow-md`}>
          <h2 className={LMS_SECTION_TITLE}>What you&apos;ll learn</h2>
          <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1.5">
            {(meta?.outcomes ?? ['Build confidence in this topic area.', 'Practice interview-ready explanations.']).map(
              (o: string) => (
                <li key={o}>{o}</li>
              ),
            )}
          </ul>
        </div>
        <div className={`${LMS_CARD_CLASS} transition-all duration-200 hover:shadow-md`}>
          <h2 className={LMS_SECTION_TITLE}>Skills & relevance</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(course.tags || meta?.skills || []).map((s: string) => (
              <span
                key={s}
                className="inline-flex rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-700"
              >
                {s}
              </span>
            ))}
          </div>
          <p className="mt-4 text-sm text-gray-600">
            {meta?.whyRecommended ?? course.aiContext ?? 'Recommended by AI Engine.'}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className={LMS_SECTION_TITLE}>Modules</h2>
        {isLocked ? (
          <div className={`${LMS_CARD_CLASS} border-amber-100 bg-amber-50/40`}>
            <p className="text-sm font-semibold text-amber-950">Lessons locked</p>
            <p className="mt-1 text-sm text-amber-900/80">
              Unlock this course to access all modules.
            </p>
          </div>
        ) : (
          <CourseLessonsClient courseId={course.id} modules={displayModules} mode={mode} />
        )}
      </section>

      <section className={`${LMS_CARD_CLASS} border-emerald-100 bg-emerald-50/20`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="h-5 w-5 text-emerald-700 mt-0.5" strokeWidth={2} aria-hidden />
          <div>
            <p className="text-sm font-bold text-emerald-900">Token-based access</p>
            <p className="mt-1 text-sm font-normal text-emerald-950/70">
              Free courses start instantly. Premium and Certified courses require a one-time token unlock.
            </p>
          </div>
        </div>
      </section>

      <section className={`${LMS_CARD_CLASS} transition-all duration-200 hover:shadow-md`}>
        <div className="flex items-start gap-3">
          <Sparkles className="h-5 w-5 text-violet-700 mt-0.5" strokeWidth={2} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-gray-900">Recommended next</p>
            <p className="mt-1 text-sm text-gray-600">Continue momentum with a related course after this one.</p>
            {meta?.recommendedNextId ? (
              <Link
                href={`/lms/courses/${meta.recommendedNextId}`}
                className="mt-3 inline-flex text-sm font-semibold text-[#28A8E1] hover:underline"
              >
                Open next course
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
