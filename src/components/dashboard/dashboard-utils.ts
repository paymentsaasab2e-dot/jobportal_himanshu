import type { DashboardData, DashboardJob } from "./dashboard-types";

const DAY_MESSAGES = {
  morning: "Good morning",
  afternoon: "Good afternoon",
  evening: "Good evening",
  night: "Let's find your next role",
} as const;

export function getDashboardName(profile?: DashboardData["profile"] | null) {
  const fullName = profile?.fullName?.trim();
  if (fullName) return fullName.split(/\s+/)[0] ?? "there";

  const whatsappNumber = profile?.whatsappNumber?.replace(/\D/g, "");
  if (whatsappNumber && whatsappNumber.length >= 4) {
    return `...${whatsappNumber.slice(-4)}`;
  }

  return "there";
}

function getMatchesEyebrow(totalMatchedJobs: number) {
  return `${totalMatchedJobs} fresh matches today`;
}

export function getDynamicGreeting(name: string, totalMatchedJobs = 0) {
  const eyebrow = getMatchesEyebrow(Math.max(0, totalMatchedJobs));
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) {
    return {
      eyebrow,
      heading: `${DAY_MESSAGES.morning}, ${name}`,
      subheading: "Your strongest opportunities, profile progress, and upskilling moves are lined up for today.",
    };
  }

  if (hour >= 12 && hour < 17) {
    return {
      eyebrow,
      heading: `${DAY_MESSAGES.afternoon}, ${name}`,
      subheading: "Keep the momentum going with sharper matches, faster actions, and stronger profile health.",
    };
  }

  if (hour >= 17 && hour < 22) {
    return {
      eyebrow,
      heading: `${DAY_MESSAGES.evening}, ${name}`,
      subheading: "This is a great window to apply, save strong roles, and close your remaining profile gaps.",
    };
  }

  return {
    eyebrow,
    heading: `${DAY_MESSAGES.night}, ${name}`,
    subheading: "Your dashboard is ready with the next roles, learning paths, and profile prompts worth attention.",
  };
}

export function formatCompactSalary(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
  amount?: string | null
) {
  if (amount) return amount;
  if (!min && !max) return "Salary not specified";

  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency || "USD",
    maximumFractionDigits: 0,
    notation: "compact",
  });

  if (min && max) {
    return `${formatter.format(min)} - ${formatter.format(max)}`;
  }

  if (min) return `${formatter.format(min)}+`;
  return formatter.format(max || 0);
}

export function formatJobMeta(job: DashboardJob) {
  const parts = [
    job.location?.trim(),
    job.experienceLevel ? `${job.experienceLevel} exp` : null,
    normalizeEnumLabel(job.employmentType),
    normalizeEnumLabel(job.workMode),
  ].filter(Boolean);

  return parts.join(" - ") || "Location - Experience - Employment - Work Mode";
}

export function formatRelativeDate(input: string) {
  const date = new Date(input);
  const delta = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(delta / (1000 * 60 * 60 * 24)));

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
