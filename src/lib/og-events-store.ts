/**
 * Office Gossips — profile-relevant events (walk-ins, seminars, webinars, jobs).
 * Local demo feed shaped like LinkedIn / Instagram posts; live jobs merge in from API.
 */

export type OgEventType = 'walk-in' | 'seminar' | 'webinar' | 'job-fair' | 'job';

export type OgEventPost = {
  id: string;
  type: OgEventType;
  title: string;
  body: string;
  hostName: string;
  hostInitial: string;
  location?: string;
  whenLabel: string;
  imageUrl: string;
  tags: string[];
  interestedCount: number;
  createdAt: string;
  /** Soft match against profile skills / role keywords */
  matchKeys: string[];
  /** Live job posting — click opens apply page */
  jobId?: string;
  actionHref?: string;
};

const DEMO_JOB_IMAGE =
  'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?auto=format&fit=crop&w=1200&q=80';

const DEMO_EVENTS: OgEventPost[] = [
  {
    id: 'ev-walkin-1',
    type: 'walk-in',
    title: 'Walk-in: Frontend Engineers (React / Next.js)',
    body: 'Same-day interviews for mid-level UI engineers. Bring your laptop and a recent project demo. Roles across product squads in Pune & remote.',
    hostName: 'TechHire Campus',
    hostInitial: 'T',
    location: 'Pune · Hinjewadi Phase 1',
    whenLabel: 'Sat · 10:00 AM – 4:00 PM',
    imageUrl:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80',
    tags: ['Walk-in', 'React', 'Frontend'],
    interestedCount: 214,
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    matchKeys: ['react', 'frontend', 'next', 'ui', 'javascript', 'typescript'],
  },
  {
    id: 'ev-webinar-1',
    type: 'webinar',
    title: 'Webinar: AI-assisted CV screening — what recruiters actually see',
    body: 'A 45-min live session with hiring managers on ATS keywords, portfolio signals, and how Employeye profiles get shortlisted.',
    hostName: 'HRYantra Academy',
    hostInitial: 'H',
    whenLabel: 'Thu · 7:00 PM IST · Online',
    imageUrl:
      'https://images.unsplash.com/photo-1591115765373-5207764f72e7?auto=format&fit=crop&w=1200&q=80',
    tags: ['Webinar', 'Career', 'AI'],
    interestedCount: 892,
    createdAt: new Date(Date.now() - 8 * 3600_000).toISOString(),
    matchKeys: ['career', 'cv', 'resume', 'ai', 'ats', 'job'],
  },
  {
    id: 'ev-seminar-1',
    type: 'seminar',
    title: 'Seminar: System design for product interviews',
    body: 'In-person deep dive: APIs, caching, and trade-offs hiring panels ask for. Includes mock whiteboard and peer feedback.',
    hostName: 'Engineers Guild',
    hostInitial: 'E',
    location: 'Bengaluru · Koramangala',
    whenLabel: 'Sun · 11:00 AM – 2:00 PM',
    imageUrl:
      'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=1200&q=80',
    tags: ['Seminar', 'System design'],
    interestedCount: 156,
    createdAt: new Date(Date.now() - 26 * 3600_000).toISOString(),
    matchKeys: ['backend', 'system', 'design', 'java', 'node', 'engineer'],
  },
  {
    id: 'ev-jobfair-1',
    type: 'job-fair',
    title: 'Campus-style job fair: Product, Design & Growth',
    body: 'Meet 18 product companies hiring PMs, designers, and growth associates. Drop your Employeye QR at every booth.',
    hostName: 'SAASA Talent Days',
    hostInitial: 'S',
    location: 'Hyderabad · HITEX',
    whenLabel: 'Fri–Sat · All day',
    imageUrl:
      'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
    tags: ['Job fair', 'Product', 'Design'],
    interestedCount: 1204,
    createdAt: new Date(Date.now() - 40 * 3600_000).toISOString(),
    matchKeys: ['product', 'design', 'ux', 'pm', 'growth', 'marketing'],
  },
  {
    id: 'ev-webinar-2',
    type: 'webinar',
    title: 'Webinar: Negotiating your first offer with confidence',
    body: 'Compensation bands, equity basics, and scripts that work without sounding pushy. Q&A with ex-FAANG recruiters.',
    hostName: 'Career Lab',
    hostInitial: 'C',
    whenLabel: 'Wed · 8:00 PM IST · Online',
    imageUrl:
      'https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80',
    tags: ['Webinar', 'Offers'],
    interestedCount: 640,
    createdAt: new Date(Date.now() - 52 * 3600_000).toISOString(),
    matchKeys: ['career', 'salary', 'offer', 'job', 'interview'],
  },
  {
    id: 'ev-walkin-2',
    type: 'walk-in',
    title: 'Walk-in: Data & analytics associates',
    body: 'SQL + Excel practical round on site. Freshers and 1–2 YOE welcome. Same-day LOI for shortlisted candidates.',
    hostName: 'InsightWorks',
    hostInitial: 'I',
    location: 'Mumbai · Andheri East',
    whenLabel: 'Mon · 9:30 AM – 1:00 PM',
    imageUrl:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    tags: ['Walk-in', 'Data', 'SQL'],
    interestedCount: 318,
    createdAt: new Date(Date.now() - 70 * 3600_000).toISOString(),
    matchKeys: ['data', 'sql', 'analytics', 'python', 'excel'],
  },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : value != null ? String(value).trim() : '';
}

