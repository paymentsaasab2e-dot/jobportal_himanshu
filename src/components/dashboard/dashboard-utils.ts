import type { DashboardData, DashboardJob } from "./dashboard-types";
import { formatCompactSalarySafe } from "@/lib/format-salary";
import type { AppLocale } from "@/lib/i18n";
import { getSalaryNumberLocale } from "@/lib/displayContentLocale";

type DashboardTranslate = (
  key: string,
  values?: Record<string, string | number>
) => string;

const DAY_MESSAGE_KEYS = {
  morning: "goodMorning",
  afternoon: "goodAfternoon",
  evening: "goodEvening",
  night: "goodNight",
} as const;

const SUBHEADING_KEYS = {
  morning: "subheadingMorning",
  afternoon: "subheadingAfternoon",
  evening: "subheadingEvening",
  night: "subheadingNight",
} as const;

/** Bootstrap / legacy labels — must not drive greetings like "Good evening, New". */
export function isPortalPlaceholderFullName(name?: string | null): boolean {
  const t = String(name ?? "")
    .trim()
    .toLowerCase();
  if (!t) return true;
  return (
    t === "new candidate" ||
    t === "user" ||
    t === "candidate" ||
    t === "member" ||
    t === "job seeker"
  );
}

/** Display name for `/profile` API shape (AuthContext) — same placeholder rules as the dashboard card. */
export function getAuthContextDisplayName(profile: {
  personalInfo?: {
    firstName?: string | null;
    middleName?: string | null;
    lastName?: string | null;
  } | null;
  whatsappNumber?: string | null;
  countryCode?: string | null;
}): string {
  const pi = profile.personalInfo || {};
  const combined = [pi.firstName, pi.middleName, pi.lastName]
    .filter((part) => part && String(part).trim())
    .map((part) => String(part).trim())
    .join(" ")
    .trim();
  if (combined && !isPortalPlaceholderFullName(combined)) return combined;

  const digits = String(profile.whatsappNumber || "").replace(/\D/g, "");
  if (digits.length >= 4) {
    return `Account · ${digits.slice(-4)}`;
  }

  return "Candidate";
}

export const PROFILE_DISPLAY_COMPLETE_SENTINEL = "Complete your profile";
export const PROFILE_DISPLAY_ACCOUNT_PREFIX = "Account ·";

/** Full line under the avatar (never show "New Candidate" when we only know WhatsApp). */
export function getProfileDisplayFullName(
  profile?: DashboardData["profile"] | null
): string {
  const raw = profile?.fullName?.trim() || "";
  if (raw && !isPortalPlaceholderFullName(raw)) return raw;

  const digits = String(profile?.whatsappNumber || "").replace(/\D/g, "");
  if (digits.length >= 4) {
    return `${PROFILE_DISPLAY_ACCOUNT_PREFIX} ${digits.slice(-4)}`;
  }

  return PROFILE_DISPLAY_COMPLETE_SENTINEL;
}

export function getDashboardName(profile?: DashboardData["profile"] | null) {
  const fullName = profile?.fullName?.trim();
  if (fullName && !isPortalPlaceholderFullName(fullName)) {
    return fullName.split(/\s+/)[0] ?? "there";
  }

  const whatsappNumber = profile?.whatsappNumber?.replace(/\D/g, "");
  if (whatsappNumber && whatsappNumber.length >= 4) {
    return `...${whatsappNumber.slice(-4)}`;
  }

  return "there";
}

function getMatchesEyebrow(totalMatchedJobs: number, t: DashboardTranslate) {
  if (totalMatchedJobs === 1) return t("freshMatchToday");
  return t("freshMatchesToday", { count: totalMatchedJobs });
}

export function getDynamicGreeting(
  name: string,
  totalMatchedJobs = 0,
  t: DashboardTranslate
) {
  const eyebrow = getMatchesEyebrow(Math.max(0, totalMatchedJobs), t);
  const hour = new Date().getHours();

  let period: keyof typeof DAY_MESSAGE_KEYS = "night";
  if (hour >= 5 && hour < 12) period = "morning";
  else if (hour >= 12 && hour < 17) period = "afternoon";
  else if (hour >= 17 && hour < 22) period = "evening";

  return {
    eyebrow,
    heading: t(DAY_MESSAGE_KEYS[period], { name }),
    subheading: t(SUBHEADING_KEYS[period]),
  };
}

export function formatCompactSalary(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
  amount?: string | null,
  options?: { locale?: AppLocale; unspecifiedLabel?: string }
) {
  return formatCompactSalarySafe(min, max, currency, amount, {
    numberLocale: getSalaryNumberLocale(options?.locale ?? "en"),
    unspecifiedLabel: options?.unspecifiedLabel,
  });
}

const EMPLOYMENT_TYPE_KEYS: Record<string, string> = {
  FULL_TIME: "fullTime",
  PART_TIME: "partTime",
  CONTRACT: "contract",
  INTERNSHIP: "internship",
};

const WORK_MODE_KEYS: Record<string, string> = {
  REMOTE: "remote",
  HYBRID: "hybrid",
  ONSITE: "onsite",
};

function translateEnumToken(
  value: string | null | undefined,
  t: DashboardTranslate | undefined,
  keyMap: Record<string, string>
) {
  if (!value) return null;
  const token = normalizeJobEnumToken(value);
  if (t && token && keyMap[token]) {
    return t(keyMap[token]);
  }
  return normalizeEnumLabel(value);
}

export function formatJobMeta(job: DashboardJob, t?: DashboardTranslate) {
  const experienceLevel = job.experienceLevel?.trim();
  const experiencePart = experienceLevel
    ? `${experienceLevel} ${t ? t("experienceSuffix") : "exp"}`
    : null;

  const parts = [
    job.location?.trim(),
    experiencePart,
    translateEnumToken(job.employmentType, t, EMPLOYMENT_TYPE_KEYS),
    translateEnumToken(job.workMode, t, WORK_MODE_KEYS),
  ].filter(Boolean);

  return parts.join(" - ") || (t ? t("jobMetaFallback") : "Location - Experience - Employment - Work Mode");
}

export function formatRelativeDate(input: string, t?: DashboardTranslate) {
  const date = new Date(input);
  const delta = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(delta / (1000 * 60 * 60 * 24)));

  if (t) {
    if (days === 0) return t("postedToday");
    if (days === 1) return t("postedYesterday");
    if (days < 7) return t("postedDaysAgo", { days });
    if (days < 30) return t("postedWeeksAgo", { weeks: Math.floor(days / 7) });
    return t("postedMonthsAgo", { months: Math.floor(days / 30) });
  }

  if (days === 0) return "Posted today";
  if (days === 1) return "Posted yesterday";
  if (days < 7) return `Posted ${days} days ago`;
  if (days < 30) return `Posted ${Math.floor(days / 7)}w ago`;
  return `Posted ${Math.floor(days / 30)}mo ago`;
}

export function normalizeEnumLabel(value?: string | null) {
  if (!value) return null;
  return value
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function normalizeJobEnumToken(value?: string | null) {
  if (!value) return null;

  return value
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}
