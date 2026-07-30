/**
 * Mock interview token escrow — same pattern as reference check:
 * interviewer sets fee → hold on interview start → rating-based payout to interviewer.
 */

import { resolveCandidateIdForApi } from '@/lib/auth-storage';
import {
  fetchTokenBalance,
  grantTokenAmount,
  spendTokenAmount,
  spendTokenAmountLocal,
  InsufficientTokensError,
} from '@/lib/tokens-api';
import {
  payoutForRating,
  REFERENCE_RATING_OPTIONS,
  type ReferenceRating,
} from '@/lib/reference-check-store';

export { REFERENCE_RATING_OPTIONS, payoutForRating };
export type InterviewRating = ReferenceRating;

const STORAGE_KEY = 'saasa:interview-token-escrow-v1';

export type InterviewTokenEscrow = {
  requestId: string;
  candidateId: string;
  interviewerId: string;
  feeTokens: number;
  escrowHeld: boolean;
  startedAt?: string;
  rating?: InterviewRating;
  payoutTokens?: number;
  settledAt?: string;
  updatedAt: string;
};

function loadAll(): Record<string, InterviewTokenEscrow> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, InterviewTokenEscrow>;
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

function saveAll(map: Record<string, InterviewTokenEscrow>) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
}

export function getInterviewEscrow(requestId: string): InterviewTokenEscrow | null {
  if (!requestId) return null;
  return loadAll()[requestId] || null;
}

export function clampInterviewFee(fee: number): number {
  return Math.max(5, Math.min(100, Math.round(Number(fee) || 0)));
}

/** Interviewer sets / updates the token fee for this mock interview. */
export function setInterviewFee(input: {
  requestId: string;
  interviewerId: string;
  candidateId: string;
  feeTokens: number;
}): { ok: true; escrow: InterviewTokenEscrow } | { ok: false; error: string } {
  if (!input.requestId || !input.interviewerId) {
    return { ok: false, error: 'Missing interview or interviewer.' };
  }
  const map = loadAll();
  const existing = map[input.requestId];
  if (existing?.escrowHeld) {
    return { ok: false, error: 'Fee locked — escrow already held for this interview.' };
  }
  if (existing?.settledAt) {
    return { ok: false, error: 'This interview escrow is already settled.' };
  }

  const fee = clampInterviewFee(input.feeTokens);
  const now = new Date().toISOString();
  const row: InterviewTokenEscrow = {
    requestId: input.requestId,
    candidateId: input.candidateId || existing?.candidateId || '',
    interviewerId: input.interviewerId,
    feeTokens: fee,
    escrowHeld: false,
    updatedAt: now,
  };
  map[input.requestId] = row;
  saveAll(map);
  return { ok: true, escrow: row };
}

async function spendInterviewEscrow(fee: number, requestId: string): Promise<void> {
  try {
    await spendTokenAmount({
      amount: fee,
      service: 'lms.interview.mock-escrow',
      description: `Mock interview escrow · ${requestId} · ${fee} tokens`,
    });
  } catch (err) {
    if (err instanceof InsufficientTokensError) throw err;
    const code = (err as Error & { code?: string })?.code;
    const msg = err instanceof Error ? err.message : 'Token spend failed.';
    if (
      code === 'NETWORK_ERROR' ||
      code === 'ENDPOINT_MISSING' ||
      /failed to fetch|cannot reach|restart the backend|network|write conflict|deadlock/i.test(msg)
    ) {
      try {
        const bal = await fetchTokenBalance().catch(() => null);
        if (bal && typeof window !== 'undefined') {
          window.localStorage.setItem('saasa:last-token-balance', String(bal.tokenBalance));
        }
        spendTokenAmountLocal(fee, 'lms.interview.mock-escrow');
      } catch (localErr) {
        if (localErr instanceof InsufficientTokensError) throw localErr;
        throw err instanceof Error ? err : new Error(msg);
      }
    } else {
      throw err instanceof Error ? err : new Error(msg);
    }
  }
}

/**
 * Candidate pays escrow when the scheduled interview starts (Join).
 * Same hold pattern as reference-check pay-first.
 */
export async function holdInterviewEscrowOnStart(input: {
  requestId: string;
  candidateId: string;
}): Promise<{ ok: true; escrow: InterviewTokenEscrow } | { ok: false; error: string }> {
  const map = loadAll();
  const row = map[input.requestId];
  if (!row) {
    return {
      ok: false,
      error: 'Interviewer has not set a token fee yet. Ask them to set the fee before joining.',
    };
  }
  if (row.settledAt) return { ok: false, error: 'Escrow already settled.' };
  if (row.escrowHeld) return { ok: true, escrow: row };

  const fee = clampInterviewFee(row.feeTokens);
  try {
    await spendInterviewEscrow(fee, input.requestId);
  } catch (err) {
    if (err instanceof InsufficientTokensError) {
      return {
        ok: false,
        error: `Need ${err.required} tokens to start (you have ${err.balance}).`,
      };
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Payment failed.' };
  }

  const now = new Date().toISOString();
  const next: InterviewTokenEscrow = {
    ...row,
    candidateId: input.candidateId || row.candidateId,
    feeTokens: fee,
    escrowHeld: true,
    startedAt: now,
    updatedAt: now,
  };
  map[input.requestId] = next;
  saveAll(map);
  return { ok: true, escrow: next };
}

/**
 * Candidate rates the interview → weighted payout to interviewer (like reference check).
 */
export async function settleInterviewEscrowWithRating(input: {
  requestId: string;
  candidateId: string;
  rating: InterviewRating;
}): Promise<{ ok: true; escrow: InterviewTokenEscrow } | { ok: false; error: string }> {
  const map = loadAll();
  const row = map[input.requestId];
  if (!row) return { ok: false, error: 'No escrow found for this interview.' };
  if (!row.escrowHeld) return { ok: false, error: 'Escrow was not held — join the interview first.' };
  if (row.settledAt) return { ok: false, error: 'Already settled.' };
  if (row.candidateId && input.candidateId && row.candidateId !== input.candidateId) {
    return { ok: false, error: 'Only the candidate can rate this interview.' };
  }

  const payout = payoutForRating(row.feeTokens, input.rating);
  if (payout > 0 && row.interviewerId) {
    try {
      await grantTokenAmount({
        amount: payout,
        candidateId: resolveCandidateIdForApi(row.interviewerId) || row.interviewerId,
        service: `lms.interview.mock-payout.${row.requestId}`,
        description: `Mock interview payout (${input.rating}) · ${row.requestId}`,
      });
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Payout failed.',
      };
    }
  }

  const now = new Date().toISOString();
  const next: InterviewTokenEscrow = {
    ...row,
    rating: input.rating,
    payoutTokens: payout,
    escrowHeld: false,
    settledAt: now,
    updatedAt: now,
  };
  map[input.requestId] = next;
  saveAll(map);
  return { ok: true, escrow: next };
}
