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

/** @deprecated Use EMPLOYERS_TRIAL_PATH — trial opens the on-site signup form. */
export const EMPLOYERS_FREE_TRIAL_HREF = EMPLOYERS_TRIAL_PATH;

export const TRIAL_DURATION_DAYS = 5;
