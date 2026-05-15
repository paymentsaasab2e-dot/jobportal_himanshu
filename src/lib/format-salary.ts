/**
 * Safe salary formatting for job data from Phase 1 and Phase 2.
 * Phase 2 often stores human-readable currency labels (e.g. "Rupees (₹ - India)")
 * which are NOT valid ISO 4217 codes for Intl.NumberFormat.
 */

const ISO_CURRENCY =
  /^[A-Z]{3}$/;

const CURRENCY_ALIASES: Record<string, string> = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
  INR: 'INR',
  AED: 'AED',
  CAD: 'CAD',
  AUD: 'AUD',
  SGD: 'SGD',
  JPY: 'JPY',
  CNY: 'CNY',
};

/** Map display labels / symbols to ISO code when possible. */
export function resolveIsoCurrencyCode(currency?: string | null): string | null {
  const cur = String(currency ?? '').trim();
  if (!cur) return null;

  const upper = cur.toUpperCase();
  if (ISO_CURRENCY.test(upper) && CURRENCY_ALIASES[upper]) {
    try {
      Intl.NumberFormat('en-US', { style: 'currency', currency: upper });
      return upper;
    } catch {
      /* invalid for this runtime */
    }
  }

  if (/₹|rupee/i.test(cur)) return 'INR';
  if (/dollar|usd|\$/i.test(cur)) return 'USD';
  if (/euro|eur|€/i.test(cur)) return 'EUR';
  if (/pound|gbp|£/i.test(cur)) return 'GBP';
  if (/dirham|aed/i.test(cur)) return 'AED';

  return null;
}

/** Prefix symbol for compact display, or null to use suffix label. */
export function getSalaryDisplaySymbol(currency?: string | null): string | null {
  const cur = String(currency ?? '').trim();
  if (!cur) return '$';

  const upper = cur.toUpperCase();
  if (upper === 'USD' || cur === '$') return '$';
  if (upper === 'EUR' || cur === '€') return '€';
  if (upper === 'GBP' || cur === '£') return '£';
  if (upper === 'INR') return '₹';
  if (/₹|rupee/i.test(cur)) return '₹';
  if (cur.length <= 4 && /^[A-Z$€£₹]{1,4}$/i.test(cur)) return cur;

  return null;
}

function compactNumber(n: number): string {
  return n.toLocaleString('en-US', { maximumFractionDigits: 0, notation: 'compact' });
}

/**
 * Compact salary for dashboard cards. Never throws on invalid currency strings.
 */
export function formatCompactSalarySafe(
  min?: number | null,
  max?: number | null,
  currency?: string | null,
  amount?: string | null,
): string {
  const cur = String(currency ?? '').trim() || null;
  const amountStr = String(amount ?? '').trim() || null;

  if (amountStr) {
    return cur ? `${amountStr} · ${cur}` : amountStr;
  }

  const nMin = typeof min === 'number' && Number.isFinite(min) ? min : null;
  const nMax = typeof max === 'number' && Number.isFinite(max) ? max : null;

  if (nMin == null && nMax == null) return 'Salary not specified';

  const sym = getSalaryDisplaySymbol(cur);

  if (sym) {
    if (nMin != null && nMax != null) return `${sym}${compactNumber(nMin)} - ${sym}${compactNumber(nMax)}`;
    if (nMin != null) return `${sym}${compactNumber(nMin)}+`;
    return `${sym}${compactNumber(nMax ?? 0)}`;
  }

  const iso = resolveIsoCurrencyCode(cur);
  if (iso) {
    try {
      const formatter = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: iso,
        maximumFractionDigits: 0,
        notation: 'compact',
      });
      if (nMin != null && nMax != null) return `${formatter.format(nMin)} - ${formatter.format(nMax)}`;
      if (nMin != null) return `${formatter.format(nMin)}+`;
      return formatter.format(nMax ?? 0);
    } catch {
      /* fall through */
    }
  }

  const label = cur || '';
  if (nMin != null && nMax != null) {
    return `${compactNumber(nMin)} - ${compactNumber(nMax)} ${label}`.trim();
  }
  if (nMin != null) return `${compactNumber(nMin)}+ ${label}`.trim();
  return `${compactNumber(nMax ?? 0)} ${label}`.trim();
}
