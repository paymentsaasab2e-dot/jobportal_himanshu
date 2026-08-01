export function normalizeEmail(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase();
}

export function normalizePhoneDigits(value: string | null | undefined): string {
  return String(value || '').replace(/\D/g, '');
}

export function normalizeFullPhone(
  countryCode: string | null | undefined,
  phone: string | null | undefined,
): string {
  const cc = String(countryCode || '').trim();
  const digits = normalizePhoneDigits(phone);
  if (!digits) return '';
  if (!cc) return digits;
  const ccDigits = normalizePhoneDigits(cc);
  if (digits.startsWith(ccDigits)) return `+${digits}`;
  return `${cc.startsWith('+') ? cc : `+${ccDigits}`}${digits}`;
}

export function normalizeSkillName(value: string | null | undefined): string {
  return String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function normalizeUrlKey(value: string | null | undefined): string {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/\/$/, '');
}

export function educationFingerprint(entry: {
  institutionName?: string | null;
  degreeProgram?: string | null;
  educationLevel?: string | null;
  fieldOfStudy?: string | null;
  startYear?: string | number | null;
  endYear?: string | number | null;
}): string {
  return [
    String(entry.institutionName || '').trim().toLowerCase(),
    String(entry.degreeProgram || entry.educationLevel || '').trim().toLowerCase(),
    String(entry.fieldOfStudy || '').trim().toLowerCase(),
    String(entry.startYear || ''),
    String(entry.endYear || ''),
  ].join('|');
}

export function experienceFingerprint(entry: {
  jobTitle?: string | null;
  companyName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}): string {
  return [
    String(entry.jobTitle || '').trim().toLowerCase(),
    String(entry.companyName || '').trim().toLowerCase(),
    String(entry.startDate || ''),
    String(entry.endDate || ''),
  ].join('|');
}
