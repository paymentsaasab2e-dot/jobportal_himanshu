import { fetchFromApi, getApiBaseUrl } from './api-base';

export type PortalCourseRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  level: string;
  skillLevel: string;
  thumbnailUrl: string | null;
  instructorName: string | null;
  totalLessons: number;
  estimatedHours: number;
  duration: string;
  price: string;
  tags: string[];
  accessTier: string;
  tokenCost: number;
  isCertified: boolean;
  isFree: boolean;
  createdAt?: string;
  updatedAt?: string;
};

async function parseJson<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (payload as { message?: string; error?: string })?.message ||
        (payload as { error?: string })?.error ||
        `Request failed (${res.status})`,
    );
  }
  return payload as T;
}

export async function fetchPublicCourses(filters?: {
  search?: string;
  level?: string;
  category?: string;
}): Promise<PortalCourseRow[]> {
  const params = new URLSearchParams();
  if (filters?.search?.trim()) params.set('search', filters.search.trim());
  if (filters?.level?.trim() && filters.level !== 'all') params.set('level', filters.level.trim());
  if (filters?.category?.trim() && filters.category !== 'all') {
    params.set('category', filters.category.trim());
  }
  const qs = params.toString();
  const res = await fetchFromApi(`/courses/public${qs ? `?${qs}` : ''}`);
  const payload = await parseJson<{ success: boolean; data: { courses: PortalCourseRow[] } }>(res);
  return Array.isArray(payload.data?.courses) ? payload.data.courses : [];
}

export async function fetchPublicCourseById(courseId: string): Promise<PortalCourseRow | null> {
  const res = await fetch(
    `${getApiBaseUrl().replace(/\/$/, '')}/courses/public/${encodeURIComponent(courseId)}`,
    { cache: 'no-store' },
  );
  if (res.status === 404) return null;
  const payload = await parseJson<{ success: boolean; data: { course: PortalCourseRow } }>(res);
  return payload.data?.course ?? null;
}
