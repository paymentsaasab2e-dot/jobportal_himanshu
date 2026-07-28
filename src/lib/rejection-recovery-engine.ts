/**
 * @deprecated Import from `@/lib/suggestions-engine` instead.
 * Thin re-export for backward compatibility.
 */
export {
  processRejectionRecovery,
  recordRecoverySuggestionClick,
  recordRecoverySuggestionPurchase,
  getHqRecoveryMetrics,
  normalizePortalApplication,
  REJECTION_RECOVERY_STORAGE_KEY,
  REJECTION_RECOVERY_HQ_EVENT,
  type HqRecoveryMetrics,
  type RejectionEvent as RejectionRecoveryEvent,
} from '@/lib/suggestions-engine';

export type RecoverySuggestionKind =
  | 'course'
  | 'ai_cv'
  | 'interview_prep'
  | 'sales_followup';

export type RecoverySuggestionRecord = {
  id: string;
  kind: RecoverySuggestionKind;
  title: string;
  actionUrl: string;
  pushedAt: string;
  clickedAt?: string;
  purchasedAt?: string;
  applicationId?: string;
};
