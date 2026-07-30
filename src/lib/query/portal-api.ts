import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';
import { withJobApiLocale } from '@/lib/jobApiLocale';
import type { AppLocale } from '@/lib/i18n';
import type { DashboardData } from '@/components/dashboard/dashboard-types';

async function parseJson<T>(response: Response): Promise<T> {
  return response.json().catch(() => ({} as T));
}

export async function fetchPortalApplications(
  candidateId: string,
  signal?: AbortSignal,
): Promise<unknown[]> {
  const response = await fetch(`${getApiBaseUrl()}/applications/${candidateId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    signal,
  });
  const payload = await parseJson<{ success?: boolean; data?: unknown[]; message?: string }>(
    response,
  );
  if (!response.ok) {
    throw new Error(payload.message || `Failed to load applications (${response.status})`);
  }
  if (!payload.success || !Array.isArray(payload.data)) {
    return [];
  }
  return payload.data;
}

export async function fetchPortalCvDashboard(
  candidateId: string,
  signal?: AbortSignal,
): Promise<DashboardData | null> {
  const response = await fetch(`${getApiBaseUrl()}/cv/dashboard/${candidateId}`, {
    method: 'GET',
    headers: getAuthHeaders(),
    signal,
  });
  const payload = await parseJson<{ success?: boolean; data?: DashboardData }>(response);
  if (!response.ok || !payload.success || !payload.data) {
    return null;
  }
  return payload.data;
}

export async function fetchPortalApplicationDetail(
  applicationId: string,
  signal?: AbortSignal,
): Promise<Record<string, unknown>> {
  const response = await fetch(
    `${getApiBaseUrl()}/applications/detail/${encodeURIComponent(applicationId)}`,
    { signal },
  );
  const payload = await parseJson<{ success?: boolean; data?: Record<string, unknown>; message?: string }>(
    response,
  );
  if (!response.ok || !payload.success || !payload.data) {
    throw new Error(payload.message || 'Failed to load application details');
  }
  return payload.data;
}

export async function fetchPortalJobsList(
  locale: AppLocale,
  limit = 200,
  signal?: AbortSignal,
): Promise<unknown[]> {
  const page = await fetchPortalJobsPage(locale, { page: 1, limit, signal });
  return page.jobs;
}

export type PortalJobsPageResult = {
  jobs: unknown[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export async function fetchPortalJobsPage(
  locale: AppLocale,
  opts: { page?: number; limit?: number; signal?: AbortSignal } = {},
): Promise<PortalJobsPageResult> {
  const page = Math.max(1, opts.page ?? 1);
  const limit = Math.max(1, Math.min(100, opts.limit ?? 10));
  const response = await fetch(
    withJobApiLocale(
      `${getApiBaseUrl()}/jobs?page=${page}&limit=${limit}`,
      locale,
    ),
    { method: 'GET', signal: opts.signal },
  );
  const payload = await parseJson<{
    success?: boolean;
    data?: {
      jobs?: unknown[];
      pagination?: { page?: number; limit?: number; total?: number; totalPages?: number };
    };
  }>(response);

  const jobs = Array.isArray(payload.data?.jobs) ? payload.data!.jobs! : [];
  const pagination = payload.data?.pagination || {};
  const total = typeof pagination.total === 'number' ? pagination.total : jobs.length;
  const totalPages =
    typeof pagination.totalPages === 'number'
      ? pagination.totalPages
      : Math.max(1, Math.ceil(total / limit));

  if (!response.ok || payload.success === false) {
    return { jobs: [], page, limit, total: 0, totalPages: 0 };
  }

  return {
    jobs,
    page: typeof pagination.page === 'number' ? pagination.page : page,
    limit: typeof pagination.limit === 'number' ? pagination.limit : limit,
    total,
    totalPages,
  };
}

export type PortalPersonalizedJobsResult = {
  jobs: unknown[];
  totalMatches: number;
  totalJobsScanned: number;
};

export async function fetchPortalPersonalizedJobs(
  candidateId: string,
  locale: AppLocale,
  signal?: AbortSignal,
): Promise<unknown[]> {
  const result = await fetchPortalPersonalizedJobsDetailed(candidateId, locale, { signal });
  return result.jobs;
}

export async function fetchPortalPersonalizedJobsDetailed(
  candidateId: string,
  locale: AppLocale,
  opts: { signal?: AbortSignal; limit?: number; skipAi?: boolean } = {},
): Promise<PortalPersonalizedJobsResult> {
  const limit = opts.limit ?? 100;
  const skipAi = opts.skipAi !== false;
  const response = await fetch(
    withJobApiLocale(
      `${getApiBaseUrl()}/jobs/personalized?candidateId=${encodeURIComponent(candidateId)}&skipAi=${skipAi ? '1' : '0'}&limit=${limit}`,
      locale,
    ),
    { method: 'GET', signal: opts.signal },
  );
  const payload = await parseJson<{
    success?: boolean;
    data?: unknown;
    totalMatches?: number;
    totalJobsScanned?: number;
  }>(response);
  if (!response.ok || payload.success === false) {
    return { jobs: [], totalMatches: 0, totalJobsScanned: 0 };
  }
  let jobs: unknown[] = [];
  if (Array.isArray(payload.data)) jobs = payload.data;
  else if (Array.isArray((payload.data as { jobs?: unknown[] } | undefined)?.jobs)) {
    jobs = (payload.data as { jobs: unknown[] }).jobs;
  }
  return {
    jobs,
    totalMatches:
      typeof payload.totalMatches === 'number' ? payload.totalMatches : jobs.length,
    totalJobsScanned:
      typeof payload.totalJobsScanned === 'number' ? payload.totalJobsScanned : 0,
  };
}
