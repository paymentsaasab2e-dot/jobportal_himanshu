'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, MessageSquare, ShieldCheck, X } from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import {
  listReferenceChecksForUser,
  pendingIncomingCount,
  respondReferenceCheck,
} from '@/lib/reference-check-store';
import {
  listDmThreadsForUser,
  listIncomingPeopleFollows,
  pendingDmIncomingCount,
  pendingFollowIncomingCount,
  respondDirectMessage,
  respondPeopleFollow,
} from '@/lib/social-store';
import { isUserOnline } from '@/lib/presence';
import type { ChatKind } from '@/components/community/ReferenceMessagingPanel';

type Props = {
  userId: string;
  activeChatId?: string | null;
  activeChatKind?: ChatKind | null;
  onRefresh?: () => void;
  onOpenCompany?: (companyPageId: string) => void;
  onOpenChat?: (kind: ChatKind, id: string) => void;
};

/** Inbox: Reference (paid) vs Direct (free), plus follow requests. */
export function ReferenceCheckPanel({
  userId,
  activeChatId,
  activeChatKind,
  onRefresh,
  onOpenCompany,
  onOpenChat,
}: Props) {
  const [tab, setTab] = useState<'reference' | 'direct' | 'follows'>('reference');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);

  const refreshLocal = () => {
    setTick((n) => n + 1);
    onRefresh?.();
  };

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 4000);
    return () => window.clearInterval(id);
  }, []);

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
  const refOpen = refChecks.filter((r) => r.status === 'active' || r.status === 'pending');
  const dmIncoming = dms.filter((d) => d.toUserId === userId && d.status === 'pending');
  const dmOpen = dms.filter((d) => d.status === 'active' || d.status === 'pending');

  const badge =
    pendingIncomingCount(userId) +
    pendingDmIncomingCount(userId) +
    pendingFollowIncomingCount(userId);

  const handleRefRespond = async (requestId: string, accept: boolean) => {
    setBusy(true);
    try {
      const result = await respondReferenceCheck(requestId, userId, accept);
      if (!result.ok) {
        showErrorToast('Reference', result.error);
        return;
      }
      showSuccessToast(accept ? 'Accepted' : 'Declined');
      if (accept) onOpenChat?.('reference', requestId);
      refreshLocal();
    } finally {
      setBusy(false);
    }
  };

  const handleDmRespond = (threadId: string, accept: boolean) => {
    setBusy(true);
    try {
      const result = respondDirectMessage(threadId, userId, accept);
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
      showSuccessToast(accept ? 'Accepted' : 'Declined');
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

  if (
    refIncoming.length === 0 &&
    refOpen.length === 0 &&
    dmIncoming.length === 0 &&
    dmOpen.length === 0 &&
    followIncoming.length === 0
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.06)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-2.5">
        <h2 className="flex items-center gap-1.5 text-sm font-bold text-slate-900">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          Messaging
        </h2>
        {badge > 0 ? (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-bold text-amber-800">
            {badge} new
          </span>
        ) : null}
      </div>

      <div className="flex border-b border-slate-100 px-1">
        {(
          [
            ['reference', 'Reference'],
            ['direct', 'Direct'],
            ['follows', 'Follows'],
          ] as const
        ).map(([id, label]) => (
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
          </button>
        ))}
      </div>

      <div className="space-y-3 p-3.5">
        {tab === 'reference' ? (
          <>
            <p className="text-[10px] text-slate-400">Paid reference checks (token unlock)</p>
            {refIncoming.map((r) => (
              <IncomingRow
                key={r.id}
                title={r.requesterName}
                subtitle={r.companyName}
                onCompany={() => onOpenCompany?.(r.companyPageId)}
                busy={busy}
                onAccept={() => void handleRefRespond(r.id, true)}
                onDecline={() => void handleRefRespond(r.id, false)}
              />
            ))}
            {refOpen.map((r) => {
              const otherId = r.requesterId === userId ? r.refereeId : r.requesterId;
              return (
                <ChatRow
                  key={r.id}
                  active={activeChatKind === 'reference' && activeChatId === r.id}
                  name={r.requesterId === userId ? r.refereeName : r.requesterName}
                  status={r.status}
                  online={isUserOnline(otherId)}
                  onClick={() => onOpenChat?.('reference', r.id)}
                />
              );
            })}
            {refIncoming.length === 0 && refOpen.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-400">No reference chats.</p>
            ) : null}
          </>
        ) : null}

        {tab === 'direct' ? (
          <>
            <p className="text-[10px] text-slate-400">Free direct messages (accept to chat)</p>
            {dmIncoming.map((d) => (
              <IncomingRow
                key={d.id}
                title={d.fromName}
                subtitle={d.companyName || 'Direct message'}
                onCompany={
                  d.companyPageId ? () => onOpenCompany?.(d.companyPageId!) : undefined
                }
                busy={busy}
                onAccept={() => handleDmRespond(d.id, true)}
                onDecline={() => handleDmRespond(d.id, false)}
              />
            ))}
            {dmOpen.map((d) => {
              const otherId = d.fromUserId === userId ? d.toUserId : d.fromUserId;
              return (
                <ChatRow
                  key={d.id}
                  active={activeChatKind === 'dm' && activeChatId === d.id}
                  name={d.fromUserId === userId ? d.toName : d.fromName}
                  status={d.status}
                  online={isUserOnline(otherId)}
                  onClick={() => onOpenChat?.('dm', d.id)}
                />
              );
            })}
            {dmIncoming.length === 0 && dmOpen.length === 0 ? (
              <p className="py-2 text-center text-xs text-slate-400">No direct chats.</p>
            ) : null}
          </>
        ) : null}

        {tab === 'follows' ? (
          <>
            <p className="text-[10px] text-slate-400">People follow requests</p>
            {followIncoming.map((f) => (
              <div
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-100 px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {f.fromName}
                    {f.anonymous ? ' · anon' : ''}
                  </p>
                  <p className="text-[11px] text-slate-500">Wants to follow you</p>
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleFollowRespond(f.id, true)}
                    className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" />
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => handleFollowRespond(f.id, false)}
                    className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 px-3 text-xs font-semibold text-slate-600 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" />
                    Decline
                  </button>
                </div>
              </div>
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
  onCompany,
  busy,
  onAccept,
  onDecline,
}: {
  title: string;
  subtitle: string;
  onCompany?: () => void;
  busy: boolean;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-amber-100 bg-amber-50/50 px-2.5 py-2">
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
      </div>
      <div className="flex gap-1.5">
        <button
          type="button"
          disabled={busy}
          onClick={onAccept}
          className="inline-flex h-8 items-center gap-1 rounded-full bg-emerald-600 px-3 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Check className="h-3.5 w-3.5" />
          Accept
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={onDecline}
          className="inline-flex h-8 items-center gap-1 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 disabled:opacity-50"
        >
          <X className="h-3.5 w-3.5" />
          Decline
        </button>
      </div>
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
      <span className="min-w-0 flex-1 truncate font-medium text-slate-800">{name}</span>
      <span
        className={`text-[10px] font-semibold uppercase ${
          active ? 'text-[#0A66C2]' : 'text-slate-400'
        }`}
      >
        {status}
      </span>
    </button>
  );
}
