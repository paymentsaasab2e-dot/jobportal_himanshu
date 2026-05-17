'use client';

import { useEffect, useRef } from 'react';

const REFRESH_DEBOUNCE_MS = 400;

/**
 * Re-run data fetches when the user returns to a backgrounded or bfcache-restored tab.
 */
export function useTabVisibilityRefresh(
  onRefresh: () => void | Promise<void>,
  enabled = true,
): void {
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const lastRunRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const runRefresh = () => {
      const now = Date.now();
      if (now - lastRunRef.current < REFRESH_DEBOUNCE_MS) return;
      lastRunRef.current = now;
      void onRefreshRef.current();
    };

    const scheduleRefresh = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(runRefresh, REFRESH_DEBOUNCE_MS);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        scheduleRefresh();
      }
    };

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        scheduleRefresh();
      }
    };

    const handleFocus = () => {
      scheduleRefresh();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleFocus);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled]);
}
