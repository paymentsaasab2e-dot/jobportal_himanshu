/**
 * HQ display store — analytics only (no product logic).
 *
 * - realtime: latest session-style snapshot per user (live HQ boards)
 * - history: appended snapshots for past reports (fetched on demand)
 * - tickets: many tickets appended (never replace older ones)
 *
 * Persists under data/hq-*.json when the filesystem is writable;
 * falls back to in-memory for serverless / cold starts.
 */

import fs from 'fs';
import path from 'path';

export type HqRealtimeSnapshot = {
  userId: string;
  capturedAt: string;
  kind: 'realtime_session';
  /** Compact live signals for HQ dashboards */
  session: {
    logins?: number | null;
    visits?: number | null;
    applies?: number | null;
    activeMs?: number | null;
    sessionCount?: number | null;
    topInsightIds?: string[];
    triggerFlags?: string[];
    alertWindow?: string | null;
    alertConfidence?: string | null;
    topLocation?: string | null;
    preferredAlertHours?: number[];
  };
  /** Pointer — HQ can fetch full latest / history when needed */
  hasFullLatest: boolean;
};

export type HqBehaviorLatest = {
  userId: string;
  capturedAt: string;
  activityStateUpdatedAt?: string;
  rollup7d?: unknown;
  suggestionMetrics?: unknown;
  triggers?: unknown[];
  interests?: unknown[];
  personalizedRecs?: unknown[];
  sessionEngagement?: unknown;
  alertTiming?: unknown;
  locations?: unknown[];
  [key: string]: unknown;
};

export type HqHistoryEntry = {
  id: string;
  userId: string;
  capturedAt: string;
  /** Slim copy for analytics charts — not full rollup dump every time */
  snapshot: {
    logins?: number | null;
    visits?: number | null;
    applies?: number | null;
    activeMs?: number | null;
    jobCardClicks?: number | null;
    triggerCount?: number;
    insightIds?: string[];
    alertWindow?: string | null;
    topLocation?: string | null;
  };
};

export type HqHelpTicket = {
  id: string;
  createdAt: string;
  name: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  problemId?: string | null;
  userId?: string | null;
  status: 'open' | 'in_progress' | 'closed';
  source: 'help_page';
};

type HqFileBundle = {
  realtime: Record<string, HqRealtimeSnapshot>;
  latest: Record<string, HqBehaviorLatest>;
  history: HqHistoryEntry[];
  tickets: HqHelpTicket[];
  updatedAt: string;
};

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'hq-analytics.json');
const MAX_HISTORY = 2000;
const MAX_TICKETS = 2000;
const HISTORY_MIN_GAP_MS = 5 * 60 * 1000;

const g = globalThis as typeof globalThis & {
  __saasaHqAnalytics?: HqFileBundle;
  __saasaHqHistoryLastAt?: Map<string, number>;
};

function emptyBundle(): HqFileBundle {
  return {
    realtime: {},
    latest: {},
    history: [],
    tickets: [],
    updatedAt: new Date().toISOString(),
  };
}

function ensureLoaded(): HqFileBundle {
  if (g.__saasaHqAnalytics) return g.__saasaHqAnalytics;
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const parsed = JSON.parse(raw) as HqFileBundle;
      g.__saasaHqAnalytics = {
        realtime: parsed.realtime || {},
        latest: parsed.latest || {},
        history: Array.isArray(parsed.history) ? parsed.history : [],
        tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
        updatedAt: parsed.updatedAt || new Date().toISOString(),
      };
      return g.__saasaHqAnalytics;
    }
  } catch {
    /* fall through */
  }
  g.__saasaHqAnalytics = emptyBundle();
  return g.__saasaHqAnalytics;
}

function persist(bundle: HqFileBundle) {
  bundle.updatedAt = new Date().toISOString();
  g.__saasaHqAnalytics = bundle;
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(bundle, null, 2), 'utf8');
  } catch {
    /* memory-only if disk blocked */
  }
}

function historyGapOk(userId: string, now: number) {
  if (!g.__saasaHqHistoryLastAt) g.__saasaHqHistoryLastAt = new Map();
  const last = g.__saasaHqHistoryLastAt.get(userId) || 0;
  if (now - last < HISTORY_MIN_GAP_MS) return false;
  g.__saasaHqHistoryLastAt.set(userId, now);
  return true;
}

