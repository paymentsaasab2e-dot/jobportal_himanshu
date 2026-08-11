export const EMPLOYERS_DEMO_PATH = "/employers/request-demo";
export const EMPLOYERS_TRIAL_PATH = "/employers/try-free";

export const EMPLOYERS_LOGIN_HREF =
  "https://employers.hryantra.com/login?redirect=%2Fleads";

/** Phase 2 employer workspace login (local dev defaults to port 3001). */
export function getEmployerPortalLoginUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_EMPLOYER_APP_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location.hostname === "localhost") {
    return "http://localhost:3001/login";
  }
  return EMPLOYERS_LOGIN_HREF;
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
