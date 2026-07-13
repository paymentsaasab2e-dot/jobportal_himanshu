'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';

import type { DashboardData } from '@/components/dashboard/dashboard-types';
import { STALE_TIMES } from '@/lib/query/query-client';
import { fetchPortalCvDashboard } from '@/lib/query/portal-api';
import { portalQueryKeys } from '@/lib/query/portal-query-keys';

export function useCvDashboard(candidateId: string | null | undefined) {
  const id = String(candidateId || '').trim();
  return useQuery({
    queryKey: portalQueryKeys.cvDashboard(id),
    queryFn: ({ signal }) => fetchPortalCvDashboard(id, signal),
    enabled: Boolean(id),
    staleTime: STALE_TIMES.dashboard,
    placeholderData: (previous) => previous,
  });
}

export function useCvDashboardProfile(candidateId: string | null | undefined) {
  const query = useCvDashboard(candidateId);
  const profile = (query.data as DashboardData | null | undefined)?.profile;
  return {
    ...query,
    profile,
  };
}

export function useInvalidateCvDashboard() {
  const queryClient = useQueryClient();
  return (candidateId?: string) => {
    if (candidateId) {
      void queryClient.invalidateQueries({
        queryKey: portalQueryKeys.cvDashboard(candidateId),
      });
      return;
    }
    void queryClient.invalidateQueries({ queryKey: portalQueryKeys.all });
  };
}
