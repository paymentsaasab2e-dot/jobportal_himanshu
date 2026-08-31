/**
 * Safe salary formatting for job data from Phase 1 and Phase 2.
 * Phase 2 often stores human-readable currency labels (e.g. "Rupees (₹ - India)")
 * which are NOT valid ISO 4217 codes for Intl.NumberFormat.
 */

const ISO_CURRENCY = /^[A-Z]{3}$/;

const SYMBOL_BY_ISO: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
};

function isValidIsoCurrency(code: string): boolean {
  try {
    Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(0);
    return true;
  } catch {
    return false;
  }
}

/** Map display labels / symbols to ISO code when possible. */
export function resolveIsoCurrencyCode(currency?: string | null): string | null {
  const cur = String(currency ?? '').trim();
  if (!cur) return null;

  const upper = cur.toUpperCase();
  if (ISO_CURRENCY.test(upper) && isValidIsoCurrency(upper)) {
    return upper;
  }

  // Only treat rupee/dollar labels as INR/USD when this is not already another ISO code.
  if (!ISO_CURRENCY.test(upper)) {
    if (/₹|rupee/i.test(cur)) return 'INR';
    if (/dollar|usd|\$/i.test(cur)) return 'USD';
    if (/euro|eur|€/i.test(cur)) return 'EUR';
    if (/pound|gbp|£/i.test(cur)) return 'GBP';
    if (/dirham|aed/i.test(cur)) return 'AED';
  }

  return null;
}

export function isInrCurrency(currency?: string | null): boolean {
  return resolveIsoCurrencyCode(currency) === 'INR';
}

/** Drop a leftover ₹ when the job currency is not INR (e.g. "₹ XAF 200000"). */
export function stripMismatchedRupeeMark(text: string, currency?: string | null): string {
  const raw = String(text || '').trim();
  if (!raw.includes('₹')) return raw;
  const iso = resolveIsoCurrencyCode(currency);
  if (iso === 'INR') return raw;
  if (iso && iso !== 'INR') {
    return raw.replace(/₹/g, '').replace(/\s+/g, ' ').trim();
  }
  const embedded = raw.toUpperCase().match(/\b([A-Z]{3})\b/g) || [];
  if (embedded.some((code) => code !== 'INR' && isValidIsoCurrency(code))) {
    return raw.replace(/₹/g, '').replace(/\s+/g, ' ').trim();
  }
  return raw;
}

/** Prefix symbol for compact display, or the ISO code (XAF, UGX). Never ₹ unless currency is INR. */
export function getSalaryDisplaySymbol(currency?: string | null): string | null {
  const cur = String(currency ?? '').trim();
  if (!cur) return null;

  const iso = resolveIsoCurrencyCode(cur);
  if (iso && SYMBOL_BY_ISO[iso]) return SYMBOL_BY_ISO[iso];
  if (iso) return iso;

  const upper = cur.toUpperCase();
  if (upper === 'USD' || cur === '$') return '$';
  if (upper === 'EUR' || cur === '€') return '€';
  if (upper === 'GBP' || cur === '£') return '£';
  if (ISO_CURRENCY.test(upper)) return upper;
  if (/₹|rupee/i.test(cur)) return '₹';
  if (cur.length <= 4 && /^[A-Z$€£¥]{1,4}$/i.test(cur)) return cur;

  return null;
}

function compactNumber(n: number, numberLocale = 'en-US'): string {
  return n.toLocaleString(numberLocale, { maximumFractionDigits: 0, notation: 'compact' });
}

function formatAmountWithCurrency(
  value: number,
  currency: string | null,
  numberLocale: string,
  compact: boolean,
): string {
  const formatted = compact
    ? compactNumber(value, numberLocale)
    : value.toLocaleString(numberLocale, { maximumFractionDigits: 0 });
  const iso = resolveIsoCurrencyCode(currency);
  const sym = getSalaryDisplaySymbol(currency);
  if (iso && SYMBOL_BY_ISO[iso] && sym) return `${sym}${formatted}`;
  if (iso) return `${iso} ${formatted}`;
  if (sym) return `${sym}${formatted}`;
  if (currency) return `${currency} ${formatted}`;
  return formatted;
}

/**
 * Compact salary for dashboard cards. Never throws on invalid currency strings.
 */
export function formatCompactSalarySafe(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
  amount?: string | null,
  options?: { numberLocale?: string; unspecifiedLabel?: string },
): string {
  const numberLocale = options?.numberLocale ?? 'en-US';
  const unspecifiedLabel = options?.unspecifiedLabel ?? 'Salary not specified';
  const cur = String(currency ?? '').trim() || null;
  const amountStr = stripMismatchedRupeeMark(String(amount ?? '').trim(), cur) || null;

  if (amountStr) {
    const amountUpper = amountStr.toUpperCase();
    const curUpper = (cur || '').toUpperCase();
    if (cur && (amountUpper.includes(curUpper) || (isInrCurrency(cur) && amountStr.includes('₹')))) {
      return amountStr;
    }
    return cur ? `${amountStr} · ${cur}` : amountStr;
  }

  const nMin = typeof min === 'number' && Number.isFinite(min) ? min : null;
  const nMax = typeof max === 'number' && Number.isFinite(max) ? max : null;

  if (nMin == null && nMax == null) return unspecifiedLabel;

  if (nMin != null && nMax != null) {
    return `${formatAmountWithCurrency(nMin, cur, numberLocale, true)} - ${formatAmountWithCurrency(nMax, cur, numberLocale, true)}`;
  }
  if (nMin != null) return `${formatAmountWithCurrency(nMin, cur, numberLocale, true)}+`;
  return formatAmountWithCurrency(nMax ?? 0, cur, numberLocale, true);
}

/** Public job / Phase 1 chip label, e.g. `XAF 200000` (never prefixes ₹ unless currency is INR). */
export function formatPublicSalaryLabel(input: {
  currency?: string | null;
  min?: number | null;
  max?: number | null;
  amount?: string | null;
  fallback?: string | null;
}): string | null {
  const currency = String(input.currency || '').trim() || null;
  const min = typeof input.min === 'number' && Number.isFinite(input.min) ? input.min : null;
  const max = typeof input.max === 'number' && Number.isFinite(input.max) ? input.max : null;
  if (min != null && max != null) {
    return `${formatAmountWithCurrency(min, currency, 'en-US', false)} - ${formatAmountWithCurrency(max, currency, 'en-US', false)}`;
  }
  if (min != null) return formatAmountWithCurrency(min, currency, 'en-US', false);
  if (max != null) return `Up to ${formatAmountWithCurrency(max, currency, 'en-US', false)}`;

  const amount = stripMismatchedRupeeMark(String(input.amount || '').trim(), currency);
  if (amount) return amount;
  const fallback = stripMismatchedRupeeMark(String(input.fallback || '').trim(), currency);
  return fallback || null;
}
