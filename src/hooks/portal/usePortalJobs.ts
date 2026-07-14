'use client';

import { useQuery } from '@tanstack/react-query';

import type { AppLocale } from '@/lib/i18n';
import { STALE_TIMES } from '@/lib/query/query-client';
import {
  fetchPortalJobsList,
  fetchPortalPersonalizedJobs,
} from '@/lib/query/portal-api';
import { portalQueryKeys } from '@/lib/query/portal-query-keys';

export function usePortalJobsList(locale: AppLocale, limit = 200) {
  return useQuery({
    queryKey: portalQueryKeys.jobsList(locale, limit),
    queryFn: ({ signal }) => fetchPortalJobsList(locale, limit, signal),
    staleTime: STALE_TIMES.jobs,
    placeholderData: (previous) => previous,
  });
}

export function usePortalPersonalizedJobs(
  candidateId: string | null | undefined,
  locale: AppLocale,
) {
  const id = String(candidateId || '').trim();
  return useQuery({
    queryKey: portalQueryKeys.personalizedJobs(id, locale),
    queryFn: ({ signal }) => fetchPortalPersonalizedJobs(id, locale, signal),
    enabled: Boolean(id),
    staleTime: STALE_TIMES.jobs,
    placeholderData: (previous) => previous,
  });
}
