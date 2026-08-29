'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import { STALE_TIMES } from '@/lib/query/query-client';
import { fetchPortalApplications } from '@/lib/query/portal-api';
import { portalQueryKeys } from '@/lib/query/portal-query-keys';

export function usePortalApplications(candidateId: string | null | undefined) {
  const id = String(candidateId || '').trim();
  return useQuery({
    queryKey: portalQueryKeys.applications(id),
    queryFn: ({ signal }) => fetchPortalApplications(id, signal),
    enabled: Boolean(id),
    staleTime: STALE_TIMES.list,
    refetchOnMount: true,
    placeholderData: (previous) => previous,
  });
}

export function useInvalidatePortalApplications() {
  const queryClient = useQueryClient();
  return (candidateId?: string) => {
    if (candidateId) {
      void queryClient.invalidateQueries({
        queryKey: portalQueryKeys.applications(candidateId),
      });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: portalQueryKeys.all });
  };
}
