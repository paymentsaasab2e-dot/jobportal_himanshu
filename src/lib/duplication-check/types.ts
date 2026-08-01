/**
 * Contextual duplication-check engine.
 *
 * Scope rules (no full DB scans):
 * - credentials / login-signup: email + mobile uniqueness (indexed lookup only)
 * - profile sections: within the current user's loaded section data only
 * - display names are NOT unique across users
 * - passwords are never checked for cross-user uniqueness
 */

export type DuplicationContext =
  | 'auth.signup'
  | 'auth.login'
  | 'profile.basic'
  | 'profile.skills'
  | 'profile.education'
  | 'profile.experience'
  | 'profile.portfolio';

export type DuplicationSeverity = 'block' | 'warn' | 'info';

export type DuplicationFinding = {
  code: string;
  field: string;
  message: string;
  severity: DuplicationSeverity;
  /** true = another account owns this value */
  crossUser?: boolean;
};

export type DuplicationCheckResult = {
  context: DuplicationContext;
  ok: boolean;
  findings: DuplicationFinding[];
};

export type CredentialCheckRequest = {
  type: 'email' | 'phone';
  value: string;
  countryCode?: string;
  /** When editing own profile, ignore self */
  excludeCandidateId?: string | null;
  intent?: 'signup' | 'login' | 'profile';
};

export type CredentialCheckResponse = {
  available: boolean;
  takenByOther?: boolean;
  code?: string;
  message?: string;
};
