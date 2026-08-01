'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, EyeOff, MessageSquare, ShieldCheck, X, BadgeCheck } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import {
  getReferencePeerLabel,
  listReferenceChecksForUser,
  pendingIncomingCount,
  rateReferenceCheck,
  REFERENCE_RATING_OPTIONS,
  respondReferenceCheck,
  submitReferenceAnswers,
  type ReferenceCheckRequest,
  type ReferenceRating,
} from '@/lib/reference-check-store';
import {
  getDmPeerLabel,
  getFollowRequesterLabel,
  listDmThreadsForUser,
  listIncomingPeopleFollows,
  pendingDmIncomingCount,
  pendingFollowIncomingCount,
  respondDirectMessage,
  respondPeopleFollow,
  softPullSocialFromServer,
  SOCIAL_UPDATED_EVENT,
} from '@/lib/social-store';
import {
  ensureHryantraVerifiedChat,
  getHryantraVerifiedChat,
} from '@/lib/hryantra-verified-chat-store';
import { getGossipIdentity } from '@/lib/community-store';
import { isUserOnline } from '@/lib/presence';
import type { ChatKind } from '@/components/community/ReferenceMessagingPanel';
import { ReferenceCheckDetailModal } from '@/components/community/ReferenceCheckDetailModal';

type Props = {
  userId: string;
  activeChatId?: string | null;
  activeChatKind?: ChatKind | null;
  /** Highlight / expand a request after submit (reference page — no chat). */
  focusRequestId?: string | null;
  /** `chat` = DMs + follows only (Office Gossips). `reference` = paid checks only. `all` = both. */
  variant?: 'all' | 'chat' | 'reference';
  onRefresh?: () => void;
  onOpenCompany?: (companyPageId: string) => void;
  onOpenChat?: (kind: ChatKind, id: string) => void;
};

