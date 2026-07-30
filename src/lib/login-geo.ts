import { getCountryCodeForTimeZone } from '@/lib/country-codes';
import { Country } from 'country-state-city';

export type LoginGeoPayload = {
  country?: string;
  countryCode?: string;
  state?: string;
  city?: string;
  timezone?: string;
  clientPublicIp?: string;
};

function countryNameFromCode(code: string): string | undefined {
  try {
    return Country.getCountryByCode(code)?.name;
  } catch {
    return undefined;
  }
}

/** Infer a coarse region label from an IANA timezone (e.g. Asia/Kolkata → Kolkata). */
function regionFromTimezone(tz: string): { state?: string; city?: string } {
  const parts = String(tz || '').split('/');
  if (parts.length < 2) return {};
  const raw = parts[parts.length - 1].replace(/_/g, ' ');
  if (!raw) return {};
  // Prefer as city when it's a city-style zone; also expose as state for grouping.
  return { city: raw, state: parts.length > 2 ? parts[1].replace(/_/g, ' ') : raw };
}

/**
 * Best-effort geo + public IP for login session analytics (no hard dependency on external APIs).
 */
export async function collectLoginGeoPayload(): Promise<LoginGeoPayload> {
  let timezone = 'UTC';
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    timezone = 'UTC';
  }

  const countryCode = getCountryCodeForTimeZone(timezone) || undefined;
  const country = countryCode ? countryNameFromCode(countryCode) || countryCode : undefined;
  const region = regionFromTimezone(timezone);

  const payload: LoginGeoPayload = {
    timezone,
    country,
    countryCode,
    state: region.state,
    city: region.city,
  };

  try {
    const ctrl = new AbortController();
    const timer = window.setTimeout(() => ctrl.abort(), 2500);
    const res = await fetch('https://api.ipify.org?format=json', { signal: ctrl.signal });
    window.clearTimeout(timer);
    if (res.ok) {
      const data = (await res.json()) as { ip?: string };
      if (data?.ip) payload.clientPublicIp = data.ip;
    }
  } catch {
    // ignore — IP is optional
  }

  // Optional enrichment from free IP geo (best-effort; fails silently)
  if (payload.clientPublicIp) {
    try {
      const ctrl = new AbortController();
      const timer = window.setTimeout(() => ctrl.abort(), 2500);
      const res = await fetch(
        `https://ipapi.co/${encodeURIComponent(payload.clientPublicIp)}/json/`,
        { signal: ctrl.signal },
      );
      window.clearTimeout(timer);
      if (res.ok) {
        const data = (await res.json()) as {
          country_name?: string;
          country_code?: string;
          region?: string;
          city?: string;
          error?: boolean;
        };
        if (!data?.error) {
          if (data.country_name) payload.country = data.country_name;
          if (data.country_code) payload.countryCode = data.country_code;
          if (data.region) payload.state = data.region;
          if (data.city) payload.city = data.city;
        }
      }
    } catch {
      // ignore
    }
  }

  return payload;
}
