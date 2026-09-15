/**
 * Safe salary formatting for job data from Phase 1 and Phase 2.
 * Phase 2 often stores human-readable currency labels (e.g. "Rupees (₹ - India)")
 * which are NOT valid ISO 4217 codes for Intl.NumberFormat.
 * Prefer salary.currencySymbol (persisted from create-job Symbol field) when present.
 *
 * Display rule: never show ISO currency codes (USD, INR, …) in UI — symbols only.
 */

const ISO_CURRENCY = /^[A-Z]{3}$/;

const SYMBOL_BY_ISO: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AUD: 'A$',
  CAD: 'C$',
  SGD: 'S$',
  HKD: 'HK$',
  NZD: 'NZ$',
  AED: 'د.إ',
  CHF: 'CHF',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
  ZAR: 'R',
  MXN: 'Mex$',
  BRL: 'R$',
  KRW: '₩',
  THB: '฿',
  PHP: '₱',
  MYR: 'RM',
  IDR: 'Rp',
  VND: '₫',
  TRY: '₺',
  RUB: '₽',
  PLN: 'zł',
  XAF: 'Fr',
  XOF: 'Fr',
  CFA: 'Fr',
  CHF: 'Fr.',
};

const ISO_CURRENCY_SYMBOL_CACHE = new Map<string, string>();

function isValidIsoCurrency(code: string): boolean {
  try {
    Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(0);
    return true;
  } catch {
    return false;
  }
}

function resolveIntlCurrencySymbol(code: string): string {
  const key = code.toUpperCase();
  if (ISO_CURRENCY_SYMBOL_CACHE.has(key)) {
    return ISO_CURRENCY_SYMBOL_CACHE.get(key) || '';
  }
  let symbol = '';
  try {
    const parts = new Intl.NumberFormat('en', {
      style: 'currency',
      currency: key,
      currencyDisplay: 'narrowSymbol',
    }).formatToParts(0);
    symbol = parts.find((part) => part.type === 'currency')?.value?.trim() || '';
    if (symbol.toUpperCase() === key) {
      const altParts = new Intl.NumberFormat('en', {
        style: 'currency',
        currency: key,
        currencyDisplay: 'symbol',
      }).formatToParts(0);
      const alt = altParts.find((part) => part.type === 'currency')?.value?.trim() || '';
      symbol = alt.toUpperCase() === key ? '' : alt;
    }
  } catch {
    symbol = '';
  }
  if (!symbol || symbol.toUpperCase() === key) {
    symbol = SYMBOL_BY_ISO[key] || '';
  }
  if (symbol.toUpperCase() === key) symbol = '';
  ISO_CURRENCY_SYMBOL_CACHE.set(key, symbol);
  return symbol;
}

