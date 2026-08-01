export type {
  CredentialCheckRequest,
  CredentialCheckResponse,
  DuplicationCheckResult,
  DuplicationContext,
  DuplicationFinding,
  DuplicationSeverity,
} from './types';

export {
  normalizeEmail,
  normalizeFullPhone,
  normalizePhoneDigits,
  normalizeSkillName,
  normalizeUrlKey,
  educationFingerprint,
  experienceFingerprint,
} from './normalize';

export { checkCredentialAvailability } from './api';

export {
  alertDuplicationFindings,
  checkCredentialDuplication,
  checkEducationDuplication,
  checkExperienceDuplication,
  checkPortfolioDuplication,
  checkSkillsDuplication,
} from './engine';
