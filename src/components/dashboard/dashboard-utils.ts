import type { DashboardCourse, DashboardData, DashboardJob } from "./dashboard-types";
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

export type UploadedLmsCourse = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  level?: string;
  thumbnailUrl?: string | null;
  instructorName?: string | null;
  estimatedHours?: number;
  duration?: string;
  tags?: string[];
  goalMatch?: boolean;
  focusReason?: string;
};

const COURSE_STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "your",
  "from",
  "into",
  "that",
  "this",
  "skill",
  "skills",
  "course",
  "role",
  "next",
]);

function formatCourseDuration(hours?: number, fallback?: string) {
  const trimmed = String(fallback || "").trim();
  if (trimmed) return trimmed;
  const n = Number(hours) || 0;
  if (n <= 0) return "";
  if (n < 1) return `${Math.max(1, Math.round(n * 60))}m`;
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  if (m <= 0) return `${h}h`;
  return `${h}h ${m}m`;
}

function formatCourseLevel(level?: string) {
  const raw = String(level || "").trim();
  if (!raw) return "Beginner";
  return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
}

function tokenizeForCourseMatch(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#]+/i)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && !COURSE_STOP_WORDS.has(part));
}

export function collectProfileSkillNames(
  dashboardData: DashboardData | null,
  snapshot?: Record<string, unknown> | null,
): string[] {
  const names: string[] = [];
  for (const skill of dashboardData?.topSkills || []) {
    if (skill?.name?.trim()) names.push(skill.name.trim());
  }
  const raw = snapshot?.skills;
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string" && item.trim()) names.push(item.trim());
      else if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        const label = [row.name, row.skill, row.skillName, row.title].find(
          (value) => typeof value === "string" && value.trim(),
        ) as string | undefined;
        if (label) names.push(label.trim());
      }
    }
  }
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const name of names) {
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(name);
  }
  return unique;
}

export function rankUploadedCoursesForProfile(
  courses: UploadedLmsCourse[],
  options: {
    skills: string[];
    jobs: DashboardJob[];
    translate: DashboardTranslate;
    limit?: number;
  },
): DashboardCourse[] {
  const limit = options.limit ?? 3;
  const skills = options.skills.filter(Boolean);
  const skillNeedles = skills.map((skill) => skill.toLowerCase());
  const jobTitles = options.jobs.map((job) => job.title).filter(Boolean);
  const jobTokens = new Set(jobTitles.flatMap((title) => tokenizeForCourseMatch(title)));
  const targetRole = jobTitles[0] || options.translate("yourNextRole");

  const scored = courses
    .filter((course) => String(course.id || "").trim() && String(course.title || "").trim())
    .map((course) => {
      const title = String(course.title || "").trim();
      const hay = [
        title,
        course.description,
        course.category,
        ...(Array.isArray(course.tags) ? course.tags : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      const tags = (Array.isArray(course.tags) ? course.tags : []).map((tag) =>
        String(tag).toLowerCase(),
      );

      let score = 0;
      let matchedSkill = "";
      for (const skill of skills) {
        const needle = skill.toLowerCase();
        if (!needle) continue;
        if (tags.some((tag) => tag === needle || tag.includes(needle) || needle.includes(tag))) {
          score += 6;
          if (!matchedSkill) matchedSkill = skill;
        } else if (hay.includes(needle)) {
          score += 4;
          if (!matchedSkill) matchedSkill = skill;
        }
      }

      const titleTokens = tokenizeForCourseMatch(title);
      const jobOverlap = titleTokens.filter((token) => jobTokens.has(token)).length;
      if (jobOverlap > 0) score += Math.min(4, jobOverlap * 2);
      if (course.goalMatch) score += 3;
      if (course.focusReason) score += 2;

      let reasonLabel = options.translate("reasonMatchesProfile");
      if (matchedSkill) {
        reasonLabel = options.translate("reasonMatchesSkill", { skill: matchedSkill });
      } else if (jobOverlap > 0) {
        reasonLabel = options.translate("reasonRequiredFor", { role: targetRole });
      } else if (
        /resume|cv|profile|interview|communication/i.test(hay)
      ) {
        reasonLabel = options.translate("reasonBoostsConfidence");
      } else if (course.focusReason) {
        reasonLabel = course.focusReason;
      }

      const mapped: DashboardCourse = {
        id: String(course.id),
        title,
        provider: String(course.instructorName || course.category || "HR Yantra").trim() || "HR Yantra",
        duration: formatCourseDuration(course.estimatedHours, course.duration),
        level: formatCourseLevel(course.level),
        imageUrl: course.thumbnailUrl || undefined,
        reasonLabel,
      };

      return { mapped, score };
    })
    .sort((a, b) => b.score - a.score);

  const matched = scored.filter((row) => row.score > 0).slice(0, limit);
  if (matched.length >= limit) return matched.map((row) => row.mapped);
  const rest = scored.filter((row) => row.score <= 0).slice(0, limit - matched.length);
  return [...matched, ...rest].map((row) => row.mapped);
}

function normalizeJobEnumToken(value?: string | null) {
  if (!value) return null;

  return value
    .trim()
    .replace(/[\s-]+/g, "_")
    .toUpperCase();
}
