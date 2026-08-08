// Central place to determine which backend API to call.
// - In development: use localhost
// - On Vercel: use the hosted backend URL (unless NEXT_PUBLIC_API_URL overrides it)

const LOCAL_API_ORIGIN = 'http://localhost:5000';
const HOSTED_API_ORIGIN = 'https://api1.hryantra.com';
const LOCAL_PHASE2_ORIGIN = 'http://localhost:5001';
const HOSTED_PHASE2_ORIGIN = 'https://api2.hryantra.com';
const LOOPBACK_ORIGIN_RE = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i;

const normalizeToApiBaseUrl = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('/')) return trimmed.replace(/\/$/, '');
  if (trimmed.includes('/api')) return trimmed.replace(/\/api\/?$/, '') + '/api';
  return trimmed.replace(/\/$/, '') + '/api';
};

// Internal storage for the determined URL
let _effectiveApiBaseUrl: string = '';

export const getApiBaseUrl = () => {
  if (_effectiveApiBaseUrl) return _effectiveApiBaseUrl;

  if (process.env.NEXT_PUBLIC_API_URL) {
    _effectiveApiBaseUrl = normalizeToApiBaseUrl(process.env.NEXT_PUBLIC_API_URL);
  } else if (process.env.NEXT_PUBLIC_VERCEL_URL) {
    _effectiveApiBaseUrl = `/api/proxy`;
  } else {
    _effectiveApiBaseUrl = `${LOCAL_API_ORIGIN}/api`;
  }
  return _effectiveApiBaseUrl;
};

// We use a getter so that when we switch to local backend, all imports see the update
export const API_BASE_URL = {
  get value() {
    return getApiBaseUrl();
  },
  toString() {
    return getApiBaseUrl();
  }
} as unknown as string; // Trick TypeScript so we don't have to change every usage

// This function can be called by a high-level component to trigger a fallback if a request fails
export const switchToLocalBackend = () => {
  if (_effectiveApiBaseUrl.includes(LOCAL_API_ORIGIN)) return;
  
  console.warn('⚠️ Switching to Local Backend (localhost:5000) due to connection failure...');
  _effectiveApiBaseUrl = `${LOCAL_API_ORIGIN}/api`;
};

/** Prefer hosted api1 when local Phase 1 backend is down (common in local UI-only sessions). */
export const switchToHostedBackend = () => {
  const hosted = `${HOSTED_API_ORIGIN}/api`;
  if (_effectiveApiBaseUrl === hosted) return;
  console.warn('⚠️ Switching to Hosted Backend (api1.hryantra.com) — local :5000 unreachable');
  _effectiveApiBaseUrl = hosted;
};

function isLocalApiBase(base: string) {
  return /localhost|127\.0\.0\.1/i.test(base);
}

/**
 * fetch against getApiBaseUrl(); on network failure against localhost,
 * flip to hosted api1 and retry once so Trendings / search keep working.
 */
export async function fetchFromApi(pathWithQuery: string, init?: RequestInit): Promise<Response> {
  const path = pathWithQuery.startsWith('/') ? pathWithQuery : `/${pathWithQuery}`;
  const primary = `${getApiBaseUrl()}${path}`;
  try {
    return await fetch(primary, init);
  } catch (err) {
    if (!isLocalApiBase(getApiBaseUrl())) throw err;
    switchToHostedBackend();
    return fetch(`${getApiBaseUrl()}${path}`, init);
  }
}

export const API_ORIGIN = (() => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/api\/?$/, '');
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return HOSTED_API_ORIGIN;
  return HOSTED_API_ORIGIN;
})();

export const PHASE2_API_ORIGIN = (() => {
  const fromEnv = process.env.NEXT_PUBLIC_PHASE2_API_URL?.trim().replace(/\/api\/?.*$/, '').replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return HOSTED_PHASE2_ORIGIN;
  return HOSTED_PHASE2_ORIGIN;
})();

function resolvePhase2OriginForRuntime(): string {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
      return LOCAL_PHASE2_ORIGIN;
    }
  }
  return PHASE2_API_ORIGIN;
}

function toPublicUploadsApiUrl(origin: string, input?: string | null): string {
  const raw = String(input || '').trim();
  if (!raw) return '';
  if (raw.includes('/api/v1/public/uploads/')) return raw;

  let relative = '';
  if (raw.startsWith('/uploads/')) {
    relative = raw;
  } else if (/^https?:\/\//i.test(raw)) {
    try {
      relative = new URL(raw).pathname || '';
    } catch {
      return raw;
    }
  } else {
    return raw;
  }

  if (
    !relative.startsWith('/uploads/placements/') &&
    !relative.startsWith('/uploads/interview-client-review/')
  ) {
    if (relative.startsWith('/uploads/')) {
      return `${origin.replace(/\/+$/, '')}${relative}`;
    }
    return raw;
  }

  const subPath = relative.replace(/^\/uploads\//, '');
  return `${origin.replace(/\/+$/, '')}/api/v1/public/uploads/${subPath}`;
}

/**
 * Offer letters are uploaded to backendphase2 (`/uploads/placements/...` on
 * api2.hryantra.com). Stored URLs can be relative or a dev absolute URL
 * (`http://localhost:5001/...`) — rewrite them for production viewers.
 */
export const resolvePhase2UploadUrl = (raw?: string | null, relative?: string | null): string => {
  const origin = resolvePhase2OriginForRuntime();
  const rel = String(relative || '').trim();
  if (rel.startsWith('/uploads/')) {
    return toPublicUploadsApiUrl(origin, rel);
  }

  let trimmed = String(raw || '').trim();
  if (!trimmed) return '';

  if (trimmed.match(/^https? \/\//i)) {
    trimmed = trimmed.replace(/^(https?)( \/\/)/i, '$1:$2');
  }
  if (trimmed.match(/^https?\/\//i)) {
    trimmed = trimmed.replace(/^(https?)\/\//i, '$1://');
  }

  if (LOOPBACK_ORIGIN_RE.test(trimmed)) {
    return toPublicUploadsApiUrl(origin, trimmed.replace(LOOPBACK_ORIGIN_RE, origin));
  }

  if (trimmed.startsWith('/uploads/')) {
    return toPublicUploadsApiUrl(origin, trimmed);
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
    return toPublicUploadsApiUrl(origin, trimmed);
  }

  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return toPublicUploadsApiUrl(origin, path);
};

export const resolveDocumentUrl = (url?: string): string => {
  if (!url) return '';
  let trimmed = url.trim();

  // CRM placement / offer-letter uploads live on backendphase2, not api1.
  if (trimmed.includes('/uploads/placements/') || trimmed.includes('/uploads/interview-client-review/')) {
    return resolvePhase2UploadUrl(trimmed);
  }
  
  // Fix common malformation: 'https//' or 'http//' missing the colon
  if (trimmed.match(/^https? \/\//i)) {
    trimmed = trimmed.replace(/^(https?)( \/\/)/i, '$1:$2');
  }
  // Also handle cases where there's no space but still no colon
  if (trimmed.match(/^https?\/\//i)) {
    trimmed = trimmed.replace(/^(https?)\/\//i, '$1://');
  }

  // Check if it's now a proper absolute URL
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('//')) {
    return trimmed;
  }
  
  // Ensure relative URLs start with a slash
  const path = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return `${API_ORIGIN}${path}`;
};

