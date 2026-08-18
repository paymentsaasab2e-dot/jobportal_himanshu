'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { use, useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock3,
  GraduationCap,
  ListChecks,
  PlayCircle,
  Tag,
  UserRound,
} from 'lucide-react';
import { LMS_CARD_CLASS, LMS_SECTION_TITLE } from '../../constants';
import { LmsEmptyState } from '../../components/states/LmsEmptyState';
import { LmsSkeleton } from '../../components/states/LmsSkeleton';
import { LmsVideoPlayer } from '../../components/LmsVideoPlayer';
import { LmsProgressBar } from '../../components/LmsProgressBar';
import { enrollCourse, fetchCourseDetail } from '../../api/client';
import { CourseAccessBadge, TokenSpendButton } from '../../components/ux/TokenSpendButton';
import { useLmsState } from '../../state/LmsStateProvider';
import { flattenCourseLessons } from '../course-utils';

function capitalize(value?: string | null) {
  const text = String(value || '').trim();
  if (!text) return '—';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

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
  const router = useRouter();
  const { state, setCourseLessonIndex, setCourseProgress, setLastActiveCourseId } = useLmsState();

  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchCourseDetail(id);
        setCourse(data);
      } catch (err) {
        console.error(err);
        setCourse(null);
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

  const displayModules = useMemo(() => {
    if (!course) return [];
    return [
      {
        id: 'm-1',
        title: 'Course Content',
        lessons: (course.lessons || []).map((l: any) => ({
          id: l.id,
          title: l.title,
          estMin: Number(l.durationMinutes) || 0,
        })),
      },
    ];
  }, [course]);

  const flatLessons = useMemo(() => flattenCourseLessons(displayModules), [displayModules]);

  if (loading) {
    return (
      <div className="space-y-6 rounded-2xl border border-slate-200/80 bg-white/95 p-5 shadow-sm">
        <LmsSkeleton lines={10} />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-6">
        <Link
          href="/lms/courses"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to courses
        </Link>
        <LmsEmptyState
          title="We couldn’t find this"
          body="It may have been removed. Go back and choose another course."
          action={
            <Link
              href="/lms/courses"
              className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
            >
              Browse courses
            </Link>
          }
        />
      </div>
    );
  }

  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const totalLessons = Number(course.totalLessons) || lessons.length || flatLessons.length || 0;
  const estimatedHours = Number(course.estimatedHours) || 0;
  const isLocked = Boolean(course.isLocked) && Number(course.tokenCost) > 0;
  const tokenCost = Number(course.tokenCost) || 0;
  const tags = Array.isArray(course.tags) ? course.tags.map(String).filter(Boolean) : [];
  const courseVideoUrl =
    course.videoUrl ||
    lessons.find((l: { videoUrl?: string | null }) => l.videoUrl)?.videoUrl ||
    null;
  const thumbnailUrl = course.thumbnailUrl || null;
  const levelLabel = capitalize(course.level);
  const categoryLabel = capitalize(course.category);
  const instructorName = String(course.instructorName || '').trim() || 'Not specified';
  const currentIndex = Math.min(
    Math.max(0, state.courseLessonIndex[course.id] ?? 0),
    Math.max(0, flatLessons.length - 1),
  );
  const progressPct =
    state.courseProgress[course.id] ??
    (flatLessons.length ? Math.round((currentIndex / flatLessons.length) * 100) : 0);
  const startLabel = progressPct >= 100 ? 'Review course' : progressPct > 0 ? 'Continue learning' : 'Start course';
  const startLesson = flatLessons[currentIndex] || flatLessons[0];

  const openLesson = async (lessonId: string, idx: number) => {
    if (isLocked) return;
    try {
      if (!course.enrollmentStatus) {
        await enrollCourse(id);
        setCourse((prev: any) => (prev ? { ...prev, enrollmentStatus: true, isLocked: false } : prev));
      }
    } catch (err) {
      console.error(err);
    }
    setLastActiveCourseId(course.id);
    setCourseLessonIndex(course.id, idx);
    if (progressPct === 0) setCourseProgress(course.id, 1);
    router.push(
      `/lms/courses/${course.id}/lessons/${lessonId}${mode === 'review' ? '?mode=review' : ''}`,
    );
  };

  const metaItems = [
    { icon: UserRound, label: 'Instructor', value: instructorName },
    { icon: GraduationCap, label: 'Level', value: levelLabel },
    { icon: BookOpen, label: 'Category', value: categoryLabel },
    {
      icon: Clock3,
      label: 'Duration',
      value: estimatedHours > 0 ? `${estimatedHours} hours` : 'Not specified',
    },
    { icon: ListChecks, label: 'Lessons', value: String(totalLessons) },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/lms/courses"
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2} />
        Back to courses
      </Link>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <section className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <CourseAccessBadge
                accessTier={course.accessTier}
                tokenCost={tokenCost}
                isCertified={course.isCertified}
              />
              <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                {categoryLabel}
              </span>
              <span className="inline-flex rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm">
                {levelLabel}
              </span>
              {mode === 'review' ? (
                <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
                  Review mode
                </span>
              ) : null}
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {course.title}
            </h1>
            <p className="max-w-3xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
              {course.description || 'No description was added for this course yet.'}
            </p>
          </section>

          <section className={`${LMS_CARD_CLASS} space-y-4`}>
            <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-950">
              {!isLocked && courseVideoUrl ? (
                <LmsVideoPlayer
                  url={courseVideoUrl}
                  title={`${course.title} video`}
                  className="rounded-none border-0"
                />
              ) : thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt={course.title}
                  className="aspect-video w-full object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-sky-100 via-white to-orange-50">
                  <div className="text-center">
                    <PlayCircle className="mx-auto h-10 w-10 text-[#28A8E1]" strokeWidth={1.75} />
                    <p className="mt-2 text-sm font-semibold text-slate-600">No media added yet</p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-700">
              {metaItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="inline-flex min-w-0 items-center gap-2">
                    <Icon className="h-4 w-4 shrink-0 text-[#28A8E1]" strokeWidth={2} />
                    <span className="text-slate-500">{item.label}:</span>
                    <span className="truncate font-semibold text-slate-900" title={item.value}>
                      {item.value}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>

          {tags.length ? (
            <section className={LMS_CARD_CLASS}>
              <h2 className={LMS_SECTION_TITLE}>
                <Tag className="h-4 w-4 text-[#28A8E1]" strokeWidth={2} />
                Tags
              </h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {tags.map((tag: string) => (
                  <span
                    key={tag}
                    className="inline-flex rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          ) : null}

          <section className={LMS_CARD_CLASS}>
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className={LMS_SECTION_TITLE}>Course content</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {totalLessons} lesson{totalLessons === 1 ? '' : 's'}
                  {estimatedHours > 0 ? ` · ${estimatedHours}h total` : ''}
                </p>
              </div>
            </div>

            {isLocked ? (
              <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-4">
                <p className="text-sm font-semibold text-amber-950">Lessons locked</p>
                <p className="mt-1 text-sm text-amber-900/80">
                  Unlock this course to access all lessons and video.
                </p>
              </div>
            ) : flatLessons.length ? (
              <ul className="mt-4 divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200">
                {flatLessons.map((lesson, idx) => {
                  const isCurrent = idx === currentIndex;
                  return (
                    <li key={lesson.lessonId}>
                      <button
                        type="button"
                        onClick={() => void openLesson(lesson.lessonId, idx)}
                        className={`flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-sky-50/60 ${
                          isCurrent ? 'bg-sky-50/80' : 'bg-white'
                        }`}
                      >
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Lesson {idx + 1}
                          </span>
                          <span className="mt-0.5 block truncate text-sm font-semibold text-slate-900">
                            {lesson.lessonTitle}
                          </span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-slate-500">
                          {lesson.estMin > 0 ? <span>{lesson.estMin} min</span> : null}
                          <PlayCircle className="h-4 w-4 text-[#28A8E1]" strokeWidth={2} />
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-4 py-5">
                <p className="text-sm font-semibold text-slate-900">No lessons yet</p>
                <p className="mt-1 text-sm text-slate-600">
                  Add a course video or YouTube link from HQ Create Course to generate the introduction
                  lesson.
                </p>
              </div>
            )}
          </section>
        </div>

        <aside className="lg:sticky lg:top-[calc(var(--app-header-height,92px)+16px)] lg:z-20 lg:self-start">
          <div className={`${LMS_CARD_CLASS} space-y-4 lg:max-h-[calc(100vh-var(--app-header-height,92px)-32px)] lg:overflow-y-auto`}>
            {thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt=""
                className="aspect-video w-full rounded-xl border border-slate-200 object-cover"
              />
            ) : null}

            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Access</p>
              <div className="mt-2">
                <CourseAccessBadge
                  accessTier={course.accessTier}
                  tokenCost={tokenCost}
                  isCertified={course.isCertified}
                />
              </div>
            </div>

            {!isLocked ? (
              <div className="space-y-3">
                <LmsProgressBar value={progressPct} />
                <p className="text-xs font-medium text-slate-500">{progressPct}% complete</p>
                <button
                  type="button"
                  disabled={!startLesson}
                  onClick={() => startLesson && void openLesson(startLesson.lessonId, currentIndex)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8E1] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <PlayCircle className="h-4 w-4" strokeWidth={2} />
                  {startLabel}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">
                  This is a <strong>{course.accessTier || 'premium'}</strong> course. Unlock once to
                  access full lessons and video.
                </p>
                <TokenSpendButton tokenCost={tokenCost} onSpend={handleUnlock} />
              </div>
            )}

            <div className="space-y-2 border-t border-slate-100 pt-4 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Token cost</span>
                <span className="font-semibold text-slate-900">{tokenCost}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Certified</span>
                <span className="font-semibold text-slate-900">{course.isCertified ? 'Yes' : 'No'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-slate-500">Published</span>
                <span className="font-semibold text-slate-900">
                  {course.isPublished === false ? 'Draft' : 'Yes'}
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
