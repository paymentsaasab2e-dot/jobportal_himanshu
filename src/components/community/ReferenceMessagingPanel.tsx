'use client';

import { useEffect, useRef, useState } from 'react';
import { Minus, Send, X } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import {
  getReferenceCheck,
  rateReferenceCheck,
  sendReferenceMessage,
  type ReferenceRating,
} from '@/lib/reference-check-store';
import {
  getDmThread,
  sendDirectMessage,
} from '@/lib/social-store';
import { isUserOnline } from '@/lib/presence';

export type ChatKind = 'reference' | 'dm';

type Props = {
  kind: ChatKind;
  chatId: string;
  userId: string;
  onClose: () => void;
  onRefresh?: () => void;
};

/** Fixed LinkedIn-style messaging window — reference (paid) or direct (free). */
export function ReferenceMessagingPanel({
  kind,
  chatId,
  userId,
  onClose,
  onRefresh,
}: Props) {
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMinimized(false);
    setDraft('');
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [chatId, kind]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1500);
    return () => window.clearInterval(id);
  }, [chatId, kind]);

  void tick;

  const refLive = kind === 'reference' ? getReferenceCheck(chatId) : null;
  const dmLive = kind === 'dm' ? getDmThread(chatId) : null;

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
    kind === 'reference' && refLive
      ? refLive.requesterId === userId
        ? refLive.refereeName
        : refLive.requesterName
      : dmLive
        ? dmLive.fromUserId === userId
          ? dmLive.toName
          : dmLive.fromName
        : 'Chat';
  const otherInitial = other.slice(0, 1).toUpperCase();
  const online = isUserOnline(otherUserId);
  const status = kind === 'reference' ? refLive?.status : dmLive?.status;
  const subtitle =
    kind === 'reference'
      ? `${refLive?.companyName || 'Reference'} · paid`
      : `${dmLive?.companyName || 'Direct message'} · free`;
  const messages =
    kind === 'reference' ? refLive?.messages || [] : dmLive?.messages || [];
  const canChat = status === 'active';
  const canRate =
    kind === 'reference' &&
    refLive?.status === 'active' &&
    refLive.requesterId === userId;

  useEffect(() => {
    if (!minimized) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length, tick, minimized, chatId]);

  if ((kind === 'reference' && !refLive) || (kind === 'dm' && !dmLive)) {
    return (
      <div className="fixed bottom-4 right-4 z-[80] w-[min(360px,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-2xl">
        Conversation not found.
        <button type="button" onClick={onClose} className="ml-2 font-semibold text-[#0A66C2]">
          Close
        </button>
      </div>
    );
  }

  const handleSend = () => {
    if (kind === 'reference') {
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

  const handleRate = async (rating: ReferenceRating) => {
    setBusy(true);
    try {
      const result = await rateReferenceCheck(chatId, userId, rating);
      if (!result.ok) {
        showErrorToast('Rating', result.error);
        return;
      }
      showSuccessToast('Thanks', 'Reference conversation completed.');
      setTick((n) => n + 1);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  if (minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[80] flex w-[min(280px,calc(100vw-1.5rem))] items-center gap-2 rounded-t-xl border border-slate-700 bg-[#1B3A5F] px-3 py-3 text-left text-white shadow-2xl"
      >
        <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
          {otherInitial}
          <span
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#1B3A5F] ${
              online ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
            title={online ? 'Online' : 'Offline'}
          />
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-semibold">{other}</span>
        <span className="text-[10px] uppercase text-white/60">{status}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-0 right-3 z-[80] flex h-[min(480px,70vh)] w-[min(380px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-t-xl border border-slate-200 border-b-0 bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.2)] sm:bottom-4 sm:right-4 sm:rounded-xl sm:border-b">
      <div className="flex shrink-0 items-center gap-2 bg-[#1B3A5F] px-3 py-2.5 text-white">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
          {otherInitial}
          <span
            className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#1B3A5F] ${
              online ? 'bg-emerald-400' : 'bg-rose-400'
            }`}
            title={online ? 'Online' : 'Offline'}
          />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{other}</p>
          <p className="truncate text-[11px] text-white/70">
            <span className={online ? 'text-emerald-300' : 'text-rose-300'}>
              {online ? 'Active now' : 'Offline'}
            </span>
            {' · '}
            {subtitle}
          </p>
        </div>
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
      </div>

      <div className="min-h-0 flex-1 space-y-2.5 overflow-y-auto bg-[#F4F2EE] px-3 py-3">
        {messages.length === 0 ? (
          <p className="rounded-lg bg-white/90 px-3 py-4 text-center text-xs text-slate-500">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.senderId === userId;
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm ${
                    mine
                      ? 'rounded-br-md bg-[#0A66C2] text-white'
                      : 'rounded-bl-md bg-white text-slate-800'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {canRate ? (
        <div className="shrink-0 space-y-1.5 border-t border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Rate this reference
          </p>
          <div className="flex flex-wrap gap-1.5">
            {(['poor', 'good', 'excellent'] as const).map((key) => (
              <button
                key={key}
                type="button"
                disabled={busy}
                onClick={() => void handleRate(key)}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold capitalize text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {key}
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

      {canChat ? (
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
      ) : status === 'pending' ? (
        <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-3 py-3 text-center text-[11px] text-slate-500">
          Waiting for them to accept…
        </div>
      ) : null}
    </div>
  );
}
