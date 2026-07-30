import { getApiBaseUrl } from './api-base';

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
};

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
  const res = await fetch(`${apiRoot()}/events/public${qs ? `?${qs}` : ''}`, { cache: 'no-store' });
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
  await parseJson(res);
}
