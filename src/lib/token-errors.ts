'use client';

import { InsufficientTokensError } from '@/lib/tokens-api';
import { showErrorToast } from '@/components/common/toast/toast';

/** Format + toast for 402 token errors. Returns true if handled. */
export function notifyInsufficientTokens(
  error: unknown,
  onGoToSubscriptions?: () => void,
): boolean {
  if (!(error instanceof InsufficientTokensError)) return false;

  showErrorToast('Not enough tokens', 'You need more tokens to continue. Open Subscriptions to add some.');
  onGoToSubscriptions?.();
  return true;
}

export function insufficientTokensMessage(error: unknown): string | null {
  if (!(error instanceof InsufficientTokensError)) return null;
  return 'You need more tokens to continue. Open Subscriptions to add some.';
}
