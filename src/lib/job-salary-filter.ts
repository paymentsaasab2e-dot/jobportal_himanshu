import { resolveIsoCurrencyCode } from '@/lib/format-salary';

export const SALARY_FILTER_CURRENCIES = [
  'INR',
  'USD',
  'EUR',
  'GBP',
  'AED',
  'CAD',
  'AUD',
  'SGD',
  'JPY',
  'CNY',
] as const;

export type JobSalaryBounds = {
  min: number | null;
  max: number | null;
  currency: string | null;
};

export function toFiniteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : null;
}

export function parseSalaryFromDisplayString(salaryStr: string): JobSalaryBounds | null {
  const lower = salaryStr.toLowerCase();
  const numbers = lower.replace(/,/g, '').match(/(\d+(\.\d+)?)/g);
  if (!numbers?.length) return null;

  let factor = 1;
  if (lower.includes('lakh')) factor = 100000;
  else if (lower.includes('crore')) factor = 10000000;
  else if (/\d+k\b/.test(lower)) factor = 1000;

  const vals = numbers.map((n) => parseFloat(n) * factor);
  const min = vals[0] ?? null;
  const max = vals.length > 1 ? vals[vals.length - 1] : lower.includes('+') ? null : min;

  let currency: string | null = null;
  if (/₹|rupee|inr|lakh|crore/i.test(salaryStr)) currency = 'INR';
  else if (/\$|usd|dollar/i.test(salaryStr)) currency = 'USD';
  else if (/€|eur|euro/i.test(salaryStr)) currency = 'EUR';
  else if (/£|gbp|pound/i.test(salaryStr)) currency = 'GBP';
  else if (/aed|dirham/i.test(salaryStr)) currency = 'AED';

  return {
    min,
    max: max ?? min,
    currency: currency ? resolveIsoCurrencyCode(currency) : null,
  };
}

export function getJobSalaryBounds(job: {
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  salary?: string;
}): JobSalaryBounds | null {
  const min = toFiniteNumber(job.salaryMin);
  const max = toFiniteNumber(job.salaryMax);
  const currency =
    resolveIsoCurrencyCode(job.salaryCurrency) ||
    (job.salaryCurrency ? String(job.salaryCurrency).trim().toUpperCase() : null);

  if (min != null || max != null) {
    return { min, max: max ?? min, currency };
  }

  if (job.salary?.trim()) {
    return parseSalaryFromDisplayString(job.salary);
  }

  return null;
}

function normalizeCurrencyCode(currency: string | null | undefined): string | null {
  if (!currency) return null;
  return resolveIsoCurrencyCode(currency) || String(currency).trim().toUpperCase();
}

export function currenciesMatch(
  jobCurrency: string | null,
  filterCurrency: string,
): boolean {
  const jobIso = normalizeCurrencyCode(jobCurrency);
  const filterIso = normalizeCurrencyCode(filterCurrency);
  if (!jobIso) return true;
  if (!filterIso) return true;
  return jobIso === filterIso;
}

/** True when job salary range overlaps [filterMin, filterMax] in the selected currency. */
export function jobMatchesSalaryFilter(
  job: {
    salaryMin?: number | null;
    salaryMax?: number | null;
    salaryCurrency?: string | null;
    salary?: string;
  },
  filterCurrency: string,
  filterMin: number | null,
  filterMax: number | null,
): boolean {
  const bounds = getJobSalaryBounds(job);
  if (!bounds) return false;

  if (!currenciesMatch(bounds.currency, filterCurrency)) return false;

  const jobMin = bounds.min ?? 0;
  const jobMax = bounds.max ?? bounds.min ?? Number.POSITIVE_INFINITY;
  const rangeMin = filterMin ?? 0;
  const rangeMax = filterMax ?? Number.POSITIVE_INFINITY;

  return jobMin <= rangeMax && jobMax >= rangeMin;
}

export function isSalaryFilterActive(filterMin: string, filterMax: string): boolean {
  return filterMin.trim() !== '' || filterMax.trim() !== '';
}

export function parseSalaryFilterInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed.replace(/,/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}
