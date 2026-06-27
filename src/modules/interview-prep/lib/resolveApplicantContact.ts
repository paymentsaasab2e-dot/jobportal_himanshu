import { getApiBaseUrl } from '@/lib/api-base';
import { getStoredCandidateId, getStoredToken, resolveCandidateIdForApi } from '@/lib/auth-storage';

const CONTACT_KEY = 'ip:interview-applicant-contact';

export type ApplicantContactHints = {
  email: string;
  phones: string[];
  phase1CandidateId: string;
  firstName: string;
  lastName: string;
};

const EMPTY_HINTS: ApplicantContactHints = {
  email: '',
  phones: [],
  phase1CandidateId: '',
  firstName: '',
  lastName: '',
};

export function readStoredApplicantContact(): ApplicantContactHints {
  if (typeof window === 'undefined') return { ...EMPTY_HINTS };
  try {
    const raw = localStorage.getItem(CONTACT_KEY);
    if (!raw) return { ...EMPTY_HINTS };
    const parsed = JSON.parse(raw) as ApplicantContactHints;
    return {
      email: String(parsed?.email || '').trim(),
      phones: Array.isArray(parsed?.phones)
        ? parsed.phones.map((p) => String(p || '').trim()).filter(Boolean)
        : [],
      phase1CandidateId: String(parsed?.phase1CandidateId || '').trim(),
      firstName: String(parsed?.firstName || '').trim(),
      lastName: String(parsed?.lastName || '').trim(),
    };
  } catch {
    return { ...EMPTY_HINTS };
  }
}

function splitDisplayName(name?: string | null) {
  const raw = String(name || '').trim();
  if (!raw || raw.toLowerCase() === 'candidate') return { firstName: '', lastName: '' };
  const parts = raw.split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] || '',
    lastName: parts.slice(1).join(' '),
  };
}

export function saveApplicantContactFromAnswers(
  answers: Record<string, unknown>,
  fields: Array<{ id: string; type: string; label: string }>,
) {
  if (typeof window === 'undefined') return;

  let email = '';
  let firstName = '';
  let lastName = '';
  const phones: string[] = [];
  const stored = readStoredApplicantContact();

  for (const field of fields) {
    const val = String(answers[field.id] ?? '').trim();
    if (!val) continue;
    const label = field.label.toLowerCase();
    if (field.type === 'email' || label.includes('email')) email = val;
    if (field.type === 'phone' || label.includes('phone') || label.includes('mobile')) {
      phones.push(val);
    }
    if (label.includes('first') && label.includes('name')) firstName = val;
    else if (label.includes('last') && label.includes('name')) lastName = val;
    else if ((label === 'full name' || label === 'name') && !firstName) {
      const split = splitDisplayName(val);
      firstName = split.firstName;
      lastName = split.lastName;
    }
  }

  const merged: ApplicantContactHints = {
    email: email || stored.email,
    phones: [...new Set([...stored.phones, ...phones])],
    phase1CandidateId: getStoredCandidateId() || stored.phase1CandidateId,
    firstName: firstName || stored.firstName,
    lastName: lastName || stored.lastName,
  };

  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(merged));
  } catch {
    /* ignore */
  }
}

function pushPhone(target: string[], value?: string | null) {
  const v = String(value || '').trim();
  if (v) target.push(v);
}

export async function resolveApplicantContactHints(user?: {
  id?: string;
  name?: string;
  email?: string;
  whatsappNumber?: string;
} | null): Promise<ApplicantContactHints> {
  const phones: string[] = [];
  let email = String(user?.email || '').trim();
  let firstName = '';
  let lastName = '';

  const stored = readStoredApplicantContact();
  const phase1CandidateId =
    resolveCandidateIdForApi(user?.id) || getStoredCandidateId() || stored.phase1CandidateId;

  const fromName = splitDisplayName(user?.name);
  firstName = fromName.firstName;
  lastName = fromName.lastName;

  pushPhone(phones, user?.whatsappNumber);

  if (!email && stored.email) email = stored.email;
  for (const p of stored.phones) pushPhone(phones, p);
  if (!firstName && stored.firstName) firstName = stored.firstName;
  if (!lastName && stored.lastName) lastName = stored.lastName;

  const token = getStoredToken();
  if (phase1CandidateId && token) {
    try {
      const res = await fetch(`${getApiBaseUrl()}/profile/${phase1CandidateId}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (res.ok) {
        const json = await res.json();
        const data = json?.data;
        const pi = data?.personalInfo;
        pushPhone(phones, data?.whatsappNumber);
        if (pi && typeof pi === 'object') {
          if (!email && pi.email) email = String(pi.email).trim();
          if (pi.firstName) firstName = String(pi.firstName).trim();
          if (pi.lastName) lastName = String(pi.lastName).trim();
          pushPhone(phones, pi.phone);
          pushPhone(phones, pi.whatsappNumber);
          const code = String(pi.phoneCode || pi.countryCode || data?.countryCode || '')
            .trim()
            .split(' ')[0];
          if (code && pi.phone) {
            const digits = String(pi.phone).replace(/\D/g, '');
            pushPhone(phones, `${code}${digits}`);
            pushPhone(phones, `${code} ${pi.phone}`);
            pushPhone(phones, digits);
          } else if (pi.phone) {
            pushPhone(phones, String(pi.phone).replace(/\D/g, ''));
          }
        }
      }
    } catch {
      /* profile optional */
    }
  }

  const result: ApplicantContactHints = {
    email,
    phones: [...new Set(phones.map((p) => p.trim()).filter(Boolean))],
    phase1CandidateId,
    firstName,
    lastName,
  };

  try {
    localStorage.setItem(CONTACT_KEY, JSON.stringify(result));
  } catch {
    /* ignore */
  }

  return result;
}
