/**
 * Safe employer landing metrics for the public /en/employers page.
 * Tries live Phase 2 aggregates first, then falls back to demo series.
 * Never exposes PII — only aggregate counts.
 */

export type LandingMetricsMode = 'demo' | 'live' | 'loading';

export type DashboardKpi = {
  value: number;
  delta: number;
  footnote: string;
};

export type ApplicationVolumeRow = {
  date: string;
  conversations: number;
};

export type HireSourceRow = {
  channel: 'portal' | 'referral' | 'linkedin';
  share: number;
};

export type CandidateIntakeRow = {
  day: string;
  date?: string;
  portal: number;
  referral: number;
  linkedin: number;
};

export type TimeToShortlistRow = {
  day: string;
  minutes: number;
};

export type EmployerLandingDashboard = {
  kpis: {
    openLeads: DashboardKpi;
    activeJobs: DashboardKpi;
    aiMatchesToday: DashboardKpi;
    placements30d: DashboardKpi;
  };
  applicationVolume: ApplicationVolumeRow[];
  hireSources: HireSourceRow[];
  hireSourcesDelta: number;
  candidateIntake: CandidateIntakeRow[];
  timeToShortlist: TimeToShortlistRow[];
};

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
  dashboard: EmployerLandingDashboard;
  /** Product-demo activity labels (never real people). */
  activityFeed: Array<{ time: string; text: string }>;
};

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function isoUtcDate(d: Date) {
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

function addUtcDays(d: Date, n: number) {
  const next = new Date(d);
  next.setUTCDate(next.getUTCDate() + n);
  return next;
}

function startOfUtcDay(d = new Date()) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function monthDayLabel(iso: string) {
  const d = new Date(`${iso}T00:00:00.000Z`);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

/** Rolling demo series ending today — never frozen on a past May date. */
export function buildDemoDashboard(now = new Date()): EmployerLandingDashboard {
  const today = startOfUtcDay(now);
  const applicationVolume: ApplicationVolumeRow[] = [];
  for (let i = 59; i >= 0; i -= 1) {
    const date = isoUtcDate(addUtcDays(today, -i));
    const wave = 96 + Math.round(18 * Math.sin(i / 6) + (i % 5) - 4);
    applicationVolume.push({ date, conversations: Math.max(42, wave) });
  }

  const candidateIntake: CandidateIntakeRow[] = [];
  for (let i = 9; i >= 0; i -= 1) {
    const date = isoUtcDate(addUtcDays(today, -i));
    candidateIntake.push({
      day: monthDayLabel(date),
      date,
      portal: 11 + ((9 - i) % 5),
      referral: 7 + ((i * 2) % 5),
      linkedin: 4 + (i % 3),
    });
  }

  return {
    kpis: {
      openLeads: { value: 42, delta: 8.2, footnote: 'vs yesterday' },
      activeJobs: { value: 16, delta: 3.1, footnote: 'vs last week' },
      aiMatchesToday: { value: 128, delta: 12.4, footnote: 'vs yesterday' },
      placements30d: { value: 9, delta: 4.6, footnote: 'vs prior 30d' },
    },
    applicationVolume,
    hireSources: [
      { channel: 'portal', share: 44 },
      { channel: 'referral', share: 36 },
      { channel: 'linkedin', share: 20 },
    ],
    hireSourcesDelta: 2.4,
    candidateIntake,
    timeToShortlist: [
      { day: 'Mon', minutes: 5.4 },
      { day: 'Tue', minutes: 4.9 },
      { day: 'Wed', minutes: 5.2 },
      { day: 'Thu', minutes: 4.7 },
      { day: 'Fri', minutes: 4.5 },
      { day: 'Sat', minutes: 5.0 },
      { day: 'Sun', minutes: 4.1 },
    ],
  };
}

/** Zeroed placeholder — used while live aggregates load (never show inflated demo counts). */
export function buildEmptyLandingMetrics(): EmployerLandingMetrics {
  const dashboard = buildDemoDashboard();
  dashboard.kpis.openLeads.value = 0;
  dashboard.kpis.activeJobs.value = 0;
  dashboard.kpis.aiMatchesToday.value = 0;
  dashboard.kpis.placements30d.value = 0;
  dashboard.kpis.openLeads.delta = 0;
  dashboard.kpis.activeJobs.delta = 0;
  dashboard.kpis.aiMatchesToday.delta = 0;
  dashboard.kpis.placements30d.delta = 0;
  dashboard.applicationVolume = dashboard.applicationVolume.map((row) => ({
    ...row,
    conversations: 0,
  }));
  dashboard.candidateIntake = dashboard.candidateIntake.map((row) => ({
    ...row,
    portal: 0,
    referral: 0,
    linkedin: 0,
  }));
  dashboard.hireSources = dashboard.hireSources.map((row) => ({ ...row, share: 0 }));
  dashboard.timeToShortlist = dashboard.timeToShortlist.map((row) => ({ ...row, minutes: 0 }));

  return {
    mode: 'loading',
    capturedAt: new Date().toISOString(),
    tenantCount: 0,
    metrics: {
      activeJobs: 0,
      totalJobs: 0,
      totalCandidates: 0,
      totalClients: 0,
      activeLeads: 0,
      totalInterviews: 0,
      interviewsScheduled: 0,
      totalPlacements: 0,
      openTasks: 0,
      aiMatches: 0,
      applications: 0,
      activeRecruiters: 0,
    },
    funnel: {
      leads: 0,
      clients: 0,
      jobs: 0,
      candidates: 0,
      interviews: 0,
      placements: 0,
    },
    leadStages: {
      NEW: 0,
      CONTACTED: 0,
      QUALIFIED: 0,
      MEETING: 0,
      PROPOSAL: 0,
      CLIENT: 0,
    },
    dashboard,
    activityFeed: [],
  };
}

export function buildLiveActivityFeed(
  metrics: EmployerLandingMetrics['metrics'],
): EmployerLandingMetrics['activityFeed'] {
  const items: EmployerLandingMetrics['activityFeed'] = [];
  if (metrics.aiMatches > 0) {
    items.push({
      time: 'Live',
      text: `${formatCompact(metrics.aiMatches)} AI matches generated across open roles`,
    });
  }
  if (metrics.interviewsScheduled > 0) {
    items.push({
      time: 'Live',
      text: `${formatCompact(metrics.interviewsScheduled)} interviews scheduled on the platform`,
    });
  }
  if (metrics.applications > 0) {
    items.push({
      time: 'Live',
      text: `${formatCompact(metrics.applications)} candidate applications received`,
    });
  }
  if (metrics.activeJobs > 0) {
    items.push({
      time: 'Live',
      text: `${formatCompact(metrics.activeJobs)} jobs currently open for applications`,
    });
  }
  if (metrics.totalPlacements > 0) {
    items.push({
      time: 'Live',
      text: `${formatCompact(metrics.totalPlacements)} placements tracked in employer workspaces`,
    });
  }
  if (metrics.totalClients > 0) {
    items.push({
      time: 'Live',
      text: `${formatCompact(metrics.totalClients)} client accounts active on the platform`,
    });
  }
  if (!items.length) {
    items.push({
      time: 'Live',
      text: 'Platform aggregates are connected — activity will appear as tenants add leads, jobs, and candidates.',
    });
  }
  return items.slice(0, 6);
}

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
  dashboard: buildDemoDashboard(),
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

function preferredMode(): 'demo' | 'live' {
  const raw = String(process.env.LANDING_METRICS_MODE || 'live').toLowerCase();
  return raw === 'demo' ? 'demo' : 'live';
}

function withActivity(
  partial: Omit<EmployerLandingMetrics, 'activityFeed' | 'dashboard'> & {
    dashboard?: EmployerLandingDashboard;
  },
): EmployerLandingMetrics {
  const dashboard =
    partial.mode === 'live'
      ? partial.dashboard || buildEmptyLandingMetrics().dashboard
      : partial.dashboard || buildDemoDashboard();
  const activityFeed =
    partial.mode === 'live'
      ? buildLiveActivityFeed(partial.metrics)
      : DEMO_LANDING_METRICS.activityFeed;

  return {
    ...partial,
    dashboard,
    activityFeed,
  };
}

export async function getEmployerLandingMetrics(): Promise<EmployerLandingMetrics> {
  if (preferredMode() === 'demo') {
    return {
      ...DEMO_LANDING_METRICS,
      capturedAt: new Date().toISOString(),
      dashboard: buildDemoDashboard(),
    };
  }

  for (const base of getPhase2Bases()) {
    try {
      const res = await fetch(`${base}/public/landing-metrics`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(12000),
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
          dashboard?: EmployerLandingDashboard;
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
        dashboard: data.dashboard,
      });
    } catch {
      /* try next base */
    }
  }

  return {
    ...DEMO_LANDING_METRICS,
    capturedAt: new Date().toISOString(),
    dashboard: buildDemoDashboard(),
  };
}

export function formatCompact(n: number): string {
  if (!Number.isFinite(n)) return '0';
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M+`;
  if (n >= 10_000) return `${Math.round(n / 1000)}K+`;
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}K+`;
  return String(Math.round(n));
}
