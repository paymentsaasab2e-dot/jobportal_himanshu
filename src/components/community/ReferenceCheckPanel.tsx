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
} from '@/lib/social-store';
import {
  ensureHryantraVerifiedChat,
  getHryantraVerifiedChat,
} from '@/lib/hryantra-verified-chat-store';
import { getGossipIdentity } from '@/lib/community-store';
import { isUserOnline } from '@/lib/presence';
import type { ChatKind } from '@/components/community/ReferenceMessagingPanel';

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
  const [expandedId, setExpandedId] = useState<string | null>(focusRequestId);
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, Record<number, string>>>({});

  const refreshLocal = () => {
    setTick((n) => n + 1);
    onRefresh?.();
  };

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 4000);
    const onHry = () => setTick((n) => n + 1);
    window.addEventListener('saasa:hryantra-chat-updated', onHry);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('saasa:hryantra-chat-updated', onHry);
    };
  }, []);

  useEffect(() => {
    if (variant === 'chat' || variant === 'all') {
      ensureHryantraVerifiedChat(userId);
    }
  }, [userId, variant, tick]);

  useEffect(() => {
    if (focusRequestId) setExpandedId(focusRequestId);
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
        <div className="rounded-xl border border-slate-200/80 bg-white p-8 text-center shadow-sm">
          <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-semibold text-slate-800">No chats yet</p>
          <p className="mt-1 text-xs text-slate-500">
            Direct messages and follow requests will show up here.
          </p>
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
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
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
        <div className="flex border-b border-slate-100 px-1">
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

      <div className="space-y-3 p-3.5">
        {tab === 'reference' && variant !== 'chat' ? (
          <>
            <p className="text-[10px] text-slate-400">
              Track request status — accept, response, feedback.
            </p>
            {refList.map((r) => {
              const expanded = expandedId === r.id;
              const iAmReferee = r.refereeId === userId;
              const iAmRequester = r.requesterId === userId;
              const anonChoice =
                refAcceptAnon[r.id] !== undefined ? refAcceptAnon[r.id] : defaultAcceptAnon;
              const drafts = answerDrafts[r.id] || {};

              return (
                <div
                  key={r.id}
                  className={`space-y-2 rounded-xl border px-3 py-2.5 ${
                    focusRequestId === r.id
                      ? 'border-[#0A66C2] bg-sky-50/40'
                      : 'border-slate-200 bg-white'
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
                        {r.companyName} · {r.questions?.length || 0} questions
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
                                {REFERENCE_RATING_OPTIONS.map(({ id, label }) => (
                                  <button
                                    key={id}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => void handleRate(r.id, id)}
                                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                                  >
                                    {label}
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

        {tab === 'direct' ? (
          <>
            {hryantraChat ? (
              <button
                type="button"
                onClick={() => onOpenChat?.('hryantra', hryantraChat.id)}
                className={`mb-1 flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
                  activeChatKind === 'hryantra' && activeChatId === hryantraChat.id
                    ? 'border-sky-300 bg-sky-50 ring-1 ring-sky-200'
                    : 'border-sky-100 bg-gradient-to-r from-sky-50 to-white hover:border-sky-200'
                }`}
              >
                <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-slate-100 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/fs.png" alt="" className="h-8 w-8 object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 text-sm font-bold text-slate-900">
                    HRYantra
                    <BadgeCheck className="h-3.5 w-3.5 text-[#0A66C2]" aria-label="Verified" />
                  </span>
                  <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                    {hryantraChat.messages[hryantraChat.messages.length - 1]?.text ||
                      'Verified official chat'}
                  </span>
                </span>
                {hryantraChat.unreadCount > 0 ? (
                  <span className="rounded-full bg-[#0A66C2] px-2 py-0.5 text-[10px] font-bold text-white">
                    {hryantraChat.unreadCount}
                  </span>
                ) : (
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[#0A66C2]">
                    Verified
                  </span>
                )}
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
