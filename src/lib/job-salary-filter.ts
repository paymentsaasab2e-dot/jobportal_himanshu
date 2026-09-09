import { resolveIsoCurrencyCode } from '@/lib/format-salary';

/** Common currencies shown first in the salary filter dropdown. */
const SALARY_FILTER_CURRENCY_PRIORITY = [
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
  'CHF',
  'HKD',
  'NZD',
  'ZAR',
  'SAR',
  'MYR',
  'THB',
  'TRY',
  'BRL',
  'MXN',
  'KRW',
  'SEK',
  'NOK',
  'DKK',
  'PLN',
  'IDR',
  'PHP',
  'PKR',
  'BDT',
  'QAR',
  'OMR',
  'KWD',
  'BHD',
  'ILS',
  'NGN',
  'KES',
  'GHS',
  'EGP',
  'LKR',
  'NPR',
  'VND',
  'ARS',
  'CLP',
  'COP',
  'XAF',
  'XOF',
] as const;

/**
 * All ISO 4217 currencies for the explore-jobs salary filter.
 * Prefer Intl.supportedValuesOf when available; otherwise use the priority list.
 */
function buildSalaryFilterCurrencies(): string[] {
  const collected = new Set<string>(SALARY_FILTER_CURRENCY_PRIORITY);

  try {
    const supportedValuesOf = (
      Intl as unknown as { supportedValuesOf?: (key: string) => string[] }
    ).supportedValuesOf;
    if (typeof supportedValuesOf === 'function') {
      for (const code of supportedValuesOf.call(Intl, 'currency')) {
        const normalized = String(code || '')
          .trim()
          .toUpperCase();
        if (/^[A-Z]{3}$/.test(normalized)) collected.add(normalized);
      }
    }
  } catch {
    // Keep fallback priority list
  }

  const priority = SALARY_FILTER_CURRENCY_PRIORITY.filter((code) => collected.has(code));
  const rest = [...collected]
    .filter((code) => !priority.includes(code as (typeof SALARY_FILTER_CURRENCY_PRIORITY)[number]))
    .sort((a, b) => a.localeCompare(b));

  return [...priority, ...rest];
}

export const SALARY_FILTER_CURRENCIES = buildSalaryFilterCurrencies();

/**
 * Normalize a Phase 2 / job-posting currency value to a short code for the filter.
 * Accepts ISO codes, display labels (e.g. "Rupees (₹ - India)"), and custom 2–5 letter codes.
 */
export function normalizeSalaryFilterCurrencyCode(raw?: string | null): string | null {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;

  const iso = resolveIsoCurrencyCode(trimmed);
  if (iso) return iso;

  const upper = trimmed.toUpperCase();
  if (/^[A-Z]{2,5}$/.test(upper)) return upper;

  const fromParens = upper.match(/\(([A-Z]{2,5})\)/);
  if (fromParens?.[1]) {
    return resolveIsoCurrencyCode(fromParens[1]) || fromParens[1];
  }

  return null;
}

/** Unique currencies used on posted jobs (Phase 2 salary range), no duplicates. */
export function collectJobPostedCurrencies(
  jobs: Array<{
    salaryCurrency?: string | null;
    salary?: string | null;
  }>,
): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  const push = (raw?: string | null) => {
    const code = normalizeSalaryFilterCurrencyCode(raw);
    if (!code || seen.has(code)) return;
    seen.add(code);
    out.push(code);
  };

  for (const job of jobs) {
    push(job.salaryCurrency);
    if (job.salary?.trim()) {
      push(parseSalaryFromDisplayString(job.salary)?.currency);
    }
  }

  return out.sort((a, b) => a.localeCompare(b));
}

/**
 * Base ISO list + currencies from live job postings (recruiter-added / custom), deduped.
 * Posted currencies not already in the base list are inserted after the priority block.
 */
export function mergeSalaryFilterCurrencyOptions(
  baseCurrencies: string[] = SALARY_FILTER_CURRENCIES,
  postedCurrencies: string[] = [],
): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  const push = (raw?: string | null) => {
    const code = normalizeSalaryFilterCurrencyCode(raw);
    if (!code || seen.has(code)) return;
    seen.add(code);
    merged.push(code);
  };

  const prioritySet = new Set<string>(SALARY_FILTER_CURRENCY_PRIORITY);
  const base = baseCurrencies.map((c) => normalizeSalaryFilterCurrencyCode(c)).filter(Boolean) as string[];
  const posted = postedCurrencies
    .map((c) => normalizeSalaryFilterCurrencyCode(c))
    .filter(Boolean) as string[];

  for (const code of SALARY_FILTER_CURRENCY_PRIORITY) {
    if (base.includes(code) || posted.includes(code)) push(code);
  }

  // Recruiter / job-posted currencies next (so custom codes are easy to find)
  for (const code of posted) {
    if (!prioritySet.has(code)) push(code);
  }

  for (const code of base) {
    if (!prioritySet.has(code)) push(code);
  }

  return merged;
}

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
