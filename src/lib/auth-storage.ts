/** Read auth values from either storage (localStorage survives tab restore; sessionStorage is per-tab). */

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function getStoredCandidateId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('candidateId') || sessionStorage.getItem('candidateId');
}

/** Keep both storages aligned so profile pages that read sessionStorage still work after tab restore. */
export function syncAuthStorage(): void {
  if (typeof window === 'undefined') return;

  const token = getStoredToken();
  const candidateId = getStoredCandidateId();

  if (token) {
    localStorage.setItem('token', token);
    sessionStorage.setItem('token', token);
  }
  if (candidateId) {
    localStorage.setItem('candidateId', candidateId);
    sessionStorage.setItem('candidateId', candidateId);
  }
}

export function persistAuthSession(token: string, candidateId: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
  localStorage.setItem('candidateId', candidateId);
  sessionStorage.setItem('token', token);
  sessionStorage.setItem('candidateId', candidateId);
}

export function getAuthHeaders(): Record<string, string> {
  const token = getStoredToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

/** Prefer AuthContext user id so profile APIs match the JWT (avoids stale localStorage candidateId). */
export function resolveCandidateIdForApi(authUserId?: string | null): string | null {
  const fromAuth = String(authUserId || '').trim();
  if (fromAuth) return fromAuth;
  return getStoredCandidateId();
}
