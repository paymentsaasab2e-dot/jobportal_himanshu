import { ALL_COUNTRY_CODES, formatPhoneCodeLabel } from '@/lib/country-codes';

/** Unique dial digit strings, longest first. */
const DIAL_DIGITS_LONGEST_FIRST = (() => {
  const unique = new Set(
    ALL_COUNTRY_CODES.map((c) => c.dialCode.replace(/\D/g, '')).filter(Boolean),
  );
  return [...unique].sort((a, b) => b.length - a.length);
})();

function looksLikeE164(raw?: string | null): boolean {
  const value = String(raw || '').trim();
  if (!value) return false;
  if (value.startsWith('+')) return true;
  // Bare international without +: country code + local (typically 11–15 digits)
  const digits = value.replace(/\D/g, '');
  return digits.length >= 11;
}

/** Strip dial code prefix so the input shows local digits only (e.g. 9321362064, not +919321362064). */
export function stripDialCodeFromPhone(rawPhone: string, dialCode: string): string {
  if (!rawPhone) return '';
  const normalizedDial = dialCode.trim().split(/\s/)[0];
  const dialDigits = normalizedDial.replace(/\D/g, '');
  let value = rawPhone.trim();

  if (normalizedDial && value.startsWith(normalizedDial)) {
    value = value.slice(normalizedDial.length);
  }

  let digits = value.replace(/\D/g, '');
  if (dialDigits && digits.startsWith(dialDigits)) {
    // Only strip when this is clearly an international number, not a local
    // mobile that happens to start with the same digits (e.g. Indian 92… vs +92).
    const remainder = digits.slice(dialDigits.length);
    const shouldStrip =
      rawPhone.trim().startsWith('+') ||
      digits.length >= dialDigits.length + 7 ||
      remainder.length >= 8;
    if (shouldStrip && remainder.length > 0) {
      digits = remainder;
    }
  }

  return digits;
}

/** Infer dial from full E.164 using longest matching country prefix. */
export function inferDialFromE164(fullNumber?: string | null): string {
  if (!looksLikeE164(fullNumber)) return '';
  const digits = String(fullNumber || '').replace(/\D/g, '');
  if (!digits) return '';
  for (const dial of DIAL_DIGITS_LONGEST_FIRST) {
    if (digits.startsWith(dial) && digits.length > dial.length) {
      return `+${dial}`;
    }
  }
  return '';
}

export function dialCodeToLabel(dialCode: string): string {
  const match = ALL_COUNTRY_CODES.find((item) => item.dialCode === dialCode);
  return match ? formatPhoneCodeLabel(match) : dialCode;
}

/**
 * Normalize pasted/typed phone input to local digits for the selected dial.
 * Handles full E.164 pastes (+91XXXXXXXXXX) without truncating the country code into local digits.
 */
export function toLocalPhoneDigits(
  rawInput: string,
  dialCode: string,
  maxLocalLength?: number,
): string {
  const raw = String(rawInput || '').trim();
  if (!raw) return '';

  const dialDigits = String(dialCode || '').replace(/\D/g, '');
  const allDigits = raw.replace(/\D/g, '');
  let local = allDigits;

  if (
    raw.startsWith('+') ||
    (dialDigits &&
      allDigits.startsWith(dialDigits) &&
      allDigits.length > (maxLocalLength || 10))
  ) {
    local = stripDialCodeFromPhone(raw.startsWith('+') ? raw : `+${allDigits}`, dialCode);
  }

  if (maxLocalLength && maxLocalLength > 0) {
    return local.slice(0, maxLocalLength);
  }
  return local;
}

/**
 * Resolve phone fields for Basic Information.
 * Saved profile phone wins over signup WhatsApp (user may edit after signup).
 * Dial is taken from the stored E.164 WhatsApp number when present so a wrong
 * countryCode (e.g. +234) cannot fight a correct +91… number in the UI.
 */
export function resolveSignupPhoneFields(input: {
  phone?: string;
  phoneCode?: string;
  whatsappNumber?: string;
  countryCode?: string;
}): { localPhone: string; phoneCodeLabel: string } {
  const fromWhatsApp = inferDialFromE164(input.whatsappNumber);
  const fromPhone = inferDialFromE164(input.phone);
  const fromCode =
    input.phoneCode?.trim().split(/\s/)[0] ||
    input.countryCode?.trim().split(/\s/)[0] ||
    '';

  // Prefer stored dial / WhatsApp E.164. Never infer dial from local-only phone digits
  // (e.g. Indian mobiles starting with 92 were wrongly treated as +92 Pakistan).
  const dialCode = fromWhatsApp || fromCode || fromPhone || '+91';

  let localPhone = '';
  if (input.phone?.trim()) {
    const raw = input.phone.trim();
    if (looksLikeE164(raw)) {
      localPhone = stripDialCodeFromPhone(raw, dialCode);
    } else {
      localPhone = raw.replace(/\D/g, '');
    }
  }
  if (!localPhone && input.whatsappNumber) {
    localPhone = stripDialCodeFromPhone(input.whatsappNumber, dialCode);
  }

  const storedLabel = input.phoneCode?.trim() || '';
  const storedDial = storedLabel.split(' ')[0] || '';
  const phoneCodeLabel =
    fromWhatsApp
      ? dialCodeToLabel(fromWhatsApp)
      : storedLabel && storedLabel.includes('(')
        ? storedLabel
        : storedDial && storedDial.startsWith('+')
          ? dialCodeToLabel(storedDial)
          : dialCodeToLabel(dialCode);

  return { localPhone, phoneCodeLabel };
}
