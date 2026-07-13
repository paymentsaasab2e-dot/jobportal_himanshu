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
  const response = await fetch(
    withJobApiLocale(`${getApiBaseUrl()}/jobs?limit=${limit}`, locale),
    { method: 'GET', signal },
  );
  const payload = await parseJson<{
    success?: boolean;
    data?: { jobs?: unknown[] } | unknown[];
  }>(response);
  if (!response.ok || payload.success === false) {
    return [];
  }
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.jobs)) return payload.data.jobs;
  return [];
}

export async function fetchPortalPersonalizedJobs(
  candidateId: string,
  locale: AppLocale,
  signal?: AbortSignal,
): Promise<unknown[]> {
  const response = await fetch(
    withJobApiLocale(
      `${getApiBaseUrl()}/jobs/personalized?candidateId=${encodeURIComponent(candidateId)}&skipAi=1&limit=80`,
      locale,
    ),
    { method: 'GET', signal },
  );
  const payload = await parseJson<{ success?: boolean; data?: unknown }>(response);
  if (!response.ok || payload.success === false) {
    return [];
  }
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray((payload.data as { jobs?: unknown[] } | undefined)?.jobs)) {
    return (payload.data as { jobs: unknown[] }).jobs;
  }
  return [];
}