/** Map display labels / symbols to ISO code when possible. */
export function resolveIsoCurrencyCode(currency?: string | null): string | null {
  const cur = String(currency ?? '').trim();
  if (!cur) return null;

  const upper = cur.toUpperCase();
  if (upper === 'CFA') return 'XAF';
  if (ISO_CURRENCY.test(upper) && isValidIsoCurrency(upper)) {
    return upper;
  }

  // Only treat rupee/dollar labels as INR/USD when this is not already another ISO code.
  if (!ISO_CURRENCY.test(upper)) {
    if (/cfa/i.test(cur)) return 'XAF';
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

/** Remove leading ISO currency codes from legacy salary strings. */
export function stripLeadingCurrencyCode(text: string, currency?: string | null): string {
  let next = String(text || '').trim();
  if (!next) return '';
  const iso = resolveIsoCurrencyCode(currency);
  if (iso) {
    next = next.replace(new RegExp(`^${iso}\\s*`, 'i'), '').trim();
  }
  next = next.replace(/^[A-Z]{3}\s+(?=\d)/, '').trim();
  return next;
}

function joinSymbolAmount(sym: string, formatted: string): string {
  const clean = String(sym || '').trim();
  if (!clean) return formatted;
  // Never treat an ISO-like token as a display symbol.
  if (/^[A-Z]{2,5}$/.test(clean)) return formatted;
  if (clean.length > 1) return `${clean} ${formatted}`;
  return `${clean}${formatted}`;
}

/**
 * Prefix symbol for compact display.
 * Prefer explicit currencySymbol from Phase 2 job salary (Symbol field).
 * Never returns an ISO currency code.
 */
export function getSalaryDisplaySymbol(
  currency?: string | null,
  currencySymbol?: string | null,
): string | null {
  const stored = String(currencySymbol ?? '').trim();
  if (stored && !/^[A-Z]{2,5}$/.test(stored)) return stored;

  const cur = String(currency ?? '').trim();
  if (!cur) return null;

  const upper = cur.toUpperCase();
  if (upper === 'CFA') return 'Fr';

  const iso = resolveIsoCurrencyCode(cur);
  if (iso && SYMBOL_BY_ISO[iso]) return SYMBOL_BY_ISO[iso];
  if (iso) {
    const intlSym = resolveIntlCurrencySymbol(iso);
    if (intlSym) return intlSym;
  }

  if (upper === 'USD' || cur === '$') return '$';
  if (upper === 'EUR' || cur === '€') return '€';
  if (upper === 'GBP' || cur === '£') return '£';
  if (ISO_CURRENCY.test(upper)) {
    const intlSym = resolveIntlCurrencySymbol(upper);
    return intlSym || null;
  }
  if (/₹|rupee/i.test(cur)) return '₹';
  if (cur.length <= 4 && /^[A-Z$€£¥₣]{1,4}$/i.test(cur) && !/^[A-Z]{2,5}$/.test(cur)) return cur;

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
  currencySymbol?: string | null,
): string {
  const formatted = compact
    ? compactNumber(value, numberLocale)
    : value.toLocaleString(numberLocale, { maximumFractionDigits: 0 });
  const sym = getSalaryDisplaySymbol(currency, currencySymbol);
  if (sym) return joinSymbolAmount(sym, formatted);
  return formatted;
}

/**
 * Compact salary for dashboard cards. Never throws on invalid currency strings.
 * Never appends ISO currency codes.
 */
export function formatCompactSalarySafe(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
  amount?: string | null,
  options?: {
    numberLocale?: string;
    unspecifiedLabel?: string;
    currencySymbol?: string | null;
  },
): string {
  const numberLocale = options?.numberLocale ?? 'en-US';
  const unspecifiedLabel = options?.unspecifiedLabel ?? 'Salary not specified';
  const cur = String(currency ?? '').trim() || null;
  const currencySymbol = options?.currencySymbol ?? null;
  const amountStr =
    stripLeadingCurrencyCode(
      stripMismatchedRupeeMark(String(amount ?? '').trim(), cur),
      cur,
    ) || null;

  if (amountStr) {
    const amountUpper = amountStr.toUpperCase();
    const sym = getSalaryDisplaySymbol(cur, currencySymbol);
    if (sym && !amountUpper.includes(sym.toUpperCase())) {
      return joinSymbolAmount(sym, amountStr);
    }
    return amountStr;
  }

  const nMin = typeof min === 'number' && Number.isFinite(min) ? min : null;
  const nMax = typeof max === 'number' && Number.isFinite(max) ? max : null;

  if (nMin == null && nMax == null) return unspecifiedLabel;

  if (nMin != null && nMax != null) {
    return `${formatAmountWithCurrency(nMin, cur, numberLocale, true, currencySymbol)} - ${formatAmountWithCurrency(nMax, cur, numberLocale, true, currencySymbol)}`;
  }
  if (nMin != null) return `${formatAmountWithCurrency(nMin, cur, numberLocale, true, currencySymbol)}+`;
  return formatAmountWithCurrency(nMax ?? 0, cur, numberLocale, true, currencySymbol);
}

/** Public job / Phase 1 chip label, e.g. `Fr 200,000` (uses stored currencySymbol when present). */
export function formatPublicSalaryLabel(input: {
  currency?: string | null;
  currencySymbol?: string | null;
  min?: number | null;
  max?: number | null;
  amount?: string | null;
  fallback?: string | null;
}): string | null {
  const currency = String(input.currency || '').trim() || null;
  const currencySymbol = String(input.currencySymbol || '').trim() || null;
  const min = typeof input.min === 'number' && Number.isFinite(input.min) ? input.min : null;
  const max = typeof input.max === 'number' && Number.isFinite(input.max) ? input.max : null;
  if (min != null && max != null) {
    return `${formatAmountWithCurrency(min, currency, 'en-US', false, currencySymbol)} - ${formatAmountWithCurrency(max, currency, 'en-US', false, currencySymbol)}`;
  }
  if (min != null) return formatAmountWithCurrency(min, currency, 'en-US', false, currencySymbol);
  if (max != null) return `Up to ${formatAmountWithCurrency(max, currency, 'en-US', false, currencySymbol)}`;

  const amount = stripLeadingCurrencyCode(
    stripMismatchedRupeeMark(String(input.amount || '').trim(), currency),
    currency,
  );
  if (amount) {
    const sym = getSalaryDisplaySymbol(currency, currencySymbol);
    if (sym && !amount.toUpperCase().includes(sym.toUpperCase())) {
      return joinSymbolAmount(sym, amount);
    }
    return amount;
  }
  const fallback = stripLeadingCurrencyCode(
    stripMismatchedRupeeMark(String(input.fallback || '').trim(), currency),
    currency,
  );
  return fallback || null;
}
