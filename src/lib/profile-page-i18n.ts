import type { useTranslations } from 'next-intl';

type T = ReturnType<typeof useTranslations>;

const EMPLOYMENT_KEYS: Record<string, string> = {
  student: 'employmentStudent',
  employed: 'employmentEmployed',
  'self-employed': 'employmentSelfEmployed',
  unemployed: 'employmentUnemployed',
  freelancer: 'employmentFreelancer',
  intern: 'employmentIntern',
};

const GENDER_KEYS: Record<string, string> = {
  male: 'genderMale',
  female: 'genderFemale',
  other: 'genderOther',
  'prefer not to say': 'genderPreferNot',
};

const WORK_MODE_KEYS: Record<string, string> = {
  'full-time': 'workModeFullTime',
  'part-time': 'workModePartTime',
  contract: 'workModeContract',
  internship: 'workModeInternship',
  freelance: 'workModeFreelance',
  remote: 'workModeRemote',
  hybrid: 'workModeHybrid',
  onsite: 'workModeOnsite',
  'on-site': 'workModeOnsite',
};

const PROFICIENCY_KEYS: Record<string, string> = {
  beginner: 'proficiencyBeginner',
  intermediate: 'proficiencyIntermediate',
  advanced: 'proficiencyAdvanced',
  expert: 'proficiencyExpert',
  native: 'proficiencyNative',
};

const SKILL_CATEGORY_KEYS: Record<string, string> = {
  'Hard Skills': 'skillCatHard',
  'Soft Skills': 'skillCatSoft',
  'Tools / Technologies': 'skillCatTools',
};

const LANGUAGE_MODE_KEYS: Record<string, string> = {
  speak: 'langSpeak',
  read: 'langRead',
  write: 'langWrite',
};

export function translateProfileEnum(
  t: T,
  map: Record<string, string>,
  value: string | null | undefined,
): string {
  if (!value) return '—';
  const key = map[value.trim().toLowerCase()] || map[value.trim()];
  if (key) {
    try {
      return t(`enums.${key}`);
    } catch {
      return value;
    }
  }
  return value
    .split(/[_-]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function translateEmployment(t: T, value: string | null | undefined) {
  return translateProfileEnum(t, EMPLOYMENT_KEYS, value);
}

export function translateGender(t: T, value: string | null | undefined) {
  return translateProfileEnum(t, GENDER_KEYS, value);
}

export function translateWorkMode(t: T, value: string | null | undefined) {
  return translateProfileEnum(t, WORK_MODE_KEYS, value);
}

export function translateProficiency(t: T, value: string | null | undefined) {
  return translateProfileEnum(t, PROFICIENCY_KEYS, value);
}

export function translateSkillCategory(t: T, category: string) {
  const key = SKILL_CATEGORY_KEYS[category];
  if (key) {
    try {
      return t(`enums.${key}`);
    } catch {
      return category;
    }
  }
  return category;
}

export function translateLanguageMode(t: T, mode: string) {
  const key = LANGUAGE_MODE_KEYS[mode.trim().toLowerCase()];
  if (key) {
    try {
      return t(`enums.${key}`);
    } catch {
      return mode;
    }
  }
  return mode;
}

export function profileSectionTitle(
  tSections: ReturnType<typeof useTranslations>,
  slug: string,
  fallback: string,
) {
  try {
    return tSections(slug as never);
  } catch {
    return fallback;
  }
}

export function resolveProfileDateLocale(locale: string) {
  return locale === 'fr' ? 'fr-FR' : 'en-US';
}

export function formatProfileDate(
  locale: string,
  value?: string | null,
  options?: Intl.DateTimeFormatOptions,
) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(resolveProfileDateLocale(locale), {
    month: 'short',
    year: 'numeric',
    ...options,
  });
}

export function formatProfileMonthYear(
  locale: string,
  year: string,
  month: string,
): string {
  const y = String(year || '').trim();
  const m = parseInt(String(month || '').trim(), 10);
  if (!y) return '';
  if (m >= 1 && m <= 12) {
    const date = new Date(Number(y), m - 1, 1);
    const monthName = date.toLocaleDateString(resolveProfileDateLocale(locale), {
      month: 'long',
    });
    const label = monthName.charAt(0).toUpperCase() + monthName.slice(1);
    return `${label} ${y}`;
  }
  return y;
}

const PROJECT_TYPE_KEYS: Record<string, string> = {
  startup: 'startup',
  website: 'website',
  institution: 'institution',
  system: 'system',
  completed: 'completed',
};

export function translateProjectType(t: T, value: string | null | undefined) {
  if (!value) return value;
  const key = PROJECT_TYPE_KEYS[value.trim().toLowerCase()];
  if (!key) return value;
  try {
    return t(`projectTypes.${key}`);
  } catch {
    return value;
  }
}

export function formatProfileDateRange(
  locale: string,
  presentLabel: string,
  start?: string,
  end?: string,
  current?: boolean,
) {
  const a = formatProfileDate(locale, start);
  const b = current ? presentLabel : formatProfileDate(locale, end);
  return `${a} – ${b}`;
}