function asNum(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function buildRealtimeFromLatest(latest: HqBehaviorLatest): HqRealtimeSnapshot {
  const rollup = (latest.rollup7d || {}) as Record<string, unknown>;
  const insights = Array.isArray(rollup.insights) ? rollup.insights : [];
  const triggers = Array.isArray(latest.triggers) ? latest.triggers : [];
  const alert = (latest.alertTiming || {}) as Record<string, unknown>;
  const locations = Array.isArray(latest.locations) ? latest.locations : [];
  const topLoc = (locations[0] || null) as { key?: string } | null;
  const signals = (rollup.behaviourSignals || {}) as Record<string, unknown>;

  return {
    userId: latest.userId,
    capturedAt: latest.capturedAt,
    kind: 'realtime_session',
    session: {
      logins: asNum(rollup.logins),
      visits: asNum(rollup.visits),
      applies: asNum(rollup.applies),
      activeMs: asNum(rollup.activeMs),
      sessionCount: asNum(rollup.sessionCount),
      topInsightIds: insights
        .slice(0, 5)
        .map((i) => (i as { id?: string })?.id)
        .filter(Boolean) as string[],
      triggerFlags: triggers
        .slice(0, 8)
        .map((t) => (t as { flag?: string })?.flag)
        .filter(Boolean) as string[],
      alertWindow: typeof alert.bestWindowLabel === 'string' ? alert.bestWindowLabel : null,
      alertConfidence: typeof alert.confidence === 'string' ? alert.confidence : null,
      topLocation: topLoc?.key || null,
      preferredAlertHours: Array.isArray(signals.preferredAlertHours)
        ? (signals.preferredAlertHours as number[])
        : Array.isArray(alert.bestHours)
          ? (alert.bestHours as number[])
          : [],
    },
    hasFullLatest: true,
  };
}

export function upsertBehaviorLatest(payload: HqBehaviorLatest, opts?: { forceHistory?: boolean }) {
  const bundle = ensureLoaded();
  const userId = String(payload.userId || '').trim();
  if (!userId) throw new Error('userId required');

  const latest: HqBehaviorLatest = {
    ...payload,
    userId,
    capturedAt: payload.capturedAt || new Date().toISOString(),
  };
  bundle.latest[userId] = latest;
  bundle.realtime[userId] = buildRealtimeFromLatest(latest);

  const now = Date.now();
  if (opts?.forceHistory || historyGapOk(userId, now)) {
    const rollup = (latest.rollup7d || {}) as Record<string, unknown>;
    const insights = Array.isArray(rollup.insights) ? rollup.insights : [];
    const alert = (latest.alertTiming || {}) as Record<string, unknown>;
    const locations = Array.isArray(latest.locations) ? latest.locations : [];
    const topLoc = (locations[0] || null) as { key?: string } | null;
    const entry: HqHistoryEntry = {
      id: `hist_${now.toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      userId,
      capturedAt: latest.capturedAt,
      snapshot: {
        logins: asNum(rollup.logins),
        visits: asNum(rollup.visits),
        applies: asNum(rollup.applies),
        activeMs: asNum(rollup.activeMs),
        jobCardClicks: asNum(rollup.jobCardClicks),
        triggerCount: Array.isArray(latest.triggers) ? latest.triggers.length : 0,
        insightIds: insights
          .slice(0, 8)
          .map((i) => (i as { id?: string })?.id)
          .filter(Boolean) as string[],
        alertWindow: typeof alert.bestWindowLabel === 'string' ? alert.bestWindowLabel : null,
        topLocation: topLoc?.key || null,
      },
    };
    bundle.history.unshift(entry);
    bundle.history = bundle.history.slice(0, MAX_HISTORY);
  }

  persist(bundle);
  return {
    realtime: bundle.realtime[userId]!,
    latest: bundle.latest[userId]!,
  };
}

/** Slim rollup fields HQ board aggregation needs (keeps payload small). */
function slimRollupForBoard(rollup: unknown) {
  if (!rollup || typeof rollup !== 'object') return null;
  const r = rollup as Record<string, unknown>;
  return {
    logins: asNum(r.logins),
    visits: asNum(r.visits),
    applies: asNum(r.applies),
    activeMs: asNum(r.activeMs),
    sessionCount: asNum(r.sessionCount),
    jobCardClicks: asNum(r.jobCardClicks),
    pageVisitsByCategory:
      r.pageVisitsByCategory && typeof r.pageVisitsByCategory === 'object'
        ? r.pageVisitsByCategory
        : {},
    activeMsByCategory:
      r.activeMsByCategory && typeof r.activeMsByCategory === 'object'
        ? r.activeMsByCategory
        : {},
    firstOpenBreakdown:
      r.firstOpenBreakdown && typeof r.firstOpenBreakdown === 'object'
        ? r.firstOpenBreakdown
        : {},
    topFirstOpen: typeof r.topFirstOpen === 'string' ? r.topFirstOpen : null,
    hqTriggers: Array.isArray(r.hqTriggers) ? r.hqTriggers.slice(0, 10) : [],
    topCompanies: Array.isArray(r.topCompanies) ? r.topCompanies.slice(0, 5) : [],
    topRoles: Array.isArray(r.topRoles) ? r.topRoles.slice(0, 5) : [],
  };
}

function slimInterestsForBoard(interests: unknown) {
  if (!Array.isArray(interests)) return [];
  return interests
    .map((raw) => {
      const t = raw as { key?: string; label?: string; score?: number };
      const key = String(t?.key || '').trim();
      if (!key) return null;
      return {
        key,
        label: String(t?.label || key).trim() || key,
        score: typeof t?.score === 'number' && Number.isFinite(t.score) ? t.score : 0,
      };
    })
    .filter(Boolean)
    .slice(0, 12) as Array<{ key: string; label: string; score: number }>;
}

/**
 * Live board rows: realtime pulse + latest rollup / interests / triggers
 * so Phase 2 HQ can aggregate premium, entry points, and interest trends.
 */
export function listRealtime(limit = 100) {
  const bundle = ensureLoaded();
  return Object.values(bundle.realtime)
    .sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)))
    .slice(0, limit)
    .map((rt) => {
      const latest = bundle.latest[rt.userId];
      if (!latest) return rt;
      return {
        ...rt,
        activityStateUpdatedAt: latest.activityStateUpdatedAt || null,
        rollup7d: slimRollupForBoard(latest.rollup7d),
        triggers: Array.isArray(latest.triggers) ? latest.triggers.slice(0, 10) : [],
        interests: slimInterestsForBoard(latest.interests),
      };
    });
}

export function getLatest(userId: string) {
  return ensureLoaded().latest[userId] || null;
}

export function getRealtime(userId: string) {
  return ensureLoaded().realtime[userId] || null;
}

export function listHistory(userId: string, limit = 50) {
  const bundle = ensureLoaded();
  return bundle.history
    .filter((h) => h.userId === userId)
    .sort((a, b) => String(b.capturedAt).localeCompare(String(a.capturedAt)))
    .slice(0, limit);
}

export function appendTicket(ticket: HqHelpTicket) {
  const bundle = ensureLoaded();
  // Multi-ticket: always append; never overwrite another ticket id
  const existingIdx = bundle.tickets.findIndex((t) => t.id === ticket.id);
  if (existingIdx >= 0) {
    bundle.tickets[existingIdx] = { ...bundle.tickets[existingIdx]!, ...ticket };
  } else {
    bundle.tickets.unshift(ticket);
  }
  bundle.tickets = bundle.tickets.slice(0, MAX_TICKETS);
  persist(bundle);
  return ticket;
}

export function listTickets(opts?: {
  id?: string;
  email?: string;
  status?: string;
  limit?: number;
}) {
  const bundle = ensureLoaded();
  let list = [...bundle.tickets].sort((a, b) =>
    String(b.createdAt).localeCompare(String(a.createdAt)),
  );
  if (opts?.id) return { one: list.find((t) => t.id === opts.id) || null, list: [] as HqHelpTicket[] };
  if (opts?.email) {
    const email = opts.email.toLowerCase();
    list = list.filter((t) => t.email.toLowerCase() === email);
  }
  if (opts?.status === 'open' || opts?.status === 'in_progress' || opts?.status === 'closed') {
    list = list.filter((t) => t.status === opts.status);
  }
  const limit = opts?.limit ?? 100;
  return {
    one: null as HqHelpTicket | null,
    list: list.slice(0, limit),
    openCount: list.filter((t) => t.status === 'open').length,
    totalMatched: list.length,
  };
}

export function updateTicketStatus(id: string, status: HqHelpTicket['status']) {
  const bundle = ensureLoaded();
  const idx = bundle.tickets.findIndex((t) => t.id === id);
  if (idx < 0) return null;
  bundle.tickets[idx] = { ...bundle.tickets[idx]!, status };
  persist(bundle);
  return bundle.tickets[idx]!;
}
