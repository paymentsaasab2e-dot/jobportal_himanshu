'use client';

import { useEffect, useRef, useState } from 'react';
import { BadgeCheck, Check, Minus, Send, X, ArrowLeft } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import {
  getReferenceCheck,
  getReferencePeerLabel,
  rateReferenceCheck,
  respondReferenceCheck,
  REFERENCE_RATING_OPTIONS,
  sendReferenceMessage,
  submitReferenceAnswers,
  type ReferenceRating,
} from '@/lib/reference-check-store';
import {
  getDmPeerLabel,
  getDmThread,
  respondDirectMessage,
  sendDirectMessage,
} from '@/lib/social-store';
import {
  getHryantraVerifiedChatById,
  HRYANTRA_SYSTEM_SENDER_ID,
  markHryantraVerifiedChatRead,
  sendHryantraVerifiedUserMessage,
} from '@/lib/hryantra-verified-chat-store';
import { recordSuggestionClick } from '@/lib/suggestions-engine';
import { getGossipIdentity } from '@/lib/community-store';
import { isUserOnline } from '@/lib/presence';

export type ChatKind = 'reference' | 'dm' | 'hryantra';

type Props = {
  kind: ChatKind;
  chatId: string;
  userId: string;
  onClose: () => void;
  onRefresh?: () => void;
  /** `embedded` = WhatsApp-style pane in the main Chat section (default for Community). */
  mode?: 'float' | 'embedded';
};

