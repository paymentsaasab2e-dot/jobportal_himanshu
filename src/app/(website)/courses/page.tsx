'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, BookOpen } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useAuth } from '@/components/auth/AuthContext';
import { AppLocale, localizePath } from '@/lib/i18n';
import { fetchPublicCourses, type PortalCourseRow } from '@/lib/public-courses-api';

type CourseCard = PortalCourseRow & {
  aiRecommended: boolean;
};

function AuthInterceptModal({
  isOpen,
  onClose,
  title,
  description,
  redirectUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  redirectUrl: string;
}) {
  const router = useRouter();
  const locale = useLocale() as AppLocale;

  if (!isOpen) return null;

  const handleContinue = () => {
    sessionStorage.setItem('postLoginRedirect', redirectUrl);
    router.push(localizePath('/whatsapp', locale));
  };

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="w-full max-w-md rounded-[28px] bg-white p-8 shadow-2xl ring-1 ring-slate-900/5"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="courses-auth-modal-title"
      >
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-sky-50">
          <BookOpen className="h-7 w-7 text-[#28A8DF]" />
        </div>
        <h2
          id="courses-auth-modal-title"
          className="mb-3 text-center text-2xl font-bold tracking-tight text-slate-900"
        >
          {title}
        </h2>
        <p className="mb-8 text-center text-[15px] font-medium leading-relaxed text-slate-500">
          {description}
        </p>
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleContinue}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#28A8DF] px-4 py-3.5 text-[15px] font-semibold text-white transition-all hover:bg-[#1f97cb]"
          >
            Continue with WhatsApp Login
            <ArrowRight className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl border border-slate-200 px-4 py-3.5 text-[15px] font-semibold text-slate-600 transition-all hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function CourseThumb({ src, title }: { src: string | null; title: string }) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-sky-100 to-orange-50">
        <BookOpen className="h-8 w-8 text-[#28A8DF]" />
      </div>
    );
  }
  return <img src={src} alt={title} className="h-full w-full object-cover" />;
}

export default function CoursesPage() {
  const router = useRouter();
  const locale = useLocale() as AppLocale;
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [courses, setCourses] = useState<CourseCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authRedirectUrl, setAuthRedirectUrl] = useState('/lms/courses');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setLoadError('');
      try {
        const rows = await fetchPublicCourses();
        if (cancelled) return;
        setCourses(
          rows.map((row) => ({
            ...row,
            aiRecommended: true,
          })),
        );
      } catch (err) {
        if (cancelled) return;
        console.error('[courses] failed to load HQ courses', err);
        setCourses([]);
        setLoadError('Could not load courses. Please try again.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedCourses = useMemo(
    () =>
      [...courses].sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime(),
      ),
    [courses],
  );

  const openCourseDetails = (courseId: string) => {
    const lmsPath = localizePath(`/lms/courses/${courseId}`, locale);
    if (isAuthLoading) return;
    if (!isAuthenticated) {
      setAuthRedirectUrl(lmsPath);
      setIsAuthModalOpen(true);
      return;
    }
    router.push(lmsPath);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(135deg,#fde9d4,#fafbfb,#bddffb)]">
      <main className="mx-auto max-w-[1180px] px-4 pb-8 pt-24 sm:px-5 lg:px-6">
        <div className="mb-8">
          <h1 className="mb-2.5 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Recommended Courses for You
          </h1>
          <p className="max-w-3xl text-base leading-relaxed text-gray-500">
            Live courses published by HQ. Browse without logging in - sign in when you are ready to
            open a course and start learning.
          </p>
        </div>

        {loading ? (
          <div className="mx-auto mb-8 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[280px] animate-pulse rounded-xl bg-white/80 shadow-sm" />
            ))}
          </div>
        ) : loadError ? (
          <div className="mb-8 py-16 text-center">
            <p className="text-lg font-medium text-red-600">{loadError}</p>
          </div>
        ) : sortedCourses.length > 0 ? (
          <div className="mx-auto mb-8 grid max-w-6xl grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sortedCourses.map((course) => (
              <div
                key={course.id}
                className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-[#28A8DF] hover:shadow-md"
              >
                <div className="h-28 w-full flex-shrink-0 overflow-hidden bg-gray-200">
                  <CourseThumb src={course.thumbnailUrl} title={course.title} />
                </div>

                <div className="flex flex-1 flex-col px-3.5 pb-3.5 pt-3">
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-medium text-gray-500">
                      {course.category || 'Course'}
                    </span>
                    {course.aiRecommended ? (
                      <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-[#28A8DF]">
                        AI
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mb-1.5 line-clamp-2 text-sm font-semibold leading-snug text-gray-900">
                    {course.title}
                  </h3>

                  <div className="mb-1.5 flex items-center gap-2 text-[11px]">
                    <span className="truncate text-gray-500">{course.duration || 'Self-paced'}</span>
                    <span className="font-semibold text-gray-900">{course.price}</span>
                  </div>

                  <div className="mb-2 flex flex-wrap items-center gap-1">
                    {course.skillLevel ? (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                        {course.skillLevel}
                      </span>
                    ) : null}
                    {course.isCertified ? (
                      <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-medium text-violet-700">
                        Certificate
                      </span>
                    ) : null}
                  </div>

                  <p className="mb-3 line-clamp-2 text-xs leading-relaxed text-gray-500">
                    {course.description}
                  </p>

                  <button
                    type="button"
                    onClick={() => openCourseDetails(course.id)}
                    className="mt-auto w-full rounded-lg bg-[#FC9620] px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-[#EA580C]"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-8 flex w-full items-center justify-center py-20">
            <p className="text-lg font-medium text-gray-500">No published courses from HQ yet.</p>
          </div>
        )}
      </main>

      <AuthInterceptModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        title="Login required"
        description="Sign in with WhatsApp to open this HQ course and start learning in LMS."
        redirectUrl={authRedirectUrl}
      />
    </div>
  );
}
