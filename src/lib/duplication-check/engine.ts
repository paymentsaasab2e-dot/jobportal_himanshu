import { checkCredentialAvailability } from './api';
import {
  educationFingerprint,
  experienceFingerprint,
  normalizeEmail,
  normalizeSkillName,
  normalizeUrlKey,
} from './normalize';
import type {
  DuplicationCheckResult,
  DuplicationContext,
  DuplicationFinding,
} from './types';
import { showErrorToast, showWarningToast } from '@/components/common/toast/toast';

function result(
  context: DuplicationContext,
  findings: DuplicationFinding[],
): DuplicationCheckResult {
  const blocking = findings.some((f) => f.severity === 'block');
  return { context, ok: !blocking, findings };
}

/** Within-user: duplicate skill names in the current skills list. */
export function checkSkillsDuplication(input: {
  skills: Array<{ name: string }>;
  nextName: string;
}): DuplicationCheckResult {
  const next = normalizeSkillName(input.nextName);
  const findings: DuplicationFinding[] = [];
  if (!next) return result('profile.skills', findings);

  const dup = input.skills.some((s) => normalizeSkillName(s.name) === next);
  if (dup) {
    findings.push({
      code: 'SKILL_DUPLICATE_IN_PROFILE',
      field: 'skill',
      severity: 'block',
      message: `“${input.nextName.trim()}” is already on your skills list.`,
    });
  }
  return result('profile.skills', findings);
}

/** Within-user: same education row (school + degree + years). Names alone are allowed to repeat. */
export function checkEducationDuplication(input: {
  existing: Array<Record<string, unknown>>;
  next: Record<string, unknown>;
  editingId?: string | null;
}): DuplicationCheckResult {
  const findings: DuplicationFinding[] = [];
  const nextFp = educationFingerprint(input.next as never);
  if (!nextFp.replace(/\|/g, '')) return result('profile.education', findings);

  const conflict = input.existing.some((row) => {
    const id = String(row.id || '');
    if (input.editingId && id && id === input.editingId) return false;
    return educationFingerprint(row as never) === nextFp;
  });

  if (conflict) {
    findings.push({
      code: 'EDUCATION_DUPLICATE_IN_PROFILE',
      field: 'education',
      severity: 'block',
      message:
        'This education entry looks the same as one you already saved (same school, degree, and years).',
    });
  }
  return result('profile.education', findings);
}

/** Within-user: same job title + company + dates. */
export function checkExperienceDuplication(input: {
  existing: Array<Record<string, unknown>>;
  next: Record<string, unknown>;
  editingId?: string | null;
}): DuplicationCheckResult {
  const findings: DuplicationFinding[] = [];
  const nextFp = experienceFingerprint(input.next as never);
  if (!nextFp.replace(/\|/g, '')) return result('profile.experience', findings);

  const conflict = input.existing.some((row) => {
    const id = String(row.id || '');
    if (input.editingId && id && id === input.editingId) return false;
    return experienceFingerprint(row as never) === nextFp;
  });

  if (conflict) {
    findings.push({
      code: 'EXPERIENCE_DUPLICATE_IN_PROFILE',
      field: 'experience',
      severity: 'block',
      message:
        'This work experience looks the same as one you already saved (same title, company, and dates).',
    });
  }
  return result('profile.experience', findings);
}

/** Within-user: duplicate portfolio URLs. */
export function checkPortfolioDuplication(input: {
  existingUrls: string[];
  nextUrl: string;
  editingIndex?: number | null;
}): DuplicationCheckResult {
  const findings: DuplicationFinding[] = [];
  const next = normalizeUrlKey(input.nextUrl);
  if (!next) return result('profile.portfolio', findings);

  const conflict = input.existingUrls.some((url, index) => {
    if (input.editingIndex != null && index === input.editingIndex) return false;
    return normalizeUrlKey(url) === next;
  });

  if (conflict) {
    findings.push({
      code: 'PORTFOLIO_URL_DUPLICATE',
      field: 'url',
      severity: 'block',
      message: 'This link is already in your portfolio.',
    });
  }
  return result('profile.portfolio', findings);
}

/**
 * Cross-user credential check for signup / profile basic info.
 * Login only verifies the account exists via normal auth APIs (no uniqueness probe needed).
 */
export async function checkCredentialDuplication(input: {
  context: Extract<DuplicationContext, 'auth.signup' | 'profile.basic'>;
  email?: string | null;
  phone?: string | null;
  countryCode?: string | null;
  excludeCandidateId?: string | null;
}): Promise<DuplicationCheckResult> {
  const findings: DuplicationFinding[] = [];
  const intent = input.context === 'auth.signup' ? 'signup' : 'profile';

  if (input.email) {
    const emailCheck = await checkCredentialAvailability({
      type: 'email',
      value: normalizeEmail(input.email),
      excludeCandidateId: input.excludeCandidateId,
      intent,
    });
    if (emailCheck.takenByOther || emailCheck.available === false) {
      findings.push({
        code: emailCheck.code || 'EMAIL_TAKEN',
        field: 'email',
        severity: 'block',
        crossUser: true,
        message:
          emailCheck.message ||
          'This email is already used by another account. Sign in or use a different email.',
      });
    }
  }

  if (input.phone) {
    const phoneCheck = await checkCredentialAvailability({
      type: 'phone',
      value: input.phone,
      countryCode: input.countryCode || undefined,
      excludeCandidateId: input.excludeCandidateId,
      intent,
    });
    if (phoneCheck.takenByOther || phoneCheck.available === false) {
      findings.push({
        code: phoneCheck.code || 'PHONE_TAKEN',
        field: 'phone',
        severity: 'block',
        crossUser: true,
        message:
          phoneCheck.message ||
          'This mobile number is already used by another account. Sign in or use a different number.',
      });
    }
  }

  return result(input.context, findings);
}

/** Show toast alerts for findings (user-facing). */
export function alertDuplicationFindings(
  check: DuplicationCheckResult,
  options?: { title?: string },
): void {
  if (!check.findings.length) return;
  const title = options?.title || 'Duplicate data';
  for (const finding of check.findings) {
    if (finding.severity === 'block') {
      showErrorToast(title, finding.message);
    } else {
      showWarningToast(title, finding.message);
    }
  }
}
