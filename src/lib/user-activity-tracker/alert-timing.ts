/**
 * Derive precise alert / suggestion send windows from session duration + location.
 * Used by /user-stats, /api/hq-behavior, and HQ panels.
 */

export type SessionLikeForTiming = {
  startedAt?: string | null;
  loginAt?: string | null;
  createdAt?: string | null;
  endedAt?: string | null;
  logoutAt?: string | null;
  durationMs?: number | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  timezone?: string | null;
  ipAddress?: string | null;
  deviceType?: string | null;
  browser?: string | null;
  operatingSystem?: string | null;
  isActive?: boolean | null;
};

export type LocationStat = {
  key: string;
  city: string | null;
  state: string | null;
  country: string | null;
  sessions: number;
  totalDurationMs: number;
};

export type HourBucket = {
  hour: number;
  label: string;
  sessions: number;
  totalDurationMs: number;
};

export type WeekdayBucket = {
  weekday: number;
  label: string;
  sessions: number;
  totalDurationMs: number;
};

export type AlertTiming = {
  /** Local hours (0–23) with strongest engagement — best to send alerts */
  bestHours: number[];
  bestHourLabels: string[];
  bestWeekdays: string[];
  bestWindowLabel: string;
  avoidHours: number[];
  timezone: string | null;
  confidence: 'low' | 'medium' | 'high';
  reason: string;
  sampleSessions: number;
  avgDurationMs: number;
  medianDurationMs: number;
};

