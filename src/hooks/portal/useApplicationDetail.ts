'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE_TIMES } from '@/lib/query/query-client';
import { fetchPortalApplicationDetail } from '@/lib/query/portal-api';
import { portalQueryKeys } from '@/lib/query/portal-query-keys';

export function useApplicationDetail(applicationId: string | null | undefined) {
  const id = String(applicationId || '').trim();
  return useQuery({
    queryKey: portalQueryKeys.applicationDetail(id),
    queryFn: ({ signal }) => fetchPortalApplicationDetail(id, signal),
    enabled: Boolean(id),
    staleTime: STALE_TIMES.detail,
    placeholderData: (previous) => previous,
  });
}

export function useInvalidateApplicationDetail() {
  const queryClient = useQueryClient();
  return (applicationId?: string) => {
    if (applicationId) {
      void queryClient.invalidateQueries({
        queryKey: portalQueryKeys.applicationDetail(applicationId),
      });
    }
  };
}