/** Inbox: Reference (paid) vs Direct (free), plus follow requests. */
export function ReferenceCheckPanel({
  userId,
  activeChatId,
  activeChatKind,
  focusRequestId = null,
  variant = 'all',
  onRefresh,
  onOpenCompany,
  onOpenChat,
}: Props) {
  const defaultTab =
    variant === 'chat' ? 'direct' : variant === 'reference' ? 'reference' : 'reference';
  const [tab, setTab] = useState<'reference' | 'direct' | 'follows'>(defaultTab);
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [dmAcceptAnon, setDmAcceptAnon] = useState<Record<string, boolean>>({});
  const [refAcceptAnon, setRefAcceptAnon] = useState<Record<string, boolean>>({});
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailRequestId, setDetailRequestId] = useState<string | null>(focusRequestId);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, Record<number, string>>>({});

  const refreshLocal = () => {
    setTick((n) => n + 1);
    onRefresh?.();
  };

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 4000);
    const onHry = () => setTick((n) => n + 1);
    const onSocial = () => setTick((n) => n + 1);
    window.addEventListener('saasa:hryantra-chat-updated', onHry);
    window.addEventListener(SOCIAL_UPDATED_EVENT, onSocial);
    window.addEventListener('saasa:office-gossips-hydrated', onSocial);

    const softTimer = window.setInterval(() => {
      if (variant === 'chat' || variant === 'all') {
        void softPullSocialFromServer();
      }
    }, 15_000);

    return () => {
      window.clearInterval(id);
      window.clearInterval(softTimer);
      window.removeEventListener('saasa:hryantra-chat-updated', onHry);
      window.removeEventListener(SOCIAL_UPDATED_EVENT, onSocial);
      window.removeEventListener('saasa:office-gossips-hydrated', onSocial);
    };
  }, [variant]);

  useEffect(() => {
    if (variant === 'chat' || variant === 'all') {
      ensureHryantraVerifiedChat(userId);
    }
  }, [userId, variant, tick]);

  useEffect(() => {
    if (focusRequestId) setDetailRequestId(focusRequestId);
  }, [focusRequestId]);

  const hryantraChat = useMemo(
    () =>
      variant === 'chat' || variant === 'all' ? getHryantraVerifiedChat(userId) : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, variant, tick],
  );

  const myIdentity = getGossipIdentity(userId);
  const forcedAnon = Boolean(myIdentity?.isAnonymous);
  const defaultAcceptAnon = forcedAnon || Boolean(myIdentity?.followAnonymously);

  const refChecks = useMemo(
    () => listReferenceChecksForUser(userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, tick],
  );
  const dms = useMemo(
    () => listDmThreadsForUser(userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, tick],
  );
  const followIncoming = useMemo(
    () => listIncomingPeopleFollows(userId),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [userId, tick],
  );

  const refIncoming = refChecks.filter((r) => r.refereeId === userId && r.status === 'pending');
  const refList = refChecks.filter((r) => r.status !== 'cancelled');
  const dmIncoming = dms.filter((d) => d.toUserId === userId && d.status === 'pending');
  const dmOutgoingPending = dms.filter(
    (d) => d.fromUserId === userId && d.status === 'pending',
  );
  const dmActive = dms.filter((d) => d.status === 'active');
  const dmOpen = dms.filter((d) => d.status === 'active' || d.status === 'pending');

  const badge =
    (variant !== 'chat' ? pendingIncomingCount(userId) : 0) +
    (variant !== 'reference' ? pendingDmIncomingCount(userId) + pendingFollowIncomingCount(userId) : 0);

  useEffect(() => {
    setTab(defaultTab);
  }, [defaultTab]);

  const statusLabel = (r: ReferenceCheckRequest, viewerId: string) => {
    const iAmRequester = r.requesterId === viewerId;
    if (r.status === 'pending') {
      return iAmRequester ? 'Waiting for accept' : 'Needs your decision';
    }
    if (r.status === 'rejected') return 'Rejected';
    if (r.status === 'awaiting_answers') {
      return iAmRequester ? 'Accepted · waiting for response' : 'Accepted · answer questions';
    }
    if (r.status === 'answered') {
      return iAmRequester ? 'Response ready · rate it' : 'Response sent';
    }
    if (r.status === 'completed') {
      const label =
        REFERENCE_RATING_OPTIONS.find((o) => o.id === r.rating)?.label || 'Completed';
      return `Completed · ${label}`;
    }
    return r.status;
  };

  const statusTone = (r: ReferenceCheckRequest) => {
    if (r.status === 'rejected') return 'bg-rose-50 text-rose-700 ring-rose-100';
    if (r.status === 'completed') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
    if (r.status === 'answered') return 'bg-sky-50 text-[#0A66C2] ring-sky-100';
    if (r.status === 'awaiting_answers') return 'bg-amber-50 text-amber-800 ring-amber-100';
    return 'bg-slate-100 text-slate-600 ring-slate-200';
  };

  const handleRefRespond = async (requestId: string, accept: boolean) => {
    setBusy(true);
    try {
      const anon =
        refAcceptAnon[requestId] !== undefined
          ? refAcceptAnon[requestId]
          : defaultAcceptAnon;
      const result = await respondReferenceCheck(requestId, userId, accept, {
        anonymous: accept ? anon : undefined,
      });
      if (!result.ok) {
        showErrorToast('Reference', result.error);
        return;
      }
      showSuccessToast(accept ? 'Accepted' : 'Rejected');
      setExpandedId(requestId);
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitAnswers = async (r: ReferenceCheckRequest) => {
    setBusy(true);
    try {
      const drafts = answerDrafts[r.id] || {};
      const payload = r.questions.map((q, i) => ({
        question: q,
        answer: (drafts[i] || '').trim(),
      }));
      const result = await submitReferenceAnswers(r.id, userId, payload);
      if (!result.ok) {
        showErrorToast('Answers', result.error);
        return;
      }
      showSuccessToast('Response sent');
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const handleRate = async (requestId: string, rating: ReferenceRating) => {
    setBusy(true);
    try {
      const result = await rateReferenceCheck(requestId, userId, rating);
      if (!result.ok) {
        showErrorToast('Feedback', result.error);
        return;
      }
      showSuccessToast('Thanks', 'Feedback saved.');
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const handleDmRespond = (threadId: string, accept: boolean) => {
    setBusy(true);
    try {
      const anon =
        dmAcceptAnon[threadId] !== undefined ? dmAcceptAnon[threadId] : defaultAcceptAnon;
      const result = respondDirectMessage(threadId, userId, accept, {
        anonymous: accept ? anon : undefined,
      });
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
      showSuccessToast(
        accept ? 'Accepted' : 'Declined',
        accept
          ? anon || forcedAnon
            ? 'Chat opened — you stay anonymous.'
            : 'Chat opened — your name is visible to them.'
          : undefined,
      );
      if (accept) onOpenChat?.('dm', threadId);
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const handleFollowRespond = (followId: string, accept: boolean) => {
    setBusy(true);
    try {
      const result = respondPeopleFollow(followId, userId, accept);
      if (!result.ok) {
        showErrorToast('Follow', result.error);
        return;
      }
      showSuccessToast(accept ? 'Follow accepted' : 'Follow declined');
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  if (variant === 'chat') {
    if (
      !hryantraChat &&
      dmIncoming.length === 0 &&
      dmOpen.length === 0 &&
      followIncoming.length === 0
    ) {
      return (
        <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] bg-linear-to-br from-[#28A8E1] via-[#5BB8E8] to-[#FC9620] p-[1.5px] shadow-[0_12px_30px_rgba(40,168,225,0.12),0_4px_16px_rgba(252,150,32,0.1)]">
          <div className="flex h-full flex-col items-center justify-center rounded-[22.5px] bg-white px-6 text-center">
            <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-800">No chats yet</p>
            <p className="mt-1 text-xs text-slate-500">
              Direct messages and follow requests will show up here.
            </p>
          </div>
        </div>
      );
    }
  } else if (variant === 'reference') {
    if (refList.length === 0) {
      return (
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <ShieldCheck className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-800">No reference checks</p>
          <p className="mt-1 text-xs text-slate-500">
            Request or accept reference checks from company pages.
          </p>
        </div>
      );
    }
  } else if (
    refList.length === 0 &&
    dmIncoming.length === 0 &&
    dmOpen.length === 0 &&
    followIncoming.length === 0
  ) {
    return null;
  }

  const tabs =
    variant === 'chat'
      ? ([
          ['direct', 'Direct'],
          ['follows', 'Follows'],
        ] as const)
      : variant === 'reference'
        ? ([['reference', 'Reference']] as const)
        : ([
            ['reference', 'Reference'],
            ['direct', 'Direct'],
            ['follows', 'Follows'],
          ] as const);

  return (
    <div
      className={
        variant === 'chat'
          ? 'flex h-full min-h-0 flex-col overflow-hidden rounded-[24px] bg-linear-to-br from-[#28A8E1] via-[#5BB8E8] to-[#FC9620] p-[1.5px] shadow-[0_12px_30px_rgba(40,168,225,0.12),0_4px_16px_rgba(252,150,32,0.1)]'
          : 'rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]'
      }
    >
      <div
        className={
          variant === 'chat'
            ? 'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[22.5px] bg-linear-to-b from-white via-[#FBFCFE] to-[#F8FAFD]'
            : 'contents'
        }
      >
        {variant === 'chat' ? (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,150,32,0.1),transparent_36%),radial-gradient(circle_at_top_left,rgba(40,168,225,0.1),transparent_40%)]" />
        ) : null}
      <div className="relative flex shrink-0 items-center justify-between border-b border-slate-100/80 px-3.5 py-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          {variant === 'chat' ? (
            <MessageSquare className="h-4 w-4 text-[#0A66C2]" />
          ) : (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          )}
          {variant === 'chat' ? 'Chats' : variant === 'reference' ? 'Reference Check' : 'Messaging'}
        </h2>
        {badge > 0 ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            {badge} new
          </span>
        ) : null}
      </div>

      {tabs.length > 1 ? (
        <div className="relative flex shrink-0 border-b border-slate-100/80 px-1">
          {tabs.map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex-1 px-2 py-2 text-[11px] font-semibold ${
                tab === id
                  ? 'border-b-2 border-[#0A66C2] text-[#0A66C2]'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {label}
              {id === 'direct' && dmIncoming.length > 0 ? (
                <span className="ml-1 text-amber-700">({dmIncoming.length})</span>
              ) : null}
              {id === 'follows' && followIncoming.length > 0 ? (
                <span className="ml-1 text-amber-700">({followIncoming.length})</span>
              ) : null}
            </button>
          ))}
        </div>
      ) : null}

      <div
        className={`relative space-y-3 p-3.5 ${
          variant === 'chat' ? `min-h-0 flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden` : ''
        }`}
      >        {tab === 'reference' && variant !== 'chat' ? (
          <>
            <p className="text-[10px] text-slate-400">
              Track request status — accept, response, feedback.
            </p>
            {refList.map((r) => {
              const iAmReferee = r.refereeId === userId;
              const iAmRequester = r.requesterId === userId;
              const anonChoice =
                refAcceptAnon[r.id] !== undefined ? refAcceptAnon[r.id] : defaultAcceptAnon;
              const drafts = answerDrafts[r.id] || {};
              const useModal = variant === 'reference';
              const expanded = !useModal && expandedId === r.id;
              const selected = focusRequestId === r.id || detailRequestId === r.id;
              const qCount = r.questions?.length || 0;
              const detailCta =
                r.status === 'answered' || r.status === 'completed'
                  ? 'View response'
                  : r.status === 'pending' && iAmReferee
                    ? 'Review request'
                    : r.status === 'awaiting_answers' && iAmReferee
                      ? 'Answer questions'
                      : 'View details';

              if (useModal) {
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setDetailRequestId(r.id)}
                    className={`group w-full rounded-2xl border p-3 text-left transition ${
                      selected
                        ? 'border-[#0A66C2] bg-gradient-to-br from-sky-50 to-white shadow-sm ring-1 ring-[#0A66C2]/20'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1B3A5F] text-[11px] font-bold uppercase text-white">
                        {(getReferencePeerLabel(r, userId) || '?').slice(0, 1)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm font-semibold leading-snug text-slate-900">
                          {getReferencePeerLabel(r, userId)}
                        </p>
                        <p className="mt-0.5 break-words text-[11px] text-slate-500">
                          {r.companyName}
                        </p>
                        <span
                          className={`mt-2 inline-flex max-w-full rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusTone(r)}`}
                        >
                          {statusLabel(r, userId)}
                        </span>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                            {qCount} question{qCount === 1 ? '' : 's'}
                          </span>
                          {r.feeTokens ? (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold text-amber-900">
                              <TokenCoinIcon className="h-3 w-3" />
                              {r.feeTokens}
                            </span>
                          ) : null}
                        </div>
                        <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-semibold text-[#0A66C2] group-hover:underline">
                          {detailCta}
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                    </div>
                  </button>
                );
              }

              return (
                <div
                  key={r.id}
                  className={`space-y-2 rounded-xl border px-3 py-2.5 ${
                    selected ? 'border-[#0A66C2] bg-sky-50/40' : 'border-slate-200 bg-white'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : r.id)}
                    className="flex w-full items-start justify-between gap-2 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {getReferencePeerLabel(r, userId)}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {r.companyName} · {qCount} questions
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusTone(r)}`}
                    >
                      {statusLabel(r, userId)}
                    </span>
                  </button>

                  {expanded ? (
                    <div className="space-y-2 border-t border-slate-100 pt-2">
                      {r.status === 'pending' && iAmReferee ? (
                        <>
                          <label
                            className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700 ${
                              forcedAnon ? 'opacity-80' : 'cursor-pointer'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={anonChoice}
                              disabled={forcedAnon || busy}
                              onChange={(e) =>
                                setRefAcceptAnon((m) => ({ ...m, [r.id]: e.target.checked }))
                              }
                              className="rounded border-slate-300 text-[#0A66C2]"
                            />
                            <EyeOff className="h-3.5 w-3.5" />
                            Stay anonymous
                          </label>
                          <div className="flex gap-1.5">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleRefRespond(r.id, true)}
                              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full bg-emerald-600 text-xs font-semibold text-white disabled:opacity-50"
                            >
                              <Check className="h-3.5 w-3.5" />
                              Accept
                            </button>
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => void handleRefRespond(r.id, false)}
                              className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-600 disabled:opacity-50"
                            >
                              <X className="h-3.5 w-3.5" />
                              Reject
                            </button>
                          </div>
                        </>
                      ) : null}

                      {r.status === 'pending' && iAmRequester ? (
                        <p className="text-[11px] text-slate-500">
                          Waiting for them to accept or reject.
                        </p>
                      ) : null}

                      {r.status === 'awaiting_answers' && iAmReferee ? (
                        <div className="space-y-2">
                          {r.questions.map((q, i) => (
                            <div key={`${r.id}-q-${i}`}>
                              <p className="text-[11px] font-semibold text-slate-800">
                                {i + 1}. {q}
                              </p>
                              <WritingAssistField
                                value={drafts[i] || ''}
                                onChange={(next) =>
                                  setAnswerDrafts((prev) => ({
                                    ...prev,
                                    [r.id]: { ...drafts, [i]: next },
                                  }))
                                }
                                rows={2}
                                placeholder="Your answer…"
                                className="mt-1 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-[12px] outline-none focus:border-[#0A66C2]"
                              />
                            </div>
                          ))}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleSubmitAnswers(r)}
                            className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-full bg-[#0A66C2] text-xs font-semibold text-white disabled:opacity-50"
                          >
                            <Check className="h-3.5 w-3.5" />
                            Send response
                          </button>
                        </div>
                      ) : null}

                      {r.status === 'awaiting_answers' && iAmRequester ? (
                        <p className="text-[11px] text-slate-500">
                          Accepted. Waiting for their response.
                        </p>
                      ) : null}

                      {r.status === 'answered' || r.status === 'completed' ? (
                        <div className="space-y-2">
                          {r.answers?.length ? (
                            <ul className="max-h-40 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-2.5">
                              {r.answers.map((a, i) => (
                                <li key={`${r.id}-a-${i}`} className="text-[11px] text-slate-700">
                                  <p className="font-semibold text-slate-500">Q: {a.question}</p>
                                  <p className="mt-0.5 whitespace-pre-wrap">{a.answer}</p>
                                </li>
                              ))}
                            </ul>
                          ) : null}
                          {r.status === 'answered' && iAmRequester && r.escrowHeld ? (
                            <div>
                              <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                                Your feedback
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {REFERENCE_RATING_OPTIONS.map(({ id, label, payoutPct }) => (
                                  <button
                                    key={id}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleRate(r.id, id)}
                                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    {label} · {payoutPct}%
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : null}
                          {r.status === 'completed' && r.payoutTokens != null ? (
                            <p className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700">
                              <TokenCoinIcon className="h-3.5 w-3.5" />
                              {r.payoutTokens} paid out
                            </p>
                          ) : null}
                        </div>
                      ) : null}

                      {r.status === 'rejected' ? (
                        <p className="text-[11px] text-rose-600">This request was rejected.</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              );
            })}
            {refList.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-400">No reference requests.</p>
            ) : null}
          </>
        ) : null}

        {detailRequestId && variant === 'reference' ? (
          <ReferenceCheckDetailModal
            requestId={detailRequestId}
            userId={userId}
            onClose={() => setDetailRequestId(null)}
            onChanged={refreshLocal}
          />
        ) : null}

        {tab === 'direct' ? (
          <>
            {hryantraChat ? (
              <button
                type="button"
                onClick={() => onOpenChat?.('hryantra', hryantraChat.id)}
                className={`mb-1 w-full rounded-[18px] p-[1.5px] text-left transition ${
                  activeChatKind === 'hryantra' && activeChatId === hryantraChat.id
                    ? 'bg-linear-to-br from-[#28A8E1] via-[#5BB8E8] to-[#FC9620] shadow-[0_8px_20px_rgba(40,168,225,0.16)]'
                    : 'bg-linear-to-br from-[#28A8E1]/70 via-[#5BB8E8]/50 to-[#FC9620]/70 hover:from-[#28A8E1] hover:to-[#FC9620]'
                }`}
              >
                <span className="flex w-full items-center gap-2.5 rounded-[16.5px] bg-linear-to-r from-white via-[#F7FBFE] to-[#FFF8F1] px-3 py-2.5">
                  <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-white shadow-sm">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/fs.png" alt="" className="h-8 w-8 object-contain" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
                      HRYantra
                      <BadgeCheck className="h-3.5 w-3.5 text-[#28A8E1]" aria-label="Verified" />
                    </span>
                    <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                      {hryantraChat.messages[hryantraChat.messages.length - 1]?.text ||
                        'Official updates'}
                    </span>
                  </span>
                  {hryantraChat.unreadCount > 0 ? (
                    <span className="rounded-full bg-[#FC9620] px-2 py-0.5 text-[10px] font-bold text-white">
                      {hryantraChat.unreadCount}
                    </span>
                  ) : null}
                </span>
              </button>
            ) : null}

            {dmIncoming.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                  Message requests · Accept or Reject
                </p>
                <p className="text-[10px] text-slate-400">
                  Real names stay hidden until you accept. Choose anonymity before accepting.
                </p>
                {dmIncoming.map((d) => {
                  const anonChoice =
                    dmAcceptAnon[d.id] !== undefined ? dmAcceptAnon[d.id] : defaultAcceptAnon;
                  return (
                    <IncomingRow
                      key={d.id}
                      title={getDmPeerLabel(d, userId)}
                      subtitle={d.companyName || 'Direct message request'}
                      badge={d.fromAnonymous ? 'They stay anonymous' : 'Wants to reveal after accept'}
                      onCompany={
                        d.companyPageId ? () => onOpenCompany?.(d.companyPageId!) : undefined
                      }
                      busy={busy}
                      anonymity={{
                        checked: anonChoice,
                        locked: forcedAnon,
                        onChange: (v) => setDmAcceptAnon((m) => ({ ...m, [d.id]: v })),
                      }}
                      onAccept={() => handleDmRespond(d.id, true)}
                      onDecline={() => handleDmRespond(d.id, false)}
                    />
                  );
                })}
              </div>
            ) : null}

            {dmOutgoingPending.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Waiting for reply
                </p>
                {dmOutgoingPending.map((d) => (
                  <ChatRow
                    key={d.id}
                    active={activeChatKind === 'dm' && activeChatId === d.id}
                    name={getDmPeerLabel(d, userId)}
                    status="pending"
                    online={isUserOnline(d.toUserId)}
                    onClick={() => onOpenChat?.('dm', d.id)}
                  />
                ))}
              </div>
            ) : null}

            {dmActive.length > 0 ? (
              <div className="space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                  Active chats
                </p>
                {dmActive.map((d) => {
                  const otherId = d.fromUserId === userId ? d.toUserId : d.fromUserId;
                  return (
                    <ChatRow
                      key={d.id}
                      active={activeChatKind === 'dm' && activeChatId === d.id}
                      name={getDmPeerLabel(d, userId)}
                      status={d.status}
                      online={isUserOnline(otherId)}
                      onClick={() => onOpenChat?.('dm', d.id)}
                    />
                  );
                })}
              </div>
            ) : null}

            {dmIncoming.length === 0 && dmOpen.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-400">No direct chats.</p>
            ) : null}
          </>
        ) : null}

        {tab === 'follows' ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">
              Follow requests · Accept or Reject
            </p>
            <p className="text-[10px] text-slate-400">
              Requester real names stay hidden until you accept.
            </p>
            {followIncoming.map((f) => (
              <IncomingRow
                key={f.id}
                title={getFollowRequesterLabel(f)}
                subtitle="Wants to follow you"
                badge={f.anonymous ? 'Anonymous follow' : 'Will reveal name if accepted'}
                busy={busy}
                onAccept={() => handleFollowRespond(f.id, true)}
                onDecline={() => handleFollowRespond(f.id, false)}
              />
            ))}
            {followIncoming.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-400">No follow requests.</p>
            ) : null}
          </>
        ) : null}
      </div>
      </div>
    </div>
  );
}

function IncomingRow({
  title,
  subtitle,
  badge,
  onCompany,
  busy,
  anonymity,
  onAccept,
  onDecline,
}: {
  title: string;
  subtitle: string;
  badge?: string;
  onCompany?: () => void;
  busy: boolean;
  anonymity?: {
    checked: boolean;
    locked: boolean;
    onChange: (v: boolean) => void;
  };
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-amber-200/80 bg-amber-50/60 px-3 py-2.5">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
          {onCompany ? (
            <button
              type="button"
              onClick={onCompany}
              className="text-[11px] font-medium text-[#0A66C2] hover:underline"
            >
              {subtitle}
            </button>
          ) : (
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          )}
          {badge ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] font-medium text-slate-500">
              <EyeOff className="h-3 w-3" />
              {badge}
            </p>
          ) : null}
        </div>
        <div className="flex gap-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={onAccept}
            className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Accept
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onDecline}
            className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            <X className="h-3.5 w-3.5" />
            Reject
          </button>
        </div>
      </div>
      {anonymity ? (
        <label
          className={`flex items-center gap-2 rounded-md border border-slate-200/80 bg-white/80 px-2.5 py-1.5 text-[11px] text-slate-700 ${
            anonymity.locked ? 'opacity-80' : 'cursor-pointer'
          }`}
        >
          <input
            type="checkbox"
            checked={anonymity.checked}
            disabled={anonymity.locked || busy}
            onChange={(e) => anonymity.onChange(e.target.checked)}
            className="rounded border-slate-300 text-[#0A66C2]"
          />
          <span>
            Stay anonymous in this chat
            {anonymity.locked ? ' (profile is anonymous)' : ''}
          </span>
        </label>
      ) : null}
    </div>
  );
}

function ChatRow({
  name,
  status,
  active,
  online,
  onClick,
}: {
  name: string;
  status: string;
  active: boolean;
  online?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition ${
        active ? 'bg-sky-50 ring-1 ring-sky-200' : 'hover:bg-sky-50'
      }`}
    >
      <span className="relative shrink-0">
        <MessageSquare className="h-3.5 w-3.5 text-[#0A66C2]" />
        <span
          className={`absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full ${
            online ? 'bg-emerald-500' : 'bg-rose-400'
          }`}
        />
      </span>
      <span className="min-w-0 flex-1 truncate font-semibold text-slate-800">{name}</span>
      <span className="shrink-0 text-[10px] uppercase text-slate-400">{status}</span>
    </button>
  );
}
