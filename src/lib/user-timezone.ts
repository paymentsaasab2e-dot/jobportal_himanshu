import { APP_TIME_ZONE } from '@/lib/i18n';

export const USER_TIMEZONE_STORAGE_KEY = 'saasa:user-timezone';
export const USER_TIMEZONE_EVENT = 'saasa:user-timezone-changed';

const POPULAR_TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Hong_Kong',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Toronto',
  'America/Sao_Paulo',
  'Australia/Sydney',
  'Pacific/Auckland',
] as const;

const FALLBACK_TIMEZONES = [
  ...POPULAR_TIMEZONES,
  'Africa/Cairo',
  'Africa/Johannesburg',
  'Africa/Lagos',
  'Africa/Nairobi',
  'America/Argentina/Buenos_Aires',
  'America/Bogota',
  'America/Mexico_City',
  'America/Phoenix',
  'America/Vancouver',
  'Asia/Bangkok',
  'Asia/Dhaka',
  'Asia/Jakarta',
  'Asia/Karachi',
  'Asia/Kathmandu',
  'Asia/Kuala_Lumpur',
  'Asia/Manila',
  'Asia/Riyadh',
  'Asia/Seoul',
  'Australia/Melbourne',
  'Australia/Perth',
  'Europe/Amsterdam',
  'Europe/Dublin',
  'Europe/Madrid',
  'Europe/Moscow',
  'Europe/Rome',
  'Europe/Stockholm',
  'Europe/Warsaw',
  'Pacific/Honolulu',
];

export function getBrowserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || APP_TIME_ZONE;
  } catch {
    return APP_TIME_ZONE;
  }
}

export function isValidTimeZone(timeZone: string | null | undefined): boolean {
  const tz = String(timeZone || '').trim();
  if (!tz) return false;
  try {
    Intl.DateTimeFormat('en-US', { timeZone: tz }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

/** Accepts IANA ids or legacy labels like "Asia/Kolkata (UTC+05:30)". */
export function normalizeTimeZone(raw: string | null | undefined, fallback = APP_TIME_ZONE): string {
  const value = String(raw || '').trim();
  if (!value) return isValidTimeZone(fallback) ? fallback : APP_TIME_ZONE;
  if (isValidTimeZone(value)) return value;
  const iana = value.split(/\s+/)[0];
  if (isValidTimeZone(iana)) return iana;
  return isValidTimeZone(fallback) ? fallback : APP_TIME_ZONE;
}

export function getUserTimeZone(): string {
  if (typeof window === 'undefined') return APP_TIME_ZONE;
  try {
    const stored = window.localStorage.getItem(USER_TIMEZONE_STORAGE_KEY);
    if (stored) return normalizeTimeZone(stored, getBrowserTimeZone());
  } catch {
    /* ignore */
  }
  return getBrowserTimeZone();
}

export function setUserTimeZone(timeZone: string | null | undefined) {
  const next = normalizeTimeZone(timeZone, getBrowserTimeZone());
  if (typeof window === 'undefined') return next;
  try {
    window.localStorage.setItem(USER_TIMEZONE_STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(USER_TIMEZONE_EVENT, { detail: next }));
  return next;
}

export function listTimeZones(): string[] {
  let all: string[] = FALLBACK_TIMEZONES;
  try {
    if (typeof Intl !== 'undefined' && 'supportedValuesOf' in Intl) {
      all =
        (Intl as { supportedValuesOf?: (key: string) => string[] }).supportedValuesOf?.('timeZone') ||
        FALLBACK_TIMEZONES;
    }
  } catch {
    all = FALLBACK_TIMEZONES;
  }
  const unique = [...new Set([...POPULAR_TIMEZONES, ...all])].filter((tz) => isValidTimeZone(tz));
  unique.sort((a, b) => a.localeCompare(b));
  return unique;
}

export function formatTimeZoneOffset(timeZone: string, at = new Date()): string {
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'shortOffset',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(at);
    const name = parts.find((part) => part.type === 'timeZoneName')?.value || 'GMT';
    if (name === 'GMT' || name === 'UTC') return 'UTC';
    return name.replace('GMT', 'UTC').replace('UTC−', 'UTC-');
  } catch {
    return '';
  }
}

export function formatTimeZoneOption(timeZone: string, at = new Date()): string {
  const offset = formatTimeZoneOffset(timeZone, at);
  const city = timeZone.replace(/_/g, ' ').split('/').slice(-1)[0] || timeZone;
  return offset ? `${city} (${offset}) — ${timeZone}` : `${city} — ${timeZone}`;
}

export function formatTimeZoneSummary(timeZone: string, at = new Date()): string {
  const offset = formatTimeZoneOffset(timeZone, at);
  return offset ? `${timeZone} (${offset})` : timeZone;
}

export function formatInUserTimeZone(
  value: string | Date | number,
  options: Intl.DateTimeFormatOptions,
  locale = 'en-US',
  timeZone = getUserTimeZone(),
): string {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(locale, { ...options, timeZone });
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
  const asUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );
  return asUtc - date.getTime();
}

/** Convert a wall-clock date+time in the given timezone to UTC milliseconds. */
export function wallTimeInZoneToUtcMs(
  dateKey: string,
  hour: number,
  minute: number,
  timeZone = getUserTimeZone(),
): number {
  const year = Number(dateKey.slice(0, 4));
  const month = Number(dateKey.slice(5, 7));
  const day = Number(dateKey.slice(8, 10));
  if (!year || !month || !day) return Number.NaN;
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, 0);
  try {
    const offset = getTimeZoneOffsetMs(new Date(utcGuess), timeZone);
    const result = utcGuess - offset;
    return Number.isFinite(result) ? result : Number.NaN;
  } catch {
    return Number.NaN;
  }
}
