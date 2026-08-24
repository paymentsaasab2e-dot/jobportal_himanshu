export const EMPLOYERS_DEMO_PATH = "/employers/request-demo";
export const EMPLOYERS_TRIAL_PATH = "/employers/try-free";

/** Phase 2 employer app origin (no path). */
export const EMPLOYERS_PORTAL_ORIGIN = "https://employers.hryantra.com";

/** Default login entry — always land on Phase 2 dashboard after auth. */
export const EMPLOYERS_LOGIN_HREF = `${EMPLOYERS_PORTAL_ORIGIN}/login?redirect=${encodeURIComponent("/dashboard")}`;

function stripToOrigin(raw: string): string {
  const trimmed = String(raw || "").trim().replace(/\/$/, "");
  if (!trimmed) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    return new URL(withProtocol).origin;
  } catch {
    return trimmed
      .replace(/\/login\/?(\?.*)?$/i, "")
      .replace(/\/$/, "");
  }
}

/** Phase 2 employer workspace origin (local dev defaults to port 3001). */
export function getEmployerPortalOrigin(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EMPLOYER_APP_URL?.trim();
  if (fromEnv) {
    const origin = stripToOrigin(fromEnv);
    if (origin) return origin;
  }
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001";
  }
  return EMPLOYERS_PORTAL_ORIGIN;
}

/** Phase 2 employer workspace login URL (always absolute `/login` → dashboard). */
export function getEmployerPortalLoginUrl(): string {
  return `${getEmployerPortalOrigin()}/login?redirect=${encodeURIComponent("/dashboard")}`;
}

/** Phase 2 auth login from marketing try-free (same-origin API route). */
export function getTryFreeLoginApiUrl(): string {
  return '/api/employers/try-free-login';
}

/** Phase 2 API root including `/api/v1` — server-side / legacy use. Browser try-free uses getTryFreeLoginApiUrl(). */
export function getPhase2AuthApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_PHASE2_API_URL?.trim().replace(/\/$/, "");
  if (fromEnv) {
    return fromEnv.includes("/api") ? fromEnv.replace(/\/api\/?$/, "") + "/api/v1" : `${fromEnv}/api/v1`;
  }
  if (process.env.NODE_ENV === "development") {
    return "http://127.0.0.1:5001/api/v1";
  }
  return "https://api2.hryantra.com/api/v1";
}

/** @deprecated Use EMPLOYERS_TRIAL_PATH — try-free is HQ-granted login access. */
export const EMPLOYERS_FREE_TRIAL_HREF = EMPLOYERS_TRIAL_PATH;

/** Default trial length when HQ does not override (days). */
export const TRIAL_DURATION_DAYS = 5;

/** Marketing note: try-free credentials are emailed after HQ grants access from a demo request. */
export const TRY_FREE_ACCESS_NOTE =
  "Try-free access is granted by HQ after you request a demo. Sign in here with the credentials they email you.";
