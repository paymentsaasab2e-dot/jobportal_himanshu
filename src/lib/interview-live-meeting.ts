'use client';

function normalizeRoomId(requestId: string) {
  return String(requestId || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function normalizeDisplayName(value?: string) {
  const raw = String(value || '').trim();
  if (!raw) return 'Participant';
  return raw.slice(0, 80);
}

export function buildInterviewLiveMeetingUrl(
  requestId: string,
  options?: { displayName?: string; role?: 'candidate' | 'interviewer' | 'guest' | string }
) {
  const room = normalizeRoomId(`hryantra-interview-${requestId || 'room'}`);
  const params = new URLSearchParams();

  const displayName = normalizeDisplayName(options?.displayName);
  if (displayName) params.set('name', displayName);

  const role = String(options?.role || 'guest').trim().toLowerCase();
  if (role) params.set('role', role);

  const query = params.toString();
  return query
    ? `/lms/interview-prep/live-room/${encodeURIComponent(room)}?${query}`
    : `/lms/interview-prep/live-room/${encodeURIComponent(room)}`;
}

export function isLiveInterviewRoomPath(pathname: string | null | undefined) {
  const path = String(pathname || '').split('?')[0];
  return path.includes('/lms/interview-prep/live-room');
}
