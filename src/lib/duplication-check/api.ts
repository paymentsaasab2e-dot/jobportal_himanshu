import { API_BASE_URL } from '@/lib/api-base';
import type { CredentialCheckRequest, CredentialCheckResponse } from './types';
import { normalizeEmail, normalizeFullPhone, normalizePhoneDigits } from './normalize';

/**
 * Cross-user credential availability — uses backend indexed lookup only.
 * Never scans the full user table from the client.
 */
export async function checkCredentialAvailability(
  input: CredentialCheckRequest,
): Promise<CredentialCheckResponse> {
  const type = input.type;
  let value = '';
  if (type === 'email') {
    value = normalizeEmail(input.value);
    if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return { available: true, message: 'Skip invalid email' };
    }
  } else {
    value = normalizeFullPhone(input.countryCode, input.value);
    if (normalizePhoneDigits(value).length < 6) {
      return { available: true, message: 'Skip invalid phone' };
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/check-credential`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        value: type === 'email' ? value : normalizePhoneDigits(input.value),
        countryCode: input.countryCode,
        excludeCandidateId: input.excludeCandidateId || undefined,
        intent: input.intent || 'signup',
      }),
    });
    const data = (await response.json().catch(() => ({}))) as CredentialCheckResponse & {
      success?: boolean;
    };
    if (!response.ok) {
      return {
        available: false,
        takenByOther: true,
        code: data.code || 'CHECK_FAILED',
        message: data.message || 'Could not verify uniqueness right now.',
      };
    }
    return {
      available: Boolean(data.available),
      takenByOther: Boolean(data.takenByOther),
      code: data.code,
      message: data.message,
    };
  } catch {
    // Network failure — do not block the user hard; let primary auth APIs decide.
    return {
      available: true,
      message: 'Offline — uniqueness will be checked on submit.',
    };
  }
}
