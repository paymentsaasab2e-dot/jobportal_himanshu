import { ALL_COUNTRY_CODES, formatPhoneCodeLabel } from '@/lib/country-codes';

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

export function dialCodeToLabel(dialCode: string): string {
  const match = ALL_COUNTRY_CODES.find((item) => item.dialCode === dialCode);
  return match ? formatPhoneCodeLabel(match) : dialCode;
}

/** Prefer WhatsApp signup number over CV-extracted phone for Basic Information. */
export function resolveSignupPhoneFields(input: {
  phone?: string;
  phoneCode?: string;
  whatsappNumber?: string;
  countryCode?: string;
}): { localPhone: string; phoneCodeLabel: string } {
  const dialCode =
    input.countryCode?.trim() ||
    input.phoneCode?.split(' ')[0]?.trim() ||
    '+91';

  let localPhone = '';
  if (input.whatsappNumber) {
    localPhone = stripDialCodeFromPhone(input.whatsappNumber, dialCode);
  }
  if (!localPhone && input.phone) {
    localPhone = stripDialCodeFromPhone(input.phone, dialCode);
  }

  const stored = input.phoneCode?.trim().split(' ')[0] || '';
  const phoneCodeLabel =
    stored && stored.startsWith('+') ? stored : dialCode;

  return { localPhone, phoneCodeLabel };
}
