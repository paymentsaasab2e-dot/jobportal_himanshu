'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Suspense, useMemo, useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Clock, BookOpen, Code2, Palette, LineChart, Search } from 'lucide-react';
import { LMS_CARD_INTERACTIVE, LMS_PAGE_SUBTITLE } from '../constants';
import { LmsProgressBar } from '../components/LmsProgressBar';
import { AISectionHeading } from '../components/ai';
import { useLmsState } from '../state/LmsStateProvider';
import { useLmsToast } from '../components/ux/LmsToastProvider';
import { LmsStatusBadge } from '../components/ux/LmsStatusBadge';
import { LmsEmptyState } from '../components/states/LmsEmptyState';
import { LmsSkeleton } from '../components/states/LmsSkeleton';
import { courseStatusFromPct, parseDurationToMinutes } from './course-utils';
import { fetchCourses, toggleSaveCourse } from '../api/client';
import { GlobalLoader } from '@/components/auth/GlobalLoader';

const ICON_MAP: Record<string, typeof Code2> = {
  code2: Code2,
  palette: Palette,
  lineChart: LineChart,
  bookOpen: BookOpen,
};

const COURSE_COVER_MAP: Record<
  string,
  {
    src: string;
    alt: string;
    eyebrow: string;
  }
> = {
  c1: {
    src: '/lms/course-covers/frontend-interview-readiness.svg',
    alt: 'Frontend interview readiness course cover',
    eyebrow: 'Interview prep',
  },
  c2: {
    src: '/lms/course-covers/ui-craft-accessibility.svg',
    alt: 'UI craft and accessibility course cover',
    eyebrow: 'Design systems',
  },
  c3: {
    src: '/lms/course-covers/data-literacy-product-roles.svg',
    alt: 'Data literacy for product roles course cover',
    eyebrow: 'Analytics',
  },
  c4: {
    src: '/lms/course-covers/professional-communication.svg',
    alt: 'Professional communication course cover',
    eyebrow: 'Collaboration',
  },
  c5: {
    src: '/lms/course-covers/system-design-warm-up.svg',
    alt: 'System design warm-up course cover',
    eyebrow: 'Architecture',
  },
  c6: {
    src: '/lms/course-covers/career-narrative-lab.svg',
    alt: 'Career narrative lab course cover',
    eyebrow: 'Storytelling',
  },
  default: {
    src: '/lms/course-covers/career-narrative-lab.svg',
    alt: 'Course cover',
    eyebrow: 'Learning',
  }
};

function courseCtaLabel(progress: number | null) {
  if (progress === 100) return 'Review';
  if (progress != null && progress > 0) return 'Continue';
  return 'Start';
}

function levelBadge(level: 'Beginner' | 'Intermediate' | string) {
  if (level.toLowerCase() === 'beginner') {
    return (
      <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-800">
        Beginner
      </span>
    );
  }
  return (
    <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-800 capitalize">
      {level.toLowerCase()}
    </span>
  );
}

function LmsCoursesPageFallback() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
      <LmsSkeleton lines={5} />
    </div>
  );
}

function LmsCoursesPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { state, setLastActiveCourseId } = useLmsState();
  const careerGoal = state.careerPath.role;
  const toast = useLmsToast();
  
  const focusParam = searchParams.get('focus')?.trim() ?? '';
  const source = searchParams.get('from')?.trim() ?? '';
  const topic = searchParams.get('topic')?.trim() ?? '';
  const recommendedCourseId = searchParams.get('recommendedCourseId')?.trim() ?? '';

  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<'all' | 'Beginner' | 'Intermediate'>('all');
  const [status, setStatus] = useState<'all' | 'in_progress' | 'completed' | 'saved'>('all');
  const [category, setCategory] = useState<'all' | string>('all');
  const [durationBand, setDurationBand] = useState<'all' | 'short' | 'medium' | 'long'>('all');
  const [sortBy, setSortBy] = useState<'recommended' | 'progress' | 'duration' | 'alphabetical'>('recommended');

  const [backendCourses, setBackendCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [minLoadingTimeFinished, setMinLoadingTimeFinished] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinLoadingTimeFinished(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Fetch courses from backend
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        // Build filters for API if needed, but doing frontend sorting for instant UI feel
        const data = await fetchCourses({ search: query, level: level !== 'all' ? level.toLowerCase() : '', focusTopic: focusParam });
        setBackendCourses(data || []);
      } catch (err) {
        toast.push({ title: 'Error', message: 'Failed to load courses', tone: 'destructive' });
      } finally {
        setLoading(false);
      }
    }
    const timeoutId = setTimeout(() => { init() }, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [query, level, focusParam, toast]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    backendCourses.forEach((c) => set.add(c.category ?? 'general'));
    return ['all', ...Array.from(set)];
  }, [backendCourses]);

  const courses = useMemo(() => {
    const base = backendCourses.map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      iconKey: 'bookOpen',
      progress: c.progressPercent ?? 0,
      duration: c.estimatedHours ? `${c.estimatedHours}h` : '1h',
      level: c.level,
      isSaved: c.isSaved,
      isCompleted: c.isCompleted,
      category: c.category,
      tags: c.tags || [],
      focusReason: c.focusReason
    })).filter((course) => {
      const pct = course.progress;
      const st = courseStatusFromPct(pct);
      const mins = parseDurationToMinutes(course.duration);

      if (status === 'saved' && !course.isSaved) return false;
      if (status === 'in_progress' && st !== 'in_progress') return false;
      if (status === 'completed' && st !== 'completed') return false;
      if (category !== 'all' && course.category !== category) return false;
      if (durationBand === 'short' && mins >= 180) return false;
      if (durationBand === 'medium' && (mins < 180 || mins > 300)) return false;
      if (durationBand === 'long' && mins <= 300) return false;

      // Goal-based relevance filter
      if (careerGoal) {
        const goalStr = careerGoal.toLowerCase();
        const goalKeywords = goalStr.split(' ').filter(w => w.length > 2);
        
        const titleMatch = course.title.toLowerCase().includes(goalStr);
        const catMatch = course.category?.toLowerCase().includes(goalStr);
        const descMatch = course.description?.toLowerCase().includes(goalStr);
        const tagMatch = course.tags.some((t: string) => t.toLowerCase().includes(goalStr));
        
        const keywordMatch = goalKeywords.some((w: string) => 
          course.title.toLowerCase().includes(w) || 
          course.description?.toLowerCase().includes(w) || 
          course.tags.some((t: string) => t.toLowerCase().includes(w))
        );

        if (!titleMatch && !catMatch && !descMatch && !tagMatch && !keywordMatch) {
          return false;
        }
      }

      return true;
    });

    const sorted = [...base];
    if (sortBy === 'alphabetical') sorted.sort((a, b) => a.title.localeCompare(b.title));
    else if (sortBy === 'duration') sorted.sort((a, b) => parseDurationToMinutes(a.duration) - parseDurationToMinutes(b.duration));
    else if (sortBy === 'progress') {
      sorted.sort((a, b) => b.progress - a.progress);
    }
    if (focusParam) {
      sorted.sort((a, b) => {
        const aIsRecommended = recommendedCourseId && a.id === recommendedCourseId;
        const bIsRecommended = recommendedCourseId && b.id === recommendedCourseId;
        if (aIsRecommended !== bIsRecommended) return aIsRecommended ? -1 : 1;
        const aMatches = !!a.focusReason;
        const bMatches = !!b.focusReason;
        if (aMatches === bMatches) return 0;
        return aMatches ? -1 : 1;
      });
    }

    return sorted;
  }, [backendCourses, category, durationBand, focusParam, recommendedCourseId, sortBy, status]);

  const focusMatchCount = courses.filter((c) => c.focusReason).length;
  const highlightedCourse = courses.find((c) => c.id === recommendedCourseId) ?? courses.find((c) => c.focusReason) ?? null;

  async function handleToggleSave(courseId: string, currentlySaved: boolean) {
    try {
      // Optimistic update
      setBackendCourses(prev => prev.map(c => c.id === courseId ? { ...c, isSaved: !currentlySaved } : c));
      await toggleSaveCourse(courseId, !currentlySaved);
      toast.push({
        title: !currentlySaved ? 'Saved course' : 'Removed from saved',
        message: 'Your list has been updated.',
        tone: 'success',
      });
    } catch (e) {
      toast.push({ title: 'Error', message: 'Could not update save state', tone: 'destructive' });
      // Revert optimistic
      setBackendCourses(prev => prev.map(c => c.id === courseId ? { ...c, isSaved: currentlySaved } : c));
    }
  }

  if (loading || !minLoadingTimeFinished) {
    return <GlobalLoader />;
  }

  return (
    <div className="space-y-6 pt-2">
      <div className="min-w-0">
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1 tracking-tight">Courses</h1>
        <p className={LMS_PAGE_SUBTITLE}>Structured learning paths to support your job search and interviews.</p>
      </div>

      <section className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm space-y-3">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <label className="lg:col-span-4 block">
            <span className="sr-only">Search courses</span>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" strokeWidth={2} />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, skill, or keyword"
                className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm font-medium text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </label>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as typeof level)}
            className="lg:col-span-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">All levels</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as typeof status)}
            className="lg:col-span-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">All status</option>
            <option value="in_progress">In progress</option>
            <option value="completed">Completed</option>
            <option value="saved">Saved</option>
          </select>
          <select
            value={durationBand}
            onChange={(e) => setDurationBand(e.target.value as typeof durationBand)}
            className="lg:col-span-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="all">Any duration</option>
            <option value="short">Short (&lt;3h)</option>
            <option value="medium">Medium (3-5h)</option>
            <option value="long">Long (&gt;5h)</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="lg:col-span-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-semibold text-gray-900 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          >
            <option value="recommended">Sort: Recommended</option>
            <option value="progress">Sort: Progress</option>
            <option value="duration">Sort: Duration</option>
            <option value="alphabetical">Sort: Alphabetical</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-all capitalize ${category === cat
                  ? 'border-[#28A8E1]/40 bg-[#28A8E1]/10 text-gray-900'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                }`}
            >
              {cat === 'all' ? 'All categories' : cat}
            </button>
          ))}
        </div>
      </section>

      {focusParam ? (
        <section className="rounded-2xl border border-sky-100 bg-sky-50/50 p-4 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold text-gray-900">
                Suggested lessons for <span className="text-[#28A8E1]">{topic || focusParam}</span>
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {focusMatchCount > 0
                  ? `${focusMatchCount} matching course${focusMatchCount === 1 ? '' : 's'} surfaced first${source === 'quizzes' ? ` because Quizzes flagged ${topic || focusParam} as your next review area.` : ' based on your quiz context.'}`
                  : `No direct matches were found for ${topic || focusParam}, so the full catalog is still available for broader browsing.`}
              </p>
              {highlightedCourse ? (
                <p className="mt-1 text-sm font-semibold text-sky-900">
                  Start with: {highlightedCourse.title}
                </p>
              ) : null}
            </div>
            <Link href="/lms/courses" className="text-sm font-semibold text-[#28A8E1] hover:underline">
              Clear suggestion focus
            </Link>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          <LmsCoursesPageFallback />
          <LmsCoursesPageFallback />
          <LmsCoursesPageFallback />
        </div>
      ) : courses.length === 0 ? (
        <LmsEmptyState
          title="No courses match your filters"
          body="Try clearing filters or using fewer keywords."
          action={
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setLevel('all');
                setStatus('all');
                setCategory('all');
                setDurationBand('all');
                setSortBy('recommended');
              }}
              className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
            >
              Reset filters
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course, idx) => {
            const isFocusMatch = !!course.focusReason;
            const Icon = ICON_MAP[course.iconKey] ?? BookOpen;
            const cover = COURSE_COVER_MAP[`c${(idx % 6) + 1}`] ?? COURSE_COVER_MAP.default;
            const saved = course.isSaved;
            const pct = course.progress;
            
            const courseHref = pct >= 100 ? `/lms/courses/${course.id}?mode=review` : `/lms/courses/${course.id}`;
            
            return (
              <div
                key={course.id}
                className={`${LMS_CARD_INTERACTIVE} group ${isFocusMatch ? 'border-[#28A8E1]/30 bg-sky-50/20' : ''}`}
                onClick={(e) => {
                  const target = e.target as HTMLElement;
                  if (target.closest('button')) return;
                  setLastActiveCourseId(course.id);
                  router.push(`/lms/courses/${course.id}`);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setLastActiveCourseId(course.id);
                    router.push(`/lms/courses/${course.id}`);
                  }
                }}
              >
                <div className="-mx-6 -mt-6 overflow-hidden border-b border-slate-200/70 sm:-mx-7 sm:-mt-7">
                  <div className="relative aspect-[16/9] bg-slate-100">
                    <Image
                      src={cover.src}
                      alt={cover.alt}
                      fill
                      sizes="(min-width: 1280px) 380px, (min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/35 via-slate-900/5 to-transparent" />
                    <div className="absolute left-4 top-4 flex items-center gap-2">
                      <span className="rounded-full bg-white/92 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-800 shadow-sm">
                        {cover.eyebrow}
                      </span>
                    </div>
                    <div className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/88 text-[#28A8E1] shadow-sm backdrop-blur-sm">
                      <Icon className="h-5 w-5" strokeWidth={2} />
                    </div>
                  </div>
                </div>
                <div className="min-w-0 space-y-4 pt-5">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        href={`/lms/courses/${course.id}`}
                        onClick={() => setLastActiveCourseId(course.id)}
                        className="text-lg font-bold !text-black leading-snug hover:underline"
                      >
                        {course.title}
                      </Link>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {isFocusMatch ? <LmsStatusBadge label={`Focus: ${focusParam}`} tone="success" /> : null}
                        {saved ? <LmsStatusBadge label="Saved" tone="info" /> : null}
                      </div>
                    </div>
                    <p className="mt-1.5 text-sm text-gray-500 font-normal leading-relaxed">{course.description}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      {levelBadge(course.level)}
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500">
                        <Clock className="h-3.5 w-3.5" strokeWidth={2} />
                        {course.duration}
                      </span>
                      {course.category ? (
                        <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 capitalize">
                          {course.category}
                        </span>
                      ) : null}
                    </div>

                    {pct > 0 && pct < 100 ? (
                      <LmsProgressBar value={pct} />
                    ) : null}
                    {pct >= 100 ? (
                      <p className="text-xs font-semibold text-emerald-700">Completed — revisit anytime</p>
                    ) : null}

                    {course.focusReason ? (
                      <p className="text-xs font-medium text-blue-600 bg-blue-50 p-2 rounded-md">{course.focusReason}</p>
                    ) : null}

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap pt-2">
                      <Link
                        href={courseHref}
                        onClick={() => setLastActiveCourseId(course.id)}
                        className="flex-1 min-w-[6rem] rounded-xl bg-[#28A8E1] px-3 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98] text-center"
                      >
                        {courseCtaLabel(pct)}
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSave(course.id, saved);
                        }}
                        className={`flex-1 min-w-[6rem] rounded-xl border ${saved ? 'border-[#28A8E1] bg-sky-50 text-[#28A8E1]' : 'border-gray-200 bg-white text-gray-800'} px-3 py-2.5 text-sm font-semibold transition-all duration-200 hover:shadow-sm active:scale-[0.98] cursor-pointer`}
                      >
                        {saved ? 'Unsave' : 'Save'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function LmsCoursesPage() {
  return (
    <Suspense fallback={<LmsCoursesPageFallback />}>
      <LmsCoursesPageContent />
    </Suspense>
  );
}
