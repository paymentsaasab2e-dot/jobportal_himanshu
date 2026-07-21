import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';

import type { AppLocale } from '@/lib/i18n';
import {
  fetchPortalApplications,
  fetchPortalCvDashboard,
  fetchPortalJobsList,
  fetchPortalPersonalizedJobs,
} from '@/lib/query/portal-api';
import { portalQueryKeys } from '@/lib/query/portal-query-keys';
import { STALE_TIMES, getQueryClient } from '@/lib/query/query-client';

const warmedRoutes = new Set<string>();

/** Warm API caches for a candidate session (safe to call repeatedly). */
export function warmPortalSessionCaches(candidateId: string) {
  const id = String(candidateId || '').trim();
  if (!id) return;

  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: portalQueryKeys.cvDashboard(id),
    queryFn: ({ signal }) => fetchPortalCvDashboard(id, signal),
    staleTime: STALE_TIMES.dashboard,
  });
  void queryClient.prefetchQuery({
    queryKey: portalQueryKeys.applications(id),
    queryFn: ({ signal }) => fetchPortalApplications(id, signal),
    staleTime: STALE_TIMES.list,
  });
}

/** Prefetch Next.js route bundle + warm route-specific React Query cache. */
export function prefetchPortalRoute(
  router: AppRouterInstance,
  path: string,
  candidateId?: string | null,
  locale: AppLocale = 'en',
) {
  const normalizedPath = path.split('?')[0] || '/';
  const warmKey = `${normalizedPath}::${candidateId || ''}::${locale}`;
  if (!warmedRoutes.has(warmKey)) {
    warmedRoutes.add(warmKey);
  }

  void router.prefetch(path);

  const id = String(candidateId || '').trim();
  if (!id) return;

  const queryClient = getQueryClient();

  if (normalizedPath === '/applications' || normalizedPath.endsWith('/applications')) {
    void queryClient.prefetchQuery({
      queryKey: portalQueryKeys.applications(id),
      queryFn: ({ signal }) => fetchPortalApplications(id, signal),
      staleTime: STALE_TIMES.list,
    });
    return;
  }

  if (
    normalizedPath === '/candidate-dashboard' ||
    normalizedPath.endsWith('/candidate-dashboard') ||
    normalizedPath === '/candidate-home' ||
    normalizedPath.endsWith('/candidate-home')
  ) {
    void queryClient.prefetchQuery({
      queryKey: portalQueryKeys.cvDashboard(id),
      queryFn: ({ signal }) => fetchPortalCvDashboard(id, signal),
      staleTime: STALE_TIMES.dashboard,
    });
    void queryClient.prefetchQuery({
      queryKey: portalQueryKeys.jobsList(locale, 200),
      queryFn: ({ signal }) => fetchPortalJobsList(locale, 200, signal),
      staleTime: STALE_TIMES.jobs,
    });
    void queryClient.prefetchQuery({
      queryKey: portalQueryKeys.personalizedJobs(id, locale),
      queryFn: ({ signal }) => fetchPortalPersonalizedJobs(id, locale, signal),
      staleTime: STALE_TIMES.jobs,
    });
    return;
  }

  if (normalizedPath === '/explore-jobs' || normalizedPath.endsWith('/explore-jobs')) {
    void queryClient.prefetchQuery({
      queryKey: portalQueryKeys.jobsList(locale, 200),
      queryFn: ({ signal }) => fetchPortalJobsList(locale, 200, signal),
      staleTime: STALE_TIMES.jobs,
    });
  }
}
