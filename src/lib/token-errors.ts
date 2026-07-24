'use client';

import { InsufficientTokensError } from '@/lib/tokens-api';
import { showErrorToast } from '@/components/common/toast/toast';

/** Format + toast for 402 token errors. Returns true if handled. */
export function notifyInsufficientTokens(
  error: unknown,
  onGoToSubscriptions?: () => void,
): boolean {
  if (!(error instanceof InsufficientTokensError)) return false;

  const msg = `Need ${error.required} tokens (you have ${error.balance}). Short by ${error.shortfall}.`;
  showErrorToast('Insufficient tokens', msg);
  onGoToSubscriptions?.();
  return true;
}

export function insufficientTokensMessage(error: unknown): string | null {
  if (!(error instanceof InsufficientTokensError)) return null;
  return `Insufficient tokens: need ${error.required}, you have ${error.balance}. Buy more on Subscriptions.`;
}
