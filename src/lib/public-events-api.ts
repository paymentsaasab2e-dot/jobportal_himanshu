import { fetchFromApi, getApiBaseUrl } from './api-base';

export type PortalEventSection = {
  id: string;
  title: string;
  content: string;
};

export type PortalEventMediaItem = {
  id: string;
  type: 'image' | 'video';
  url: string;
  name?: string;
  size?: number;
};

export type PortalEventRow = {
  id: string;
  title: string;
  description: string;
  location: string;
  sections: PortalEventSection[];
  media?: PortalEventMediaItem[];
  type: string;
  mode: string;
  scheduledAt: string;
  durationMinutes: number;
  isPublished: boolean;
  source?: string;
  registrationCount: number;
  createdByName?: string;
  hostName?: string;
  accessType?: 'free' | 'purchase' | string;
  tokenCost?: number;
  isFree?: boolean;
  ctaLabel?: string;
};

export const DEFAULT_EVENT_CTA = 'Join';
export const EVENT_CTA_PRESETS = ['Learn', 'Apply', 'Join', 'Register', 'Attend'] as const;

export function normalizeEventCtaLabel(raw?: string | null, fallback = DEFAULT_EVENT_CTA): string {
  const text = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!text) return fallback;
  return text.slice(0, 32);
}

export function eventCtaButtonLabel(opts: {
  ctaLabel?: string | null;
  tokenCost?: number;
  registered?: boolean;
  past?: boolean;
}): string {
  if (opts.past) return 'Event Ended';
  if (opts.registered) return 'Registered';
  const label = normalizeEventCtaLabel(opts.ctaLabel);
  const cost = Number(opts.tokenCost) || 0;
  return cost > 0 ? `${label} · ${cost} tokens` : label;
}

export function firstPortalEventCover(
  media?: PortalEventMediaItem[] | null,
): { src: string; type: 'image' | 'video' } | null {
  if (!Array.isArray(media)) return null;
  const withUrl = media.filter((item) => item?.url);
  const image = withUrl.find((item) => String(item.type).toLowerCase() === 'image');
  const pick = image || withUrl[0];
  if (!pick?.url) return null;
  return {
    src: pick.url,
    type: String(pick.type).toLowerCase() === 'video' ? 'video' : 'image',
  };
}

export type PortalEventRegistrationRow = {
  id: string;
  registeredAt: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  currentTitle: string;
};

function apiRoot() {
  return `${getApiBaseUrl().replace(/\/$/, '')}`;
}

async function parseJson<T>(res: Response): Promise<T> {
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(payload?.message || payload?.error || `Request failed (${res.status})`);
  }
  return payload as T;
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function fetchPublicEvents(
  search?: string,
  scope: 'all' | 'upcoming' | 'past' = 'upcoming',
): Promise<PortalEventRow[]> {
  const params = new URLSearchParams();
  if (search?.trim()) params.set('search', search.trim());
  if (scope) params.set('scope', scope);
  const qs = params.toString();
  const res = await fetchFromApi(`/events/public${qs ? `?${qs}` : ''}`);
  const payload = await parseJson<{ success: boolean; data: { events: PortalEventRow[] } }>(res);
  return Array.isArray(payload.data?.events) ? payload.data.events : [];
}

export async function fetchPublicEventById(eventId: string): Promise<PortalEventRow | null> {
  const res = await fetch(`${apiRoot()}/events/public/${encodeURIComponent(eventId)}`, {
    cache: 'no-store',
  });
  if (res.status === 404) return null;
  const payload = await parseJson<{ success: boolean; data: { event: PortalEventRow } }>(res);
  return payload.data?.event ?? null;
}

export async function registerForPublicEvent(
  token: string,
  eventId: string,
): Promise<void> {
  const res = await fetch(`${apiRoot()}/lms/events/register`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ eventId }),
  });
  const payload = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (res.status === 402) {
      const { InsufficientTokensError } = await import('@/lib/tokens-api');
      throw new InsufficientTokensError({
        message: payload?.message || payload?.error || 'Insufficient tokens',
        balance: payload?.balance,
        required: payload?.required,
        shortfall: payload?.shortfall,
        service: payload?.service,
      });
    }
    throw new Error(payload?.message || payload?.error || `Request failed (${res.status})`);
  }
}
