'use client';

import { useEffect, useState } from 'react';
import {
  DEMO_LANDING_METRICS,
  type EmployerLandingMetrics,
} from '@/lib/employers/landingMetrics';

export function useLandingMetrics() {
  const [data, setData] = useState<EmployerLandingMetrics>(DEMO_LANDING_METRICS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/employers/landing-metrics', { cache: 'no-store' });
        const json = await res.json();
        if (!cancelled && json?.data?.metrics) {
          setData(json.data as EmployerLandingMetrics);
        }
      } catch {
        /* keep demo */
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