export type SessionEngagementStats = {
  sessionCount: number;
  activeCount: number;
  totalDurationMs: number;
  avgDurationMs: number;
  medianDurationMs: number;
  uniqueIps: number;
  uniqueDevices: number;
  locations: LocationStat[];
  byHour: HourBucket[];
  byWeekday: WeekdayBucket[];
  alertTiming: AlertTiming;
};

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function hourLabel(hour: number) {
  const h = ((hour % 24) + 24) % 24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:00 ${ampm}`;
}

function startOf(session: SessionLikeForTiming): Date | null {
  const raw = session.startedAt || session.loginAt || session.createdAt;
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isFinite(d.getTime()) ? d : null;
}

function durationOf(session: SessionLikeForTiming, now = Date.now()): number {
  if (typeof session.durationMs === 'number' && Number.isFinite(session.durationMs)) {
    return Math.max(0, session.durationMs);
  }
  const start = startOf(session);
  if (!start) return 0;
  const endRaw = session.endedAt || session.logoutAt;
  const end = endRaw ? new Date(endRaw).getTime() : now;
  if (!Number.isFinite(end)) return 0;
  return Math.max(0, end - start.getTime());
}

function median(nums: number[]): number {
  if (!nums.length) return 0;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid]! : Math.round((sorted[mid - 1]! + sorted[mid]!) / 2);
}

function locationKey(s: SessionLikeForTiming) {
  const parts = [s.city, s.state, s.country].map((p) => String(p || '').trim()).filter(Boolean);
  return parts.length ? parts.join(', ') : 'unknown';
}

/**
 * Build engagement + alert-timing stats from login / browsing sessions.
 */
export function buildSessionEngagementStats(
  sessions: SessionLikeForTiming[],
  options?: { now?: number },
): SessionEngagementStats {
  const now = options?.now ?? Date.now();
  const list = Array.isArray(sessions) ? sessions : [];
  const hourMap = new Map<number, { sessions: number; totalDurationMs: number }>();
  const dayMap = new Map<number, { sessions: number; totalDurationMs: number }>();
  const locMap = new Map<string, LocationStat>();
  const ips = new Set<string>();
  const devices = new Set<string>();
  const durations: number[] = [];
  let totalDurationMs = 0;
  let activeCount = 0;
  let timezone: string | null = null;

  for (const s of list) {
    const ms = durationOf(s, now);
    durations.push(ms);
    totalDurationMs += ms;
    if (s.isActive !== false && !s.endedAt && !s.logoutAt) activeCount += 1;
    if (s.timezone && !timezone) timezone = String(s.timezone);
    if (s.ipAddress && s.ipAddress !== 'unknown') ips.add(String(s.ipAddress));
    const deviceKey = [s.deviceType, s.browser, s.operatingSystem].filter(Boolean).join('|');
    if (deviceKey) devices.add(deviceKey);

    const start = startOf(s);
    if (start) {
      const hour = start.getHours();
      const weekday = start.getDay();
      const h = hourMap.get(hour) || { sessions: 0, totalDurationMs: 0 };
      h.sessions += 1;
      h.totalDurationMs += ms;
      hourMap.set(hour, h);
      const d = dayMap.get(weekday) || { sessions: 0, totalDurationMs: 0 };
      d.sessions += 1;
      d.totalDurationMs += ms;
      dayMap.set(weekday, d);
    }

    const key = locationKey(s);
    const loc = locMap.get(key) || {
      key,
      city: s.city || null,
      state: s.state || null,
      country: s.country || null,
      sessions: 0,
      totalDurationMs: 0,
    };
    loc.sessions += 1;
    loc.totalDurationMs += ms;
    locMap.set(key, loc);
  }

  const avgDurationMs = list.length ? Math.round(totalDurationMs / list.length) : 0;
  const medianDurationMs = median(durations);

  const byHour: HourBucket[] = [...hourMap.entries()]
    .map(([hour, v]) => ({
      hour,
      label: hourLabel(hour),
      sessions: v.sessions,
      totalDurationMs: v.totalDurationMs,
    }))
    .sort((a, b) => b.totalDurationMs - a.totalDurationMs || b.sessions - a.sessions);

  const byWeekday: WeekdayBucket[] = [...dayMap.entries()]
    .map(([weekday, v]) => ({
      weekday,
      label: WEEKDAY_LABELS[weekday] || String(weekday),
      sessions: v.sessions,
      totalDurationMs: v.totalDurationMs,
    }))
    .sort((a, b) => b.totalDurationMs - a.totalDurationMs || b.sessions - a.sessions);

  const locations = [...locMap.values()]
    .filter((l) => l.key !== 'unknown')
    .sort((a, b) => b.sessions - a.sessions || b.totalDurationMs - a.totalDurationMs);

  const bestHours = byHour.slice(0, 3).map((h) => h.hour);
  const bestHourLabels = bestHours.map(hourLabel);
  const bestWeekdays = byWeekday.slice(0, 2).map((d) => d.label);

  const weakHours = [...byHour].sort(
    (a, b) => a.totalDurationMs - b.totalDurationMs || a.sessions - b.sessions,
  );
  const avoidHours = weakHours.slice(0, 3).map((h) => h.hour);

  let confidence: AlertTiming['confidence'] = 'low';
  if (list.length >= 8 && byHour.length >= 3) confidence = 'high';
  else if (list.length >= 3) confidence = 'medium';

  const windowCore =
    bestHours.length && bestWeekdays.length
      ? `${bestWeekdays.join(' / ')} · ${bestHourLabels.slice(0, 2).join('–')}`
      : bestHourLabels.length
        ? bestHourLabels.slice(0, 2).join('–')
        : 'Not enough data yet';

  const topLoc = locations[0];
  const reasonParts = [
    bestHours.length
      ? `Most active around ${bestHourLabels.slice(0, 2).join(' and ')} local time`
      : 'Need more login sessions to pin a send window',
    avgDurationMs > 0 ? `avg session ${Math.round(avgDurationMs / 60000)} min` : null,
    topLoc ? `often from ${topLoc.key}` : null,
  ].filter(Boolean);

  const alertTiming: AlertTiming = {
    bestHours,
    bestHourLabels,
    bestWeekdays,
    bestWindowLabel: windowCore,
    avoidHours,
    timezone,
    confidence,
    reason: reasonParts.join(' · '),
    sampleSessions: list.length,
    avgDurationMs,
    medianDurationMs,
  };

  return {
    sessionCount: list.length,
    activeCount,
    totalDurationMs,
    avgDurationMs,
    medianDurationMs,
    uniqueIps: ips.size,
    uniqueDevices: devices.size,
    locations: locations.slice(0, 12),
    byHour,
    byWeekday,
    alertTiming,
  };
}
