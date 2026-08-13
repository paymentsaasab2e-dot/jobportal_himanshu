/**
 * Safe employer landing metrics for the public /en/employers page.
 * Mode: demo | platform (env LANDING_METRICS_MODE).
 * Never exposes PII — only aggregate counts.
 */

export type LandingMetricsMode = 'demo' | 'live';

export type EmployerLandingMetrics = {
  mode: LandingMetricsMode;
  capturedAt: string;
  tenantCount: number;
  metrics: {
    activeJobs: number;
    totalJobs: number;
    totalCandidates: number;
    totalClients: number;
    activeLeads: number;
    totalInterviews: number;
    interviewsScheduled: number;
    totalPlacements: number;
    openTasks: number;
    aiMatches: number;
    applications: number;
    activeRecruiters: number;
  };
  funnel: {
    leads: number;
    clients: number;
    jobs: number;
    candidates: number;
    interviews: number;
    placements: number;
  };
  leadStages: {
    NEW: number;
    CONTACTED: number;
    QUALIFIED: number;
    MEETING: number;
    PROPOSAL: number;
    CLIENT: number;
  };
  /** Product-demo activity labels (never real people). */
  activityFeed: Array<{ time: string; text: string }>;
};

export const DEMO_LANDING_METRICS: EmployerLandingMetrics = {
  mode: 'demo',
  capturedAt: new Date().toISOString(),
  tenantCount: 0,
  metrics: {
    activeJobs: 1248,
    totalJobs: 3820,
    totalCandidates: 48240,
    totalClients: 2840,
    activeLeads: 6120,
    totalInterviews: 12840,
    interviewsScheduled: 486,
    totalPlacements: 4920,
    openTasks: 318,
    aiMatches: 182340,
    applications: 96400,
    activeRecruiters: 640,
  },
  funnel: {
    leads: 6120,
    clients: 2840,
    jobs: 1248,
    candidates: 48240,
    interviews: 486,
    placements: 4920,
  },
  leadStages: {
    NEW: 128,
    CONTACTED: 86,
    QUALIFIED: 42,
    MEETING: 18,
    PROPOSAL: 14,
    CLIENT: 9,
  },
  activityFeed: [
    { time: '17:42', text: 'AI matched 18 candidates to an open role' },
    { time: '17:38', text: 'Interview scheduled for a shortlisted profile' },
    { time: '17:31', text: 'New client account created from a converted lead' },
    { time: '17:24', text: 'Job published with public apply link' },
    { time: '17:18', text: 'Candidate moved to final interview round' },
    { time: '17:05', text: 'Placement marked joined — invoice drafted' },
  ],
};

function getPhase2Bases(): string[] {
  const fromEnv = process.env.NEXT_PUBLIC_PHASE2_API_URL?.replace(/\/$/, '');
  const urls = ['http://localhost:5001/api/v1', 'http://127.0.0.1:5001/api/v1'];
  if (fromEnv && !urls.includes(fromEnv)) urls.unshift(fromEnv);
  return urls;
}

function preferredMode(): 'demo' | 'platform' {
  const raw = String(process.env.LANDING_METRICS_MODE || 'demo').toLowerCase();
  return raw === 'platform' || raw === 'live' ? 'platform' : 'demo';
}

function withActivity(partial: Omit<EmployerLandingMetrics, 'activityFeed'>): EmployerLandingMetrics {
  return {
    ...partial,
    activityFeed: DEMO_LANDING_METRICS.activityFeed,
  };
}

export async function getEmployerLandingMetrics(): Promise<EmployerLandingMetrics> {
  if (preferredMode() === 'demo') {
    return { ...DEMO_LANDING_METRICS, capturedAt: new Date().toISOString() };
  }

  for (const base of getPhase2Bases()) {
    try {
      const res = await fetch(`${base}/public/landing-metrics`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(8000),
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const json = (await res.json()) as {
        data?: {
          mode?: string;
          available?: boolean;
          metrics?: EmployerLandingMetrics['metrics'];
          funnel?: EmployerLandingMetrics['funnel'];
          leadStages?: EmployerLandingMetrics['leadStages'];
          tenantCount?: number;
          capturedAt?: string;
        };
      };
      const data = json?.data;
      if (!data || data.mode === 'demo' || data.available === false || !data.metrics) {
        continue;
      }
      return withActivity({
        mode: 'live',
        capturedAt: data.capturedAt || new Date().toISOString(),
        tenantCount: data.tenantCount || 0,
        metrics: data.metrics,
        funnel: data.funnel || DEMO_LANDING_METRICS.funnel,
        leadStages: data.leadStages || DEMO_LANDING_METRICS.leadStages,
      });
    } catch {
      /* try next base */
    }
  }

  return { ...DEMO_LANDING_METRICS, capturedAt: new Date().toISOString() };
}

export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return String(Math.round(n));
}
