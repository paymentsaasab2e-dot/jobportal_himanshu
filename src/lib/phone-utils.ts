import { ALL_COUNTRY_CODES, formatPhoneCodeLabel } from '@/lib/country-codes';

/** Unique dial digit strings, longest first. */
const DIAL_DIGITS_LONGEST_FIRST = (() => {
  const unique = new Set(
    ALL_COUNTRY_CODES.map((c) => c.dialCode.replace(/\D/g, '')).filter(Boolean),
  );
  return [...unique].sort((a, b) => b.length - a.length);
})();

/** Strip dial code prefix so the input shows local digits only (e.g. 9321362064, not +919321362064). */
export function stripDialCodeFromPhone(rawPhone: string, dialCode: string): string {
  if (!rawPhone) return '';
  const normalizedDial = dialCode.trim();
  const dialDigits = normalizedDial.replace(/\D/g, '');
  let value = rawPhone.trim();

  if (normalizedDial && value.startsWith(normalizedDial)) {
    value = value.slice(normalizedDial.length);
  }

  let digits = value.replace(/\D/g, '');
  if (dialDigits && digits.startsWith(dialDigits)) {
    digits = digits.slice(dialDigits.length);
  }

  return digits;
}

/** Infer dial from full E.164 using longest matching country prefix. */
export function inferDialFromE164(fullNumber?: string | null): string {
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
    input.countryCode?.trim().split(/\s/)[0] ||
    input.phoneCode?.split(' ')[0]?.trim() ||
    '';

  const dialCode = fromWhatsApp || fromPhone || fromCode || '+91';

  let localPhone = '';
  if (input.phone?.trim()) {
    localPhone = stripDialCodeFromPhone(input.phone, dialCode);
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