/** Messaging window — float popup or embedded main-pane (WhatsApp-style). */
export function ReferenceMessagingPanel({
  kind,
  chatId,
  userId,
  onClose,
  onRefresh,
  mode = 'float',
}: Props) {
  const embedded = mode === 'embedded';
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [acceptAnon, setAcceptAnon] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const myIdentity = getGossipIdentity(userId);
  const forcedAnon = Boolean(myIdentity?.isAnonymous);

  useEffect(() => {
    setMinimized(false);
    setDraft('');
    setAnswers({});
    setAcceptAnon(forcedAnon || Boolean(myIdentity?.followAnonymously));
    if (kind === 'hryantra') {
      markHryantraVerifiedChatRead(userId);
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [chatId, kind, forcedAnon, myIdentity?.followAnonymously, userId]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1500);
    const onHry = () => setTick((n) => n + 1);
    window.addEventListener('saasa:hryantra-chat-updated', onHry);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('saasa:hryantra-chat-updated', onHry);
    };
  }, [chatId, kind]);

  void tick;

  const refLive = kind === 'reference' ? getReferenceCheck(chatId) : null;
  const dmLive = kind === 'dm' ? getDmThread(chatId) : null;
  const hryLive = kind === 'hryantra' ? getHryantraVerifiedChatById(chatId) : null;

  const otherUserId =
    kind === 'reference' && refLive
      ? refLive.requesterId === userId
        ? refLive.refereeId
        : refLive.requesterId
      : dmLive
        ? dmLive.fromUserId === userId
          ? dmLive.toUserId
          : dmLive.fromUserId
        : null;

  const other =
    kind === 'hryantra'
      ? 'HRYantra'
      : kind === 'reference' && refLive
        ? getReferencePeerLabel(refLive, userId)
        : dmLive
          ? getDmPeerLabel(dmLive, userId)
          : 'Chat';
  const otherInitial = kind === 'hryantra' ? 'H' : other.slice(0, 1).toUpperCase();
  const online = kind === 'hryantra' ? true : isUserOnline(otherUserId);
  const status =
    kind === 'hryantra' ? 'verified' : kind === 'reference' ? refLive?.status : dmLive?.status;
  const subtitle =
    kind === 'hryantra'
      ? 'Verified · official updates'
      : kind === 'reference'
        ? `${refLive?.companyName || 'Reference'} · paid`
        : `${dmLive?.companyName || 'Direct message'} · free`;
  const messages =
    kind === 'hryantra'
      ? hryLive?.messages || []
      : kind === 'reference'
        ? refLive?.messages || []
        : dmLive?.messages || [];
  const canChat =
    kind === 'hryantra' ||
    status === 'active' ||
    status === 'awaiting_answers' ||
    status === 'answered';
  const canRate =
    kind === 'reference' &&
    refLive?.status === 'answered' &&
    refLive.requesterId === userId &&
    Boolean(refLive.answers?.length) &&
    Boolean(refLive.escrowHeld);
  const iAmDmRecipient =
    kind === 'dm' && dmLive?.status === 'pending' && dmLive.toUserId === userId;
  const iAmRefRecipient =
    kind === 'reference' && refLive?.status === 'pending' && refLive.refereeId === userId;
  const iAmRefAnswerer =
    kind === 'reference' &&
    refLive?.status === 'awaiting_answers' &&
    refLive.refereeId === userId;

  useEffect(() => {
    if (!minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, tick, minimized, chatId]);

  if (
    (kind === 'reference' && !refLive) ||
    (kind === 'dm' && !dmLive) ||
    (kind === 'hryantra' && !hryLive)
  ) {
    return (
      <div
        className={
          embedded
            ? 'flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500'
            : 'fixed bottom-4 right-4 z-[80] w-[min(360px,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-2xl'
        }
      >
        Conversation not found.
        <button type="button" onClick={onClose} className="ml-2 font-semibold text-[#0A66C2]">
          Close
        </button>
      </div>
    );
  }

  const handleSend = () => {
    if (kind === 'hryantra') {
      const result = sendHryantraVerifiedUserMessage(userId, draft);
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
    } else if (kind === 'reference') {
      const result = sendReferenceMessage(chatId, userId, draft);
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
    } else {
      const result = sendDirectMessage(chatId, userId, draft);
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
    }
    setDraft('');
    setTick((n) => n + 1);
    onRefresh?.();
  };

  const handleDmRespond = (accept: boolean) => {
    setBusy(true);
    try {
      const result = respondDirectMessage(chatId, userId, accept, {
        anonymous: accept ? acceptAnon || forcedAnon : undefined,
      });
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
      showSuccessToast(accept ? 'Accepted' : 'Rejected');
      setTick((n) => n + 1);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const handleRefRespond = async (accept: boolean) => {
    setBusy(true);
    try {
      const result = await respondReferenceCheck(chatId, userId, accept, {
        anonymous: accept ? acceptAnon || forcedAnon : undefined,
      });
      if (!result.ok) {
        showErrorToast('Reference', result.error);
        return;
      }
      showSuccessToast(
        accept ? 'Accepted' : 'Rejected',
        accept ? 'Answer questions. You’ll be paid after they rate your response.' : undefined,
      );
      setTick((n) => n + 1);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!refLive) return;
    setBusy(true);
    try {
      const payload = refLive.questions.map((q, i) => ({
        question: q,
        answer: (answers[i] || '').trim(),
      }));
      const result = await submitReferenceAnswers(chatId, userId, payload);
      if (!result.ok) {
        showErrorToast('Answers', result.error);
        return;
      }
      showSuccessToast(
        'Submitted',
        'Answers sent. You’ll be paid after they rate your response.',
      );
      setTick((n) => n + 1);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const handleRate = async (rating: ReferenceRating) => {
    setBusy(true);
    try {
      const result = await rateReferenceCheck(chatId, userId, rating);
      if (!result.ok) {
        showErrorToast('Rating', result.error);
        return;
      }
      showSuccessToast('Thanks', 'Feedback saved — payout sent to the reference provider.');
      setTick((n) => n + 1);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  if (!embedded && minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[80] flex w-[min(280px,calc(100vw-1.5rem))] items-center gap-2 rounded-t-xl border border-slate-700 bg-[#1B3A5F] px-3 py-3 text-left text-white shadow-2xl"
      >
        {kind === 'hryantra' ? (
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fs.png" alt="" className="h-7 w-7 object-contain" />
          </span>
        ) : (
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
            {otherInitial}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#1B3A5F] ${
                online ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
              title={online ? 'Online' : 'Offline'}
            />
          </span>
        )}
        <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-sm font-semibold">
          {other}
          {kind === 'hryantra' ? (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-label="Verified" />
          ) : null}
        </span>
        <span className="text-[10px] uppercase text-white/60">{status}</span>
      </button>
    );
  }

  return (
    <div
      className={
        embedded
          ? 'flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm'
          : 'fixed bottom-0 right-3 z-[80] flex h-[min(520px,75vh)] w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-t-xl border border-slate-200 border-b-0 bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.2)] sm:bottom-4 sm:right-4 sm:rounded-xl sm:border-b'
      }
    >
      <div className="flex shrink-0 items-center gap-2 bg-[#1B3A5F] px-3 py-2.5 text-white">
        {kind === 'hryantra' ? (
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fs.png" alt="" className="h-8 w-8 object-contain" />
          </div>
        ) : (
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
            {otherInitial}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#1B3A5F] ${
                online ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
              title={online ? 'Online' : 'Offline'}
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 truncate text-sm font-semibold">
            {other}
            {kind === 'hryantra' ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-sky-300" aria-label="Verified" />
            ) : null}
          </p>
          <p className="truncate text-[11px] text-white/70">
            {kind === 'hryantra' ? (
              <span className="text-emerald-300">Official</span>
            ) : (
              <span className={online ? 'text-emerald-300' : 'text-rose-300'}>
                {online ? 'Active now' : 'Offline'}
              </span>
            )}
            {' · '}
            {subtitle}
          </p>
        </div>
        {embedded ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-white/80 hover:bg-white/10 lg:hidden"
            title="Back to chats"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="rounded-md p-1.5 text-white/80 hover:bg-white/10"
              title="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-white/80 hover:bg-white/10"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-[#F4F2EE] px-3 py-3">
        {messages.length === 0 ? (
          <p className="rounded-lg bg-white/90 px-3 py-4 text-center text-xs text-slate-500">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === userId;
            const isSystem =
              kind === 'hryantra' && m.senderId === HRYANTRA_SYSTEM_SENDER_ID;
            const actionUrl =
              kind === 'hryantra' && 'actionUrl' in m
                ? (m as { actionUrl?: string }).actionUrl
                : undefined;
            const hqMeta =
              kind === 'hryantra' && 'hqMeta' in m
                ? (m as { hqMeta?: Record<string, unknown> }).hqMeta
                : undefined;
            const recoverySuggestionId =
              (hqMeta?.source === 'suggestions-engine' ||
                hqMeta?.source === 'rejection-recovery') &&
              typeof hqMeta.suggestionId === 'string'
                ? hqMeta.suggestionId
                : null;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm ${
                    mine
                      ? 'rounded-br-md bg-[#0A66C2] text-white'
                      : isSystem
                        ? 'rounded-bl-md border border-sky-100 bg-sky-50 text-slate-800'
                        : 'rounded-bl-md bg-white text-slate-800'
                  }`}
                >
                  {isSystem ? (
                    <p className="mb-1 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-[#0A66C2]">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/fs.png" alt="" className="h-3.5 w-3.5 object-contain" />
                      HRYantra
                      <BadgeCheck className="h-3 w-3" aria-label="Verified" />
                    </p>
                  ) : null}
                  {m.text}
                  {actionUrl ? (
                    <a
                      href={actionUrl}
                      onClick={() => {
                        if (recoverySuggestionId) {
                          recordSuggestionClick(userId, recoverySuggestionId);
                        }
                      }}
                      className="mt-2 block text-[12px] font-semibold text-[#0A66C2] underline"
                    >
                      Open →
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {iAmRefAnswerer && refLive ? (
        <div className="max-h-[40%] shrink-0 space-y-2 overflow-y-auto border-t border-emerald-100 bg-emerald-50/90 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            Answer questions · paid after their feedback
          </p>
          {refLive.questions.map((q, i) => (
            <div key={`${q}-${i}`}>
              <p className="text-[11px] font-semibold text-slate-800">{i + 1}. {q}</p>
              <textarea
                value={answers[i] || ''}
                onChange={(e) => setAnswers((prev) => ({ ...prev, [i]: e.target.value }))}
                rows={2}
                placeholder="Your answer…"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-emerald-500"
              />
            </div>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSubmitAnswers()}
            className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-full bg-emerald-600 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Submit answers
          </button>
        </div>
      ) : null}

      {canRate ? (
        <div className="shrink-0 space-y-1.5 border-t border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Rate this response · unlocks their payout
          </p>
          <div className="flex flex-wrap gap-1.5">
            {REFERENCE_RATING_OPTIONS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                disabled={busy}
                onClick={() => void handleRate(id)}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {status === 'completed' || status === 'rejected' || status === 'closed' ? (
        <p className="shrink-0 border-t border-slate-100 bg-slate-50 px-3 py-2.5 text-center text-xs font-medium text-slate-600">
          Conversation {status}
        </p>
      ) : null}

      {canChat && !iAmRefAnswerer ? (
        <div className="flex shrink-0 items-center gap-2 border-t border-slate-100 bg-white p-3">
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Write a message…"
            className="h-10 min-w-0 flex-1 rounded-full border border-slate-200 bg-slate-50 px-4 text-sm outline-none focus:border-[#0A66C2] focus:bg-white"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!draft.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0A66C2] text-white hover:bg-[#004182] disabled:opacity-40"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      ) : iAmRefRecipient ? (
        <div className="shrink-0 space-y-2 border-t border-amber-100 bg-amber-50/80 px-3 py-3">
          <p className="text-center text-[11px] font-medium text-slate-600">
            Reference request — accept to answer. Tokens credit after they rate your answers.
          </p>
          <label
            className={`flex items-center justify-center gap-2 text-[11px] text-slate-700 ${
              forcedAnon ? 'opacity-80' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={acceptAnon || forcedAnon}
              disabled={forcedAnon || busy}
              onChange={(e) => setAcceptAnon(e.target.checked)}
              className="rounded border-slate-300 text-[#0A66C2]"
            />
            Stay anonymous
            {forcedAnon ? ' (locked)' : ''}
          </label>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRefRespond(true)}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRefRespond(false)}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      ) : iAmDmRecipient ? (
        <div className="shrink-0 space-y-2 border-t border-amber-100 bg-amber-50/80 px-3 py-3">
          <p className="text-center text-[11px] font-medium text-slate-600">
            Message request — real names stay hidden until you accept
          </p>
          <label
            className={`flex items-center justify-center gap-2 text-[11px] text-slate-700 ${
              forcedAnon ? 'opacity-80' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={acceptAnon || forcedAnon}
              disabled={forcedAnon || busy}
              onChange={(e) => setAcceptAnon(e.target.checked)}
              className="rounded border-slate-300 text-[#0A66C2]"
            />
            Stay anonymous in this chat
            {forcedAnon ? ' (locked)' : ''}
          </label>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDmRespond(true)}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDmRespond(false)}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      ) : status === 'pending' ? (
        <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-3 py-3 text-center text-[11px] text-slate-500">
          Waiting for them to accept… Real names stay hidden until then.
        </div>
      ) : null}
    </div>
  );
}
