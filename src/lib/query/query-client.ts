import { QueryClient } from '@tanstack/react-query';

export const STALE_TIMES = {
  /** List pages — show cached data instantly, refresh in background. */
  list: 90_000,
  /** Dashboard summary — align with session cache (~5 min). */
  dashboard: 5 * 60_000,
  /** Detail pages — slightly longer cache for back-navigation. */
  detail: 120_000,
  /** Job catalog — changes infrequently during a session. */
  jobs: 5 * 60_000,
} as const;

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: STALE_TIMES.list,
        gcTime: 10 * 60_000,
        retry: 2,
        refetchOnWindowFocus: false,
        refetchOnReconnect: true,
        refetchOnMount: false,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }
  if (!browserQueryClient) {
    browserQueryClient = createQueryClient();
  }
  return browserQueryClient;
}
