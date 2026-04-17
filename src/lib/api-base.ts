// Central place to determine which backend API to call.
// - In development: use localhost
// - On Vercel: use the hosted backend URL (unless NEXT_PUBLIC_API_URL overrides it)

const LOCAL_API_ORIGIN = 'http://localhost:5000';
const HOSTED_API_ORIGIN = 'https://api1.hryantra.com';

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

export const API_ORIGIN = (() => {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/api\/?$/, '');
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return HOSTED_API_ORIGIN;
  return HOSTED_API_ORIGIN;
})();

