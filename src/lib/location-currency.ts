import { getCountryCodeForTimeZone } from '@/lib/country-codes';

/** ISO country → ISO 4217 currency (display only; FX conversion comes later). */
const COUNTRY_TO_CURRENCY: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  AE: 'AED',
  SA: 'SAR',
  SG: 'SGD',
  AU: 'AUD',
  CA: 'CAD',
  EU: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  NL: 'EUR',
  IE: 'EUR',
  ES: 'EUR',
  IT: 'EUR',
  PT: 'EUR',
  BE: 'EUR',
  AT: 'EUR',
  FI: 'EUR',
  JP: 'JPY',
  KR: 'KRW',
  CN: 'CNY',
  HK: 'HKD',
  NZ: 'NZD',
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  GH: 'GHS',
  EG: 'EGP',
  PK: 'PKR',
  BD: 'BDT',
  LK: 'LKR',
  NP: 'NPR',
  MY: 'MYR',
  TH: 'THB',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  BR: 'BRL',
  MX: 'MXN',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
  CH: 'CHF',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  TR: 'TRY',
  IL: 'ILS',
  QA: 'QAR',
  KW: 'KWD',
  BH: 'BHD',
  OM: 'OMR',
};

export type LocationCurrency = {
  countryCode: string;
  currency: string;
  timeZone: string;
};

/** Same timezone → country detection used on the WhatsApp login page. */
export function detectLocationCurrency(): LocationCurrency {
  let timeZone = 'UTC';
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    timeZone = 'UTC';
  }
  const countryCode = getCountryCodeForTimeZone(timeZone) || 'US';
  const currency = COUNTRY_TO_CURRENCY[countryCode] || 'USD';
  return { countryCode, currency, timeZone };
}

/**
 * Format a pack price in the user's local currency symbol/code.
 * Amount is still the catalog number (no FX yet) — conversion will be added later.
 */
export function formatLocalPackPrice(
  amount: number,
  currency: string,
  locale = 'en',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount}`;
  }
}
