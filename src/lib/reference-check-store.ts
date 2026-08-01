/**
 * Reference-check: pay escrow → enquiry → accept/answer → requester rates → payout.
 * Tokens are credited to the referee only after the requester reads answers and rates them.
 */

import {
  getGossipDisplayName,
  getGossipIdentity,
  isDemoReferenceUser,
  listOpenForReferenceOnCompany,
  searchCommunityEverything,
  updateGossipIdentity,
  type CompanyPage,
} from '@/lib/community-store';
import { resolveCandidateIdForApi } from '@/lib/auth-storage';
import {
  fetchTokenBalance,
  grantTokenAmount,
  InsufficientTokensError,
  spendTokenAmount,
  spendTokenAmountLocal,
} from '@/lib/tokens-api';
import { privacyMaskedLabel } from '@/lib/social-store';

export type ReferenceRating = 'satisfactory' | 'good' | 'top_notch' | 'excellent';

export type EnquiryRole = 'employee' | 'employer';

export type ReferenceCheckStatus =
  | 'pending'
  | 'active'
  | 'awaiting_answers'
  | 'answered'
  | 'rejected'
  | 'completed'
  | 'cancelled';

export type ReferenceMediaType = 'image' | 'voice';

export type ReferenceMessage = {
  id: string;
  senderId: string;
  text: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: ReferenceMediaType;
};

export type ReferenceAnswer = {
  question: string;
  answer: string;
};

