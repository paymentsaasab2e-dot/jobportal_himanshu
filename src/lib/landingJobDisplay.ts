export type LandingJobLabels = {
  workRemote: string;
  workHybrid: string;
  workOnsite: string;
  typeFullTime: string;
  typePartTime: string;
  typeContract: string;
  typeInternship: string;
  salaryUnspecified: string;
  perYear: string;
  perMonth: string;
  perHour: string;
  timeJustNow: string;
  timeOneDay: string;
  timeDays: string;
  timeWeeks: string;
  timeMonths: string;
  locationUnspecified: string;
  jobTitleFallback: string;
};

function asString(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value).trim();
}

function fillCount(template: string, count: number): string {
  return template.replace('{count}', String(count));
}

export function formatLandingTimeAgo(date: Date | string, labels: LandingJobLabels): string {
  const now = new Date();
  const postedDate = typeof date === 'string' ? new Date(date) : date;
  const diffInMs = now.getTime() - postedDate.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInDays <= 0) return labels.timeJustNow;
  if (diffInDays === 1) return labels.timeOneDay;
  if (diffInDays < 7) return fillCount(labels.timeDays, diffInDays);
  if (diffInDays < 30) return fillCount(labels.timeWeeks, Math.floor(diffInDays / 7));
  return fillCount(labels.timeMonths, Math.max(1, Math.floor(diffInDays / 30)));
}

function salarySymbol(currency: string | null | undefined): string {
  const cur = asString(currency);
  if (!cur) return '$';
  const upper = cur.toUpperCase();
  if (upper === 'USD' || cur === '$') return '$';
  if (upper === 'EUR' || cur === '€') return '€';
  if (upper === 'GBP' || cur === '£') return '£';
  if (upper === 'INR' || /₹|rupee/i.test(cur)) return '₹';
  if (cur.length <= 4) return cur;
  return '';
}

export function formatLandingSalary(
  min: number | null | undefined,
  max: number | null | undefined,
  currency: string | null | undefined,
  salaryType: string | null | undefined,
  labels: LandingJobLabels,
): string {
  const typeLabel =
    salaryType === 'ANNUAL'
      ? labels.perYear
      : salaryType === 'HOURLY'
        ? labels.perHour
        : labels.perMonth;

  const toFinite = (value: unknown): number | null => {
    if (value === null || value === undefined) return null;
    const num = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(num) ? num : null;
  };

  const nMin = toFinite(min);
  const nMax = toFinite(max);
  if (nMin == null && nMax == null) return labels.salaryUnspecified;

  const sym = salarySymbol(currency);
  const formatAmount = (value: number) => value.toLocaleString();

  if (sym) {
    if (nMin != null && nMax != null) {
      return `${sym}${formatAmount(nMin)} - ${sym}${formatAmount(nMax)}${typeLabel}`;
    }
    if (nMin != null) return `${sym}${formatAmount(nMin)}+${typeLabel}`;
    return `${sym}${formatAmount(nMax!)}${typeLabel}`;
  }

  const cur = asString(currency) || '';
  if (nMin != null && nMax != null) {
    return `${formatAmount(nMin)} - ${formatAmount(nMax)} ${cur}${typeLabel}`.trim();
  }
  if (nMin != null) return `${formatAmount(nMin)}+ ${cur}${typeLabel}`.trim();
  return `${formatAmount(nMax!)} ${cur}${typeLabel}`.trim();
}

export function resolveLandingWorkStyle(
  job: Record<string, unknown>,
  labels: LandingJobLabels,
): string {
  const haystack = [
    job.workMode,
    job.workLocationType,
    job.workStyle,
    job.location,
    job.workLocation,
  ]
    .map(asString)
    .join(' ')
    .toLowerCase();

  if (haystack.includes('remote') || haystack.includes('teletravail') || haystack.includes('télétravail')) {
    return labels.workRemote;
  }
  if (haystack.includes('hybrid') || haystack.includes('hybride')) {
    return labels.workHybrid;
  }
  if (haystack.includes('onsite') || haystack.includes('on-site') || haystack.includes('on site')) {
    return labels.workOnsite;
  }
  return labels.workHybrid;
}

export function resolveLandingJobType(type: unknown, labels: LandingJobLabels): string {
  const normalized = asString(type).toUpperCase().replace(/-/g, '_');
  if (normalized === 'FULL_TIME') return labels.typeFullTime;
  if (normalized === 'PART_TIME') return labels.typePartTime;
  if (normalized === 'CONTRACT') return labels.typeContract;
  if (normalized === 'INTERNSHIP') return labels.typeInternship;
  if (normalized === 'FREELANCE') return labels.typeContract;
  return labels.typeFullTime;
}

type LandingJobLabelTranslator = ((key: string) => string) & {
  raw: (key: string) => unknown;
};

function readTimeTemplate(t: LandingJobLabelTranslator, key: string): string {
  return String(t.raw(key));
}

export function buildLandingJobLabels(t: LandingJobLabelTranslator): LandingJobLabels {
  return {
    workRemote: t('landing.jobs.workRemote'),
    workHybrid: t('landing.jobs.workHybrid'),
    workOnsite: t('landing.jobs.workOnsite'),
    typeFullTime: t('landing.jobs.typeFullTime'),
    typePartTime: t('landing.jobs.typePartTime'),
    typeContract: t('landing.jobs.typeContract'),
    typeInternship: t('landing.jobs.typeInternship'),
    salaryUnspecified: t('landing.jobs.salaryUnspecified'),
    perYear: t('landing.jobs.perYear'),
    perMonth: t('landing.jobs.perMonth'),
    perHour: t('landing.jobs.perHour'),
    timeJustNow: t('landing.jobs.timeJustNow'),
    timeOneDay: t('landing.jobs.timeOneDay'),
    timeDays: readTimeTemplate(t, 'landing.jobs.timeDays'),
    timeWeeks: readTimeTemplate(t, 'landing.jobs.timeWeeks'),
    timeMonths: readTimeTemplate(t, 'landing.jobs.timeMonths'),
    locationUnspecified: t('landing.jobs.locationUnspecified'),
    jobTitleFallback: t('landing.jobs.jobTitleFallback'),
  };
}