/** Map live API jobs into Events feed cards (click → explore-jobs apply). */
export function mapJobsToOgEvents(jobs: unknown[], limit = 8): OgEventPost[] {
  const out: OgEventPost[] = [];
  for (const raw of jobs) {
    if (out.length >= limit) break;
    const j = asRecord(raw);
    const id = asString(j.id || j._id || j.jobId);
    if (!id) continue;
    const title = asString(j.title || j.jobTitle) || 'Open role';
    const company =
      asString(j.companyName || j.company || asRecord(j.employer).name) || 'Hiring company';
    const location =
      asString(j.location || j.city || j.jobLocation) ||
      (asString(j.workMode || j.employmentType) || undefined);
    const description =
      asString(j.shortDescription || j.description || j.summary).slice(0, 220) ||
      `Apply for ${title} at ${company} on HRYantra.`;
    const created =
      asString(j.createdAt || j.postedAt || j.updatedAt) || new Date().toISOString();
    const roleBits = `${title} ${company} ${description}`.toLowerCase();
    const employment = asString(j.employmentType);

    out.push({
      id: `job-${id}`,
      type: 'job',
      title,
      body: description,
      hostName: company,
      hostInitial: company.slice(0, 1).toUpperCase() || 'J',
      location: location || undefined,
      whenLabel: 'Open now · Apply on HRYantra',
      imageUrl: DEMO_JOB_IMAGE,
      tags: ['Job', ...(employment ? [employment] : [])].slice(0, 3),
      interestedCount: Number(j.applicantCount || j.applicationsCount || 0) || 48,
      createdAt: created,
      matchKeys: roleBits.split(/[^a-z0-9+#.]+/).filter((t) => t.length > 2).slice(0, 12),
      jobId: id,
      actionHref: `/explore-jobs?job=${encodeURIComponent(id)}`,
    });
  }
  return out;
}

export function listOgEvents(): OgEventPost[] {
  return [...DEMO_EVENTS].sort(
    (a, b) => +new Date(b.createdAt) - +new Date(a.createdAt),
  );
}

/** Rank events that match profile text. Only returns relevant matches (not the full catalog). */
export function listEventsForProfile(
  profileText: string,
  options?: { minHits?: number },
): OgEventPost[] {
  const hay = profileText.trim().toLowerCase();
  const minHits = options?.minHits ?? 1;
  if (!hay) return [];

  const scored = listOgEvents().map((ev) => {
    const hits = ev.matchKeys.filter((k) => hay.includes(k)).length;
    return { ev, score: hits };
  });
  scored.sort((a, b) => b.score - a.score || +new Date(b.ev.createdAt) - +new Date(a.ev.createdAt));
  return scored.filter((s) => s.score >= minHits).map((s) => s.ev);
}

/** Keep jobs that touch profile keywords (personalized API jobs can pass through with `preferAll`). */
export function filterJobsForProfile(
  jobEvents: OgEventPost[],
  profileText: string,
  options?: { preferAll?: boolean; limit?: number },
): OgEventPost[] {
  const limit = options?.limit ?? 6;
  if (!jobEvents.length) return [];
  if (options?.preferAll) return jobEvents.slice(0, limit);

  const hay = profileText.trim().toLowerCase();
  if (!hay) return jobEvents.slice(0, Math.min(3, limit));

  const tokens = hay.split(/[^a-z0-9+#.]+/).filter((t) => t.length > 2);
  const scored = jobEvents.map((ev) => {
    const blob = `${ev.title} ${ev.hostName} ${ev.body} ${ev.matchKeys.join(' ')}`.toLowerCase();
    const hits =
      ev.matchKeys.filter((k) => hay.includes(k)).length +
      tokens.filter((t) => blob.includes(t)).length;
    return { ev, score: hits };
  });
  scored.sort((a, b) => b.score - a.score);
  const matched = scored.filter((s) => s.score > 0).map((s) => s.ev);
  return (matched.length ? matched : jobEvents).slice(0, limit);
}

/** Merge live job cards into the ranked events list (jobs float near top). */
export function mergeEventsWithJobs(
  events: OgEventPost[],
  jobEvents: OgEventPost[],
): OgEventPost[] {
  if (!jobEvents.length) return events;
  const withoutJobs = events.filter((e) => e.type !== 'job');
  return [...jobEvents, ...withoutJobs];
}

export function eventTypeLabel(type: OgEventType): string {
  switch (type) {
    case 'walk-in':
      return 'Walk-in';
    case 'seminar':
      return 'Seminar';
    case 'webinar':
      return 'Webinar';
    case 'job-fair':
      return 'Job fair';
    case 'job':
      return 'Job';
    default:
      return 'Event';
  }
}
