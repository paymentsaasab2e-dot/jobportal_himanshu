'use client';

import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { flattenCourseLessons } from '../../../course-utils';
import { LmsEmptyState } from '../../../../components/states/LmsEmptyState';
import { LessonPlayerClient } from './player-client';
import { LmsSkeleton } from '../../../../components/states/LmsSkeleton';
import { fetchCourseDetail } from '../../../../api/client';
import { lmsCourseMeta } from '../../../../data/ai-mock';

export default function CourseLessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; lessonId: string }>;
  searchParams?: Promise<{ mode?: string }>;
}) {
  const { id, lessonId } = use(params);
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
        <Link href="/lms/courses" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to courses
        </Link>
        <LmsEmptyState
          title="Course not found"
          body={`No course found for id “${id}”.`}
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

  // Transform backend lessons into frontend modules structure
  const modules = [
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

  const flat = flattenCourseLessons(modules);
  const idx = flat.findIndex((l) => l.lessonId === lessonId);
  
  if (idx < 0) {
    return (
      <div className="space-y-8">
        <Link href={`/lms/courses/${id}`} className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700 hover:underline">
          <ArrowLeft className="h-4 w-4" strokeWidth={2} />
          Back to course
        </Link>
        <LmsEmptyState
          title="Lesson not found"
          body={`No lesson “${lessonId}” exists for this course.`}
          action={
            <Link
              href={`/lms/courses/${id}`}
              className="inline-flex items-center justify-center rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:opacity-95 hover:shadow-md active:scale-[0.98]"
            >
              Open course overview
            </Link>
          }
        />
      </div>
    );
  }

  // Build lesson details map from backend contentHtml and videoUrl
  const lessonDetails: Record<
    string,
    {
      type: 'video' | 'reading' | 'exercise' | 'mock';
      intro: string;
      keyTakeaways: string[];
      practiceTask: string;
      resources: string[];
      videoUrl?: string | null;
    }
  > = {};
  course.lessons?.forEach((l: any) => {
    const type = (['video', 'reading', 'exercise', 'mock'].includes(l.type) ? l.type : 'video') as
      | 'video'
      | 'reading'
      | 'exercise'
      | 'mock';
    lessonDetails[l.id] = {
      type,
      intro: String(l.contentHtml || l.description || 'No detailed content provided yet.'),
      keyTakeaways: ['Watch the lesson carefully', 'Capture the key idea', 'Connect it to interviews'],
      practiceTask: 'Write a short summary and one concrete takeaway from this lesson.',
      resources: l.videoUrl ? [l.videoUrl] : [],
      videoUrl: l.videoUrl || null,
    };
  });

  return (
    <LessonPlayerClient
      course={{
        id: course.id,
        title: course.title,
        description: course.description,
        iconKey: 'bookOpen', // default fallback
        progress: course.progressPercent ?? 0,
        duration: course.estimatedHours ? `${course.estimatedHours}h` : '1h',
        level: course.level,
        aiContext: ''
      }}
      courseMeta={lmsCourseMeta[id] || {}}
      modules={modules}
      flatLessons={flat}
      initialIndex={idx}
      mode={mode}
      lessonDetails={lessonDetails}
    />
  );
}
