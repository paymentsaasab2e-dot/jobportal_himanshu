'use client';

import { useEffect, useState } from 'react';
import {
  DEMO_LANDING_METRICS,
  buildDemoDashboard,
  buildEmptyLandingMetrics,
  type EmployerLandingMetrics,
} from '@/lib/employers/landingMetrics';

function mergeLandingMetrics(incoming: EmployerLandingMetrics): EmployerLandingMetrics {
  if (incoming.mode === 'live') {
    return {
      ...incoming,
      dashboard: incoming.dashboard || buildEmptyLandingMetrics().dashboard,
    };
  }
  return {
    ...incoming,
    dashboard: incoming.dashboard || buildDemoDashboard(),
  };
}

export function useLandingMetrics() {
  const [data, setData] = useState<EmployerLandingMetrics>(() => buildEmptyLandingMetrics());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/employers/landing-metrics', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json?.data?.metrics) {
          setData(mergeLandingMetrics(json.data as EmployerLandingMetrics));
        } else if (!cancelled) {
          setData({
            ...DEMO_LANDING_METRICS,
            capturedAt: new Date().toISOString(),
            dashboard: buildDemoDashboard(),
          });
        }
      } catch {
        if (!cancelled) {
          setData({
            ...DEMO_LANDING_METRICS,
            capturedAt: new Date().toISOString(),
            dashboard: buildDemoDashboard(),
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading };
}
