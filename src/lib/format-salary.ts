/**
 * Safe salary formatting for job data from Phase 1 and Phase 2.
 * Phase 2 often stores human-readable currency labels (e.g. "Rupees (₹ - India)")
 * which are NOT valid ISO 4217 codes for Intl.NumberFormat.
 * Prefer salary.currencySymbol (persisted from create-job Symbol field) when present.
 */

const ISO_CURRENCY = /^[A-Z]{3}$/;

const SYMBOL_BY_ISO: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  XAF: 'Fr',
  XOF: 'Fr',
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

function joinSymbolAmount(sym: string, formatted: string): string {
  const clean = String(sym || '').trim();
  if (!clean) return formatted;
  if (/^[A-Z]{2,5}$/i.test(clean) && clean.length >= 2) {
    return `${clean.toUpperCase()} ${formatted}`;
  }
  if (clean.length > 1) return `${clean} ${formatted}`;
  return `${clean}${formatted}`;
}

/**
 * Prefix symbol for compact display, or the ISO/code.
 * Prefer explicit currencySymbol from Phase 2 job salary (Symbol field).
 */
export function getSalaryDisplaySymbol(
  currency?: string | null,
  currencySymbol?: string | null,
): string | null {
  const stored = String(currencySymbol ?? '').trim();
  if (stored) return stored;

  const cur = String(currency ?? '').trim();
  if (!cur) return null;

  const upper = cur.toUpperCase();
  if (upper === 'CFA') return 'Fr';

  const iso = resolveIsoCurrencyCode(cur);
  if (iso && SYMBOL_BY_ISO[iso]) return SYMBOL_BY_ISO[iso];
  if (iso) {
    const intlSym = resolveIntlCurrencySymbol(iso);
    if (intlSym) return intlSym;
    return iso;
  }

  if (upper === 'USD' || cur === '$') return '$';
  if (upper === 'EUR' || cur === '€') return '€';
  if (upper === 'GBP' || cur === '£') return '£';
  if (ISO_CURRENCY.test(upper)) {
    const intlSym = resolveIntlCurrencySymbol(upper);
    return intlSym || upper;
  }
  if (/₹|rupee/i.test(cur)) return '₹';
  if (cur.length <= 4 && /^[A-Z$€£¥₣]{1,4}$/i.test(cur)) return cur;

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
  const iso = resolveIsoCurrencyCode(currency);
  const sym = getSalaryDisplaySymbol(currency, currencySymbol);
  if (sym && sym.toUpperCase() !== String(currency || '').trim().toUpperCase()) {
    return joinSymbolAmount(sym, formatted);
  }
  if (iso) return `${iso} ${formatted}`;
  if (sym) return joinSymbolAmount(sym, formatted);
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
  const amountStr = stripMismatchedRupeeMark(String(amount ?? '').trim(), cur) || null;

  if (amountStr) {
    const amountUpper = amountStr.toUpperCase();
    const curUpper = (cur || '').toUpperCase();
    if (cur && (amountUpper.includes(curUpper) || (isInrCurrency(cur) && amountStr.includes('₹')))) {
      return amountStr;
    }
    const sym = getSalaryDisplaySymbol(cur, currencySymbol);
    if (sym && !amountUpper.includes(sym.toUpperCase())) {
      return joinSymbolAmount(sym, amountStr);
    }
    return cur ? `${amountStr} · ${cur}` : amountStr;
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

  const amount = stripMismatchedRupeeMark(String(input.amount || '').trim(), currency);
  if (amount) {
    const sym = getSalaryDisplaySymbol(currency, currencySymbol);
    if (sym && !amount.toUpperCase().includes(sym.toUpperCase())) {
      return joinSymbolAmount(sym, amount);
    }
    return amount;
  }
  const fallback = stripMismatchedRupeeMark(String(input.fallback || '').trim(), currency);
  return fallback || null;
}
