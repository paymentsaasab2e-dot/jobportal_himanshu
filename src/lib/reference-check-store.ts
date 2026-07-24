/**
 * Reference-check requests, chat, and rating payouts (local + token API).
 * Spend goes to HR Yantra first; referee is paid after rating (weighted).
 */

import {
  getGossipDisplayName,
  getGossipIdentity,
  isDemoReferenceUser,
  updateGossipIdentity,
} from '@/lib/community-store';
import { resolveCandidateIdForApi } from '@/lib/auth-storage';
import {
  fetchTokenBalance,
  grantTokenAmount,
  InsufficientTokensError,
  spendTokenAmount,
  spendTokenAmountLocal,
} from '@/lib/tokens-api';
export type ReferenceRating = 'poor' | 'good' | 'excellent';

export type ReferenceCheckStatus =
  | 'pending'
  | 'active'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type ReferenceMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
};

export type ReferenceCheckRequest = {
  id: string;
  companyPageId: string;
  companyName: string;
  requesterId: string;
  requesterName: string;
  refereeId: string;
  refereeName: string;
  feeTokens: number;
  /** Held by platform until rating / refund. */
  escrowHeld: boolean;
  status: ReferenceCheckStatus;
  messages: ReferenceMessage[];
  rating?: ReferenceRating;
  payoutTokens?: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'saasa:reference-checks-v1';

/** Portion of fee paid to referee after rating (rest stays with HR Yantra). */
export const RATING_PAYOUT_WEIGHT: Record<ReferenceRating, number> = {
  poor: 0.4,
  good: 0.75,
  excellent: 1,
};

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function loadAll(): ReferenceCheckRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReferenceCheckRequest[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAll(rows: ReferenceCheckRequest[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function listReferenceChecksForUser(userId: string): ReferenceCheckRequest[] {
  return loadAll()
    .filter((r) => r.requesterId === userId || r.refereeId === userId)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function getReferenceCheck(id: string): ReferenceCheckRequest | null {
  return loadAll().find((r) => r.id === id) || null;
}

export function payoutForRating(fee: number, rating: ReferenceRating): number {
  const w = RATING_PAYOUT_WEIGHT[rating] ?? 0.75;
  return Math.max(0, Math.round(fee * w));
}

/**
 * Requester pays fee up front → held by HR Yantra (platform).
 * Creates a pending request for the referee.
 */
export async function requestReferenceCheck(input: {
  companyPageId: string;
  companyName: string;
  requesterId: string;
  requesterName: string;
  refereeId: string;
}): Promise<{ ok: true; request: ReferenceCheckRequest } | { ok: false; error: string }> {
  if (!input.requesterId || !input.refereeId) {
    return { ok: false, error: 'Sign in required.' };
  }
  if (input.requesterId === input.refereeId) {
    return { ok: false, error: 'You cannot request a reference from yourself.' };
  }

  const referee = getGossipIdentity(input.refereeId);
  if (!referee?.availableForReferenceCheck) {
    return { ok: false, error: 'This person is not open for reference checks.' };
  }

  const open = loadAll().find(
    (r) =>
      r.requesterId === input.requesterId &&
      r.refereeId === input.refereeId &&
      (r.status === 'pending' || r.status === 'active'),
  );
  if (open) {
    return { ok: false, error: 'You already have an open request with this person.' };
  }

  const fee = Math.max(1, Number(referee.referenceFeeTokens) || 5);

  try {
    await spendTokenAmount({
      amount: fee,
      service: 'office.reference-check',
      description: `Reference check escrow · ${input.companyName} · ${fee} tokens`,
    });
  } catch (err) {
    if (err instanceof InsufficientTokensError) {
      return {
        ok: false,
        error: `Need ${err.required} tokens (you have ${err.balance}).`,
      };
    }
    const code = (err as Error & { code?: string })?.code;
    const msg = err instanceof Error ? err.message : 'Token spend failed.';
    // Backend down / CORS / missing route — still allow escrow locally so demos work.
    if (
      code === 'NETWORK_ERROR' ||
      code === 'ENDPOINT_MISSING' ||
      /failed to fetch|cannot reach|restart the backend|network/i.test(msg)
    ) {
      try {
        // Seed local balance from API if possible before offline spend.
        const bal = await fetchTokenBalance().catch(() => null);
        if (bal && typeof window !== 'undefined') {
          window.localStorage.setItem('saasa:last-token-balance', String(bal.tokenBalance));
        }
        spendTokenAmountLocal(fee, 'office.reference-check');
      } catch (localErr) {
        if (localErr instanceof InsufficientTokensError) {
          return {
            ok: false,
            error: `Need ${localErr.required} tokens (you have ${localErr.balance}). Open Tokens once to sync, or restart the backend on port 5000.`,
          };
        }
        return { ok: false, error: msg };
      }
    } else {
      return { ok: false, error: msg };
    }
  }

  const now = new Date().toISOString();
  const demoReferee = isDemoReferenceUser(input.refereeId);
  const requestMsg = {
    id: uid('rm'),
    senderId: input.requesterId,
    text: `Hi — I'd like to request a reference check for ${input.companyName}.`,
    createdAt: now,
  };
  const messages = demoReferee
    ? [
        requestMsg,
        {
          id: uid('rm'),
          senderId: input.refereeId,
          text: `Sure, happy to help with a reference for ${input.companyName}. What would you like to know?`,
          createdAt: new Date(Date.now() + 1).toISOString(),
        },
      ]
    : [requestMsg];

  const request: ReferenceCheckRequest = {
    id: uid('ref'),
    companyPageId: input.companyPageId,
    companyName: input.companyName,
    requesterId: input.requesterId,
    requesterName: input.requesterName,
    refereeId: input.refereeId,
    refereeName: getGossipDisplayName(input.refereeId, `Member ${input.refereeId.slice(-4)}`),
    feeTokens: fee,
    escrowHeld: true,
    // Demo teammates auto-accept so you can test chat without a second account.
    status: demoReferee ? 'active' : 'pending',
    messages,
    createdAt: now,
    updatedAt: now,
  };

  const all = loadAll();
  all.push(request);
  saveAll(all);
  return { ok: true, request };
}

export async function respondReferenceCheck(
  requestId: string,
  refereeId: string,
  accept: boolean,
): Promise<{ ok: true; request: ReferenceCheckRequest } | { ok: false; error: string }> {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx < 0) return { ok: false, error: 'Request not found.' };
  const row = all[idx];
  if (row.refereeId !== refereeId) return { ok: false, error: 'Not your request.' };
  if (row.status !== 'pending') return { ok: false, error: 'Request is no longer pending.' };

  const now = new Date().toISOString();
  if (!accept) {
    if (row.escrowHeld && row.feeTokens > 0) {
      try {
        await grantTokenAmount({
          amount: row.feeTokens,
          candidateId: resolveCandidateIdForApi(row.requesterId) || row.requesterId,
          service: `office.reference-check.refund.${row.id}`,
          description: `Reference check refund · ${row.companyName}`,
        });
      } catch (err) {
        return {
          ok: false,
          error: err instanceof Error ? err.message : 'Refund failed.',
        };
      }
    }
    all[idx] = {
      ...row,
      status: 'rejected',
      escrowHeld: false,
      updatedAt: now,
    };
    saveAll(all);
    return { ok: true, request: all[idx] };
  }

  all[idx] = { ...row, status: 'active', updatedAt: now };
  saveAll(all);
  return { ok: true, request: all[idx] };
}

export function sendReferenceMessage(
  requestId: string,
  senderId: string,
  text: string,
): { ok: true; request: ReferenceCheckRequest } | { ok: false; error: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, error: 'Message cannot be empty.' };

  const all = loadAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx < 0) return { ok: false, error: 'Conversation not found.' };
  const row = all[idx];
  if (row.status !== 'active') return { ok: false, error: 'Chat is not active yet.' };
  if (senderId !== row.requesterId && senderId !== row.refereeId) {
    return { ok: false, error: 'Not a participant.' };
  }

  const msg: ReferenceMessage = {
    id: uid('rm'),
    senderId,
    text: trimmed.slice(0, 2000),
    createdAt: new Date().toISOString(),
  };
  const updated: ReferenceCheckRequest = {
    ...row,
    messages: [...row.messages, msg],
    updatedAt: msg.createdAt,
  };
  all[idx] = updated;
  saveAll(all);
  return { ok: true, request: updated };
}

/**
 * Primary user rates the conversation → weighted payout to referee from escrow.
 */
export async function rateReferenceCheck(
  requestId: string,
  requesterId: string,
  rating: ReferenceRating,
): Promise<{ ok: true; request: ReferenceCheckRequest } | { ok: false; error: string }> {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx < 0) return { ok: false, error: 'Request not found.' };
  const row = all[idx];
  if (row.requesterId !== requesterId) return { ok: false, error: 'Only the requester can rate.' };
  if (row.status !== 'active') return { ok: false, error: 'Rate after the chat is active.' };
  if (!row.escrowHeld) return { ok: false, error: 'Escrow already settled.' };

  const payout = payoutForRating(row.feeTokens, rating);

  if (payout > 0 && !isDemoReferenceUser(row.refereeId)) {
    try {
      await grantTokenAmount({
        amount: payout,
        candidateId: resolveCandidateIdForApi(row.refereeId) || row.refereeId,
        service: `office.reference-check.payout.${row.id}`,
        description: `Reference check payout (${rating}) · ${row.companyName}`,
      });
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Payout failed.',
      };
    }
  }
  // Demo referee: tokens stay with HR Yantra (platform cut for test accounts).

  const referee = getGossipIdentity(row.refereeId);
  if (referee) {
    updateGossipIdentity(row.refereeId, {
      completedReferenceChecks: (referee.completedReferenceChecks || 0) + 1,
    });
  }

  const now = new Date().toISOString();
  all[idx] = {
    ...row,
    status: 'completed',
    escrowHeld: false,
    rating,
    payoutTokens: payout,
    updatedAt: now,
  };
  saveAll(all);
  return { ok: true, request: all[idx] };
}

export function pendingIncomingCount(userId: string): number {
  return loadAll().filter((r) => r.refereeId === userId && r.status === 'pending').length;
}