export type ReferenceCheckRequest = {
  id: string;
  companyPageId: string;
  companyName: string;
  requesterId: string;
  requesterName: string;
  requesterRealName?: string;
  requesterAnonymous: boolean;
  refereeId: string;
  refereeName: string;
  refereeRealName?: string;
  refereeAnonymous: boolean;
  enquiryRole: EnquiryRole;
  questions: string[];
  answers: ReferenceAnswer[];
  feeTokens: number;
  /** Held by platform until requester rates the answers. */
  escrowHeld: boolean;
  status: ReferenceCheckStatus;
  messages: ReferenceMessage[];
  rating?: ReferenceRating;
  payoutTokens?: number;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = 'saasa:reference-checks-v2';
const LEGACY_KEY = 'saasa:reference-checks-v1';

/** Portion of fee paid to referee after requester feedback. */
export const RATING_PAYOUT_WEIGHT: Record<ReferenceRating, number> = {
  satisfactory: 0.4,
  good: 0.75,
  top_notch: 0.9,
  excellent: 1,
};

export const REFERENCE_RATING_OPTIONS: Array<{
  id: ReferenceRating;
  label: string;
}> = [
  { id: 'satisfactory', label: 'Satisfactory' },
  { id: 'good', label: 'Good' },
  { id: 'top_notch', label: 'Top notch' },
  { id: 'excellent', label: 'Excellent' },
];

function normalizeRating(raw: string | undefined): ReferenceRating | undefined {
  if (!raw) return undefined;
  if (raw === 'poor') return 'satisfactory';
  if (raw === 'satisfactory' || raw === 'good' || raw === 'top_notch' || raw === 'excellent') {
    return raw;
  }
  return undefined;
}

function uid(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function normalize(row: Partial<ReferenceCheckRequest> & {
  id: string;
  companyPageId: string;
  companyName: string;
  requesterId: string;
  requesterName: string;
  refereeId: string;
  refereeName: string;
  feeTokens: number;
  status: ReferenceCheckStatus;
  messages: ReferenceMessage[];
  createdAt: string;
  updatedAt: string;
}): ReferenceCheckRequest {
  return {
    ...row,
    requesterAnonymous: Boolean(row.requesterAnonymous),
    refereeAnonymous: row.refereeAnonymous !== false,
    requesterRealName: row.requesterRealName || row.requesterName,
    refereeRealName: row.refereeRealName || row.refereeName,
    enquiryRole: row.enquiryRole === 'employer' ? 'employer' : 'employee',
    questions: Array.isArray(row.questions) ? row.questions : [],
    answers: Array.isArray(row.answers) ? row.answers : [],
    escrowHeld: row.escrowHeld !== false,
    rating: normalizeRating(row.rating as string | undefined),
  };
}

function loadAll(): ReferenceCheckRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ReferenceCheckRequest[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((r) => normalize(r));
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

/** Suggested escrow for a company (avg open fee, fallback 10). */
export function estimateCompanyReferenceFee(companyPageId: string): number {
  const open = listOpenForReferenceOnCompany(companyPageId);
  if (open.length === 0) return 10;
  const avg = open.reduce((s, p) => s + p.feeTokens, 0) / open.length;
  return Math.max(5, Math.round(avg));
}

export function suggestEmployeeQuestions(company: CompanyPage): string[] {
  const domain = company.domainKey || 'the company';
  return [
    `What is day-to-day culture like at ${company.name}?`,
    `How transparent is leadership communication at ${company.name}?`,
    `Would you recommend ${company.name} to a friend looking for work?`,
    `Any red flags around workload or work-life balance at ${domain}?`,
    `How does ${company.name} handle growth / promotions?`,
  ];
}

export function suggestEmployerQuestions(personName: string, company: CompanyPage): string[] {
  const who = personName || 'this person';
  return [
    `How would you describe working with ${who}?`,
    `What are ${who}'s strongest skills on the job?`,
    `Would you rehire or recommend ${who}?`,
    `Any concerns about reliability or collaboration?`,
    `How did ${who} contribute at ${company.name}?`,
  ];
}

/** Extra suggestions from similar company/person searches in OG. */
export function suggestFromRelatedSearches(query: string): string[] {
  const hits = searchCommunityEverything(query, 8);
  const out: string[] = [];
  for (const h of hits) {
    if (h.kind === 'company') {
      out.push(`How does this compare to what you know about ${h.title}?`);
    }
    if (h.kind === 'person') {
      out.push(`Anyone who has worked with ${h.title} — what stood out?`);
    }
  }
  return out.slice(0, 4);
}

export function getReferencePeerLabel(
  row: ReferenceCheckRequest,
  viewerId: string,
): string {
  const iAmRequester = row.requesterId === viewerId;
  const peerAnon = iAmRequester ? row.refereeAnonymous : row.requesterAnonymous;
  const peerId = iAmRequester ? row.refereeId : row.requesterId;
  const peerReal = iAmRequester ? row.refereeRealName : row.requesterRealName;
  const stored = iAmRequester ? row.refereeName : row.requesterName;

  if (row.status === 'pending') {
    return privacyMaskedLabel(peerId);
  }
  if (peerAnon) return privacyMaskedLabel(peerId);
  return peerReal || stored || privacyMaskedLabel(peerId);
}

async function spendEscrow(fee: number, companyName: string): Promise<void> {
  try {
    await spendTokenAmount({
      amount: fee,
      service: 'office.reference-check',
      description: `Reference check escrow · ${companyName} · ${fee} tokens`,
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
        spendTokenAmountLocal(fee, 'office.reference-check');
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
 * Pay first (escrow) then create pending enquiry for the referee.
 * Referee is paid only after they accept AND answer the questions.
 */
export async function submitReferenceEnquiry(input: {
  companyPageId: string;
  companyName: string;
  requesterId: string;
  requesterName: string;
  refereeId: string;
  enquiryRole: EnquiryRole;
  questions: string[];
  anonymous?: boolean;
  /** If already paid in wizard step — skip second charge. */
  alreadyPaid?: boolean;
  feeTokens?: number;
}): Promise<{ ok: true; request: ReferenceCheckRequest } | { ok: false; error: string }> {
  if (!input.requesterId || !input.refereeId) {
    return { ok: false, error: 'Sign in required.' };
  }
  if (input.requesterId === input.refereeId) {
    return { ok: false, error: 'You cannot request a reference from yourself.' };
  }

  const questions = input.questions.map((q) => q.trim()).filter(Boolean).slice(0, 12);
  if (questions.length === 0) {
    return { ok: false, error: 'Add at least one question.' };
  }

  const referee = getGossipIdentity(input.refereeId);
  const isDemo = isDemoReferenceUser(input.refereeId);
  if (!isDemo && !referee?.availableForReferenceCheck) {
    return { ok: false, error: 'This person is not open for reference checks.' };
  }

  const open = loadAll().find(
    (r) =>
      r.requesterId === input.requesterId &&
      r.refereeId === input.refereeId &&
      (r.status === 'pending' || r.status === 'active' || r.status === 'awaiting_answers'),
  );
  if (open) {
    return { ok: false, error: 'You already have an open request with this person.' };
  }

  const fee = Math.max(
    1,
    Number(input.feeTokens) ||
      Number(referee?.referenceFeeTokens) ||
      estimateCompanyReferenceFee(input.companyPageId),
  );

  const requesterAnon =
    Boolean(getGossipIdentity(input.requesterId)?.isAnonymous) || Boolean(input.anonymous);
  const requesterReal = input.requesterName.trim() || `Member ${input.requesterId.slice(-4)}`;
  const refereeReal = getGossipDisplayName(
    input.refereeId,
    `Member ${input.refereeId.slice(-4)}`,
  );

  if (!input.alreadyPaid) {
    try {
      await spendEscrow(fee, input.companyName);
    } catch (err) {
      if (err instanceof InsufficientTokensError) {
        return {
          ok: false,
          error: `Need ${err.required} tokens (you have ${err.balance}).`,
        };
      }
      return { ok: false, error: err instanceof Error ? err.message : 'Payment failed.' };
    }
  }

  const now = new Date().toISOString();
  const qBlock = questions.map((q, i) => `${i + 1}. ${q}`).join('\n');
  const requestMsg: ReferenceMessage = {
    id: uid('rm'),
    senderId: input.requesterId,
    text: `Reference enquiry (${input.enquiryRole}) for ${input.companyName}:\n${qBlock}`,
    createdAt: now,
  };

  const messages = isDemo
    ? [
        requestMsg,
        {
          id: uid('rm'),
          senderId: input.refereeId,
          text: 'Happy to help — I’ll answer your questions shortly.',
          createdAt: new Date(Date.now() + 1).toISOString(),
        },
      ]
    : [requestMsg];

  const request: ReferenceCheckRequest = {
    id: uid('ref'),
    companyPageId: input.companyPageId,
    companyName: input.companyName,
    requesterId: input.requesterId,
    requesterRealName: requesterReal,
    requesterName: requesterAnon ? privacyMaskedLabel(input.requesterId) : privacyMaskedLabel(input.requesterId),
    requesterAnonymous: requesterAnon,
    refereeId: input.refereeId,
    refereeRealName: refereeReal,
    refereeName: privacyMaskedLabel(input.refereeId),
    refereeAnonymous: true,
    enquiryRole: input.enquiryRole,
    questions,
    answers: [],
    feeTokens: fee,
    escrowHeld: true,
    status: isDemo ? 'awaiting_answers' : 'pending',
    messages,
    createdAt: now,
    updatedAt: now,
  };

  // Pending always shows masked names; after accept we may reveal.
  if (isDemo) {
    request.requesterName = requesterAnon
      ? privacyMaskedLabel(input.requesterId)
      : requesterReal;
    request.refereeName = refereeReal;
    request.refereeAnonymous = false;
  }

  const all = loadAll();
  all.push(request);
  saveAll(all);
  return { ok: true, request };
}

/** @deprecated Use submitReferenceEnquiry — kept for company/profile quick actions. */
export async function requestReferenceCheck(input: {
  companyPageId: string;
  companyName: string;
  requesterId: string;
  requesterName: string;
  refereeId: string;
}): Promise<{ ok: true; request: ReferenceCheckRequest } | { ok: false; error: string }> {
  return submitReferenceEnquiry({
    ...input,
    enquiryRole: 'employer',
    questions: [
      `How would you describe working with this person at ${input.companyName}?`,
      'Would you recommend them for a similar role?',
    ],
    anonymous: Boolean(getGossipIdentity(input.requesterId)?.isAnonymous),
  });
}

/** Pay escrow only (wizard step 1). Returns fee charged. */
export async function payReferenceEscrow(input: {
  companyPageId: string;
  companyName: string;
  feeTokens?: number;
}): Promise<{ ok: true; feeTokens: number } | { ok: false; error: string }> {
  const fee =
    Math.max(1, Number(input.feeTokens) || estimateCompanyReferenceFee(input.companyPageId));
  try {
    await spendEscrow(fee, input.companyName);
    return { ok: true, feeTokens: fee };
  } catch (err) {
    if (err instanceof InsufficientTokensError) {
      return {
        ok: false,
        error: `Need ${err.required} tokens (you have ${err.balance}).`,
      };
    }
    return { ok: false, error: err instanceof Error ? err.message : 'Payment failed.' };
  }
}

export async function respondReferenceCheck(
  requestId: string,
  refereeId: string,
  accept: boolean,
  options?: { anonymous?: boolean; realName?: string },
): Promise<{ ok: true; request: ReferenceCheckRequest } | { ok: false; error: string }> {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx < 0) return { ok: false, error: 'Request not found.' };
  const row = normalize(all[idx]);
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

  const forcedAnon = Boolean(getGossipIdentity(refereeId)?.isAnonymous);
  const refereeAnon = forcedAnon || Boolean(options?.anonymous);
  const refereeReal =
    options?.realName?.trim() ||
    row.refereeRealName ||
    getGossipDisplayName(refereeId, `Member ${refereeId.slice(-4)}`);
  const requesterReal = row.requesterRealName || row.requesterName;

  all[idx] = {
    ...row,
    status: 'awaiting_answers',
    refereeAnonymous: refereeAnon,
    refereeRealName: refereeReal,
    refereeName: refereeAnon ? privacyMaskedLabel(refereeId) : refereeReal,
    requesterName: row.requesterAnonymous
      ? privacyMaskedLabel(row.requesterId)
      : requesterReal,
    updatedAt: now,
    messages: [
      ...row.messages,
      {
        id: uid('rm'),
        senderId: refereeId,
        text: refereeAnon
          ? 'Accepted — I’ll answer your questions (staying anonymous). You’ll be paid after they rate my answers.'
          : 'Accepted — I’ll answer your questions. You’ll be paid after they rate my answers.',
        createdAt: now,
      },
    ],
  };
  saveAll(all);
  return { ok: true, request: all[idx] };
}

export function sendReferenceMessage(
  requestId: string,
  senderId: string,
  text: string,
  options?: { mediaUrl?: string; mediaType?: ReferenceMediaType },
): { ok: true; request: ReferenceCheckRequest } | { ok: false; error: string } {
  const trimmed = text.trim();
  const mediaUrl = options?.mediaUrl?.trim() || undefined;
  const mediaType = mediaUrl ? options?.mediaType : undefined;
  if (!trimmed && !mediaUrl) return { ok: false, error: 'Message cannot be empty.' };

  const all = loadAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx < 0) return { ok: false, error: 'Conversation not found.' };
  const row = normalize(all[idx]);
  if (row.status !== 'active' && row.status !== 'awaiting_answers' && row.status !== 'answered') {
    return { ok: false, error: 'Chat is not active yet.' };
  }
  if (senderId !== row.requesterId && senderId !== row.refereeId) {
    return { ok: false, error: 'Not a participant.' };
  }

  const msg: ReferenceMessage = {
    id: uid('rm'),
    senderId,
    text: (trimmed || (mediaType === 'voice' ? 'Voice note' : mediaType === 'image' ? 'Image' : '')).slice(
      0,
      2000,
    ),
    createdAt: new Date().toISOString(),
    mediaUrl,
    mediaType,
  };
  const updated: ReferenceCheckRequest = {
    ...row,
    status: row.status === 'awaiting_answers' ? 'awaiting_answers' : 'active',
    messages: [...row.messages, msg],
    updatedAt: msg.createdAt,
  };
  all[idx] = updated;
  saveAll(all);
  return { ok: true, request: updated };
}

/**
 * Referee submits answers. Escrow stays held until the requester rates feedback.
 */
export async function submitReferenceAnswers(
  requestId: string,
  refereeId: string,
  answers: ReferenceAnswer[],
): Promise<{ ok: true; request: ReferenceCheckRequest } | { ok: false; error: string }> {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx < 0) return { ok: false, error: 'Request not found.' };
  const row = normalize(all[idx]);
  if (row.refereeId !== refereeId) return { ok: false, error: 'Not your request.' };
  if (row.status !== 'awaiting_answers' && row.status !== 'active') {
    return { ok: false, error: 'Accept the request before answering.' };
  }

  const cleaned = answers
    .map((a) => ({
      question: a.question.trim(),
      answer: a.answer.trim(),
    }))
    .filter((a) => a.question && a.answer);
  if (cleaned.length === 0) {
    return { ok: false, error: 'Answer at least one question.' };
  }

  const now = new Date().toISOString();
  const answerBlock = cleaned.map((a, i) => `Q${i + 1}: ${a.question}\nA: ${a.answer}`).join('\n\n');
  all[idx] = {
    ...row,
    answers: cleaned,
    status: 'answered',
    // Keep escrow until requester rates.
    escrowHeld: true,
    updatedAt: now,
    messages: [
      ...row.messages,
      {
        id: uid('rm'),
        senderId: refereeId,
        text: `Answers submitted:\n\n${answerBlock}\n\n(Waiting for your feedback before tokens are credited.)`,
        createdAt: now,
      },
    ],
  };
  saveAll(all);
  return { ok: true, request: all[idx] };
}

/**
 * Requester rates the answers → weighted payout to referee from escrow.
 */
export async function rateReferenceCheck(
  requestId: string,
  requesterId: string,
  rating: ReferenceRating,
): Promise<{ ok: true; request: ReferenceCheckRequest } | { ok: false; error: string }> {
  const all = loadAll();
  const idx = all.findIndex((r) => r.id === requestId);
  if (idx < 0) return { ok: false, error: 'Request not found.' };
  const row = normalize(all[idx]);
  if (row.requesterId !== requesterId) return { ok: false, error: 'Only the requester can rate.' };
  if (row.status !== 'answered') {
    return { ok: false, error: 'Rate after answers are submitted.' };
  }
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

  const referee = getGossipIdentity(row.refereeId);
  if (referee) {
    updateGossipIdentity(row.refereeId, {
      completedReferenceChecks: (referee.completedReferenceChecks || 0) + 1,
    });
  }

  const now = new Date().toISOString();
  const label =
    REFERENCE_RATING_OPTIONS.find((o) => o.id === rating)?.label || rating;
  all[idx] = {
    ...row,
    status: 'completed',
    escrowHeld: false,
    rating,
    payoutTokens: payout,
    updatedAt: now,
    messages: [
      ...row.messages,
      {
        id: uid('rm'),
        senderId: requesterId,
        text: `Feedback: ${label}. ${payout} tokens credited to the reference provider.`,
        createdAt: now,
      },
    ],
  };
  saveAll(all);
  return { ok: true, request: all[idx] };
}

export function pendingIncomingCount(userId: string): number {
  return loadAll().filter((r) => r.refereeId === userId && r.status === 'pending').length;
}
