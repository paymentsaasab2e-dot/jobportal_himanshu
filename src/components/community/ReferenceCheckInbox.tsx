'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  Clock3,
  Inbox,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import {
  clampReferenceFee,
  getGossipIdentity,
  getMaxReferenceFee,
  updateGossipIdentity,
  type GossipIdentity,
} from '@/lib/community-store';
import {
  getReferencePeerLabel,
  type ReferenceCheckRequest,
} from '@/lib/reference-check-store';

export type ReferenceInboxFilter = 'all' | 'inbox' | 'sent' | 'done';

function statusLabel(r: ReferenceCheckRequest, viewerId: string) {
  const iAmRequester = r.requesterId === viewerId;
  if (r.status === 'pending') {
    return iAmRequester ? 'Waiting for accept' : 'Needs your decision';
  }
  if (r.status === 'rejected') return 'Rejected';
  if (r.status === 'awaiting_answers') {
    return iAmRequester ? 'Accepted · awaiting response' : 'Answer pending';
  }
  if (r.status === 'answered') {
    return iAmRequester ? 'Rate response' : 'Response sent';
  }
  if (r.status === 'completed') return 'Completed';
  if (r.status === 'cancelled') return 'Cancelled';
  return r.status;
}

function statusTone(r: ReferenceCheckRequest) {
  if (r.status === 'rejected' || r.status === 'cancelled') {
    return 'bg-rose-50 text-rose-700 ring-rose-100';
  }
  if (r.status === 'completed') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (r.status === 'answered') return 'bg-sky-50 text-[#176F96] ring-sky-100';
  if (r.status === 'awaiting_answers') return 'bg-amber-50 text-amber-800 ring-amber-100';
  if (r.status === 'pending') return 'bg-orange-50 text-orange-800 ring-orange-100';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

function matchesFilter(
  r: ReferenceCheckRequest,
  userId: string,
  filter: ReferenceInboxFilter,
): boolean {
  const iAmReferee = r.refereeId === userId;
  const iAmRequester = r.requesterId === userId;
  if (filter === 'all') return true;
  if (filter === 'inbox') {
    return (
      iAmReferee &&
      (r.status === 'pending' ||
        r.status === 'awaiting_answers' ||
        r.status === 'answered')
    );
  }
  if (filter === 'sent') return iAmRequester;
  if (filter === 'done') {
    return r.status === 'completed' || r.status === 'rejected' || r.status === 'cancelled';
  }
  return true;
}

type Section = {
  id: string;
  title: string;
  icon: typeof Inbox;
  items: ReferenceCheckRequest[];
};

type Props = {
  userId: string;
  requests: ReferenceCheckRequest[];
  filter: ReferenceInboxFilter;
  onFilterChange: (f: ReferenceInboxFilter) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onIdentityChange?: () => void;
};

export function ReferenceCheckInbox({
  userId,
  requests,
  filter,
  onFilterChange,
  selectedId,
  onSelect,
  onIdentityChange,
}: Props) {
  const [identity, setIdentity] = useState<GossipIdentity | null>(null);
  const [feeDraft, setFeeDraft] = useState(5);
  const [savingFee, setSavingFee] = useState(false);

  const reloadIdentity = () => {
    const row = getGossipIdentity(userId);
    setIdentity(row);
    if (row) setFeeDraft(row.referenceFeeTokens);
  };

  useEffect(() => {
    reloadIdentity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const filtered = useMemo(
    () => requests.filter((r) => matchesFilter(r, userId, filter)),
    [requests, userId, filter],
  );

  const sections = useMemo((): Section[] => {
    const receivedPending = filtered.filter(
      (r) => r.refereeId === userId && r.status === 'pending',
    );
    const receivedAnswer = filtered.filter(
      (r) => r.refereeId === userId && r.status === 'awaiting_answers',
    );
    const receivedResponded = filtered.filter(
      (r) => r.refereeId === userId && r.status === 'answered',
    );
    const sent = filtered.filter((r) => r.requesterId === userId);
    const closed = filtered.filter(
      (r) =>
        r.status === 'completed' ||
        r.status === 'rejected' ||
        r.status === 'cancelled',
    );

    if (filter === 'sent') {
      return [{ id: 'sent', title: 'Sent', icon: Send, items: sent }];
    }
    if (filter === 'inbox') {
      return [
        { id: 'pending', title: 'Needs decision', icon: Inbox, items: receivedPending },
        { id: 'answer', title: 'Answer pending', icon: Clock3, items: receivedAnswer },
        { id: 'responded', title: 'Response sent', icon: CheckCircle2, items: receivedResponded },
      ].filter((s) => s.items.length > 0);
    }
    if (filter === 'done') {
      return [{ id: 'done', title: 'Closed', icon: CheckCircle2, items: closed }];
    }

    return [
      { id: 'pending', title: 'Received · pending', icon: Inbox, items: receivedPending },
      { id: 'answer', title: 'Accepted · answer', icon: Clock3, items: receivedAnswer },
      { id: 'responded', title: 'Response sent', icon: CheckCircle2, items: receivedResponded },
      {
        id: 'sent',
        title: 'Sent by you',
        icon: Send,
        items: sent.filter((r) => r.status !== 'completed' && r.status !== 'rejected'),
      },
      { id: 'done', title: 'Closed', icon: ShieldCheck, items: closed },
    ].filter((s) => s.items.length > 0);
  }, [filtered, filter, userId]);

  const counts = useMemo(() => {
    return {
      all: requests.length,
      inbox: requests.filter(
        (r) =>
          r.refereeId === userId &&
          (r.status === 'pending' ||
            r.status === 'awaiting_answers' ||
            r.status === 'answered'),
      ).length,
      sent: requests.filter((r) => r.requesterId === userId).length,
      done: requests.filter(
        (r) =>
          r.status === 'completed' ||
          r.status === 'rejected' ||
          r.status === 'cancelled',
      ).length,
    };
  }, [requests, userId]);

  const filters: Array<{ id: ReferenceInboxFilter; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'inbox', label: 'Inbox', count: counts.inbox },
    { id: 'sent', label: 'Sent', count: counts.sent },
    { id: 'done', label: 'Done', count: counts.done },
  ];

  const maxFee = getMaxReferenceFee(identity?.completedReferenceChecks || 0);

  const saveAvailability = (available: boolean) => {
    const result = updateGossipIdentity(userId, {
      availableForReferenceCheck: available,
      referenceFeeTokens: available
        ? clampReferenceFee(feeDraft, identity?.completedReferenceChecks || 0)
        : identity?.referenceFeeTokens,
    });
    if (!result.ok) {
      showErrorToast('Reference setup', result.error);
      return;
    }
    setIdentity(result.identity);
    setFeeDraft(result.identity.referenceFeeTokens);
    onIdentityChange?.();
    showSuccessToast(
      available ? 'Open for reference' : 'Paused',
      available
        ? `Fee set to ${result.identity.referenceFeeTokens} tokens.`
        : 'You won’t appear as open for reference.',
    );
  };

  const saveFee = () => {
    if (!identity) return;
    setSavingFee(true);
    try {
      const fee = clampReferenceFee(feeDraft, identity.completedReferenceChecks || 0);
      const result = updateGossipIdentity(userId, {
        availableForReferenceCheck: true,
        referenceFeeTokens: fee,
      });
      if (!result.ok) {
        showErrorToast('Fee', result.error);
        return;
      }
      setIdentity(result.identity);
      setFeeDraft(result.identity.referenceFeeTokens);
      onIdentityChange?.();
      showSuccessToast('Fee saved', `${result.identity.referenceFeeTokens} tokens per check.`);
    } finally {
      setSavingFee(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
      <div className="shrink-0 border-b border-slate-100 px-3.5 py-3">
        <h2 className="text-[13px] font-bold text-slate-900">Your checks</h2>
        <div className="mt-2 flex gap-1">
          {filters.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition ${
                filter === f.id
                  ? 'bg-[#176F96] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
              {f.count > 0 ? <span className="ml-1 opacity-75">{f.count}</span> : null}
            </button>
          ))}
        </div>
      </div>

      {/* Fee / availability setup — end-to-end referee setup */}
      <div className="shrink-0 border-b border-slate-100 px-3.5 py-3">
        {!identity ? (
          <p className="text-[11px] leading-relaxed text-slate-500">
            Create your Office Gossips account first (Communities / Feed), then set your
            reference fee here.
          </p>
        ) : (
          <div className="space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[12px] font-semibold text-slate-900">Your reference fee</p>
                <p className="text-[10px] text-slate-500">
                  First-time cap 1–{Math.min(20, maxFee)}. Max rises after completed checks.
                </p>
              </div>
              <button
                type="button"
                onClick={() => saveAvailability(!identity.availableForReferenceCheck)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
                  identity.availableForReferenceCheck
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {identity.availableForReferenceCheck ? 'Open' : 'Off'}
              </button>
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/70 px-2.5 py-2">
              <TokenCoinIcon className="h-4 w-4 shrink-0" />
              <input
                type="range"
                min={1}
                max={maxFee}
                value={Math.min(feeDraft, maxFee)}
                onChange={(e) => setFeeDraft(Number(e.target.value))}
                className="min-w-0 flex-1 accent-amber-600"
                aria-label="Reference fee tokens"
              />
              <span className="w-8 shrink-0 text-right text-[12px] font-bold text-amber-900">
                {Math.min(feeDraft, maxFee)}
              </span>
            </div>
            <button
              type="button"
              disabled={savingFee}
              onClick={saveFee}
              className="w-full rounded-full bg-[#176F96] py-2 text-[11px] font-semibold text-white transition hover:bg-[#0F5A7A] disabled:opacity-50"
            >
              {identity.availableForReferenceCheck ? 'Save fee' : 'Open for reference & save fee'}
            </button>
            <p className="text-[10px] text-slate-400">
              Completed given: {identity.completedReferenceChecks || 0} · Cap {maxFee}
            </p>
          </div>
        )}
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-2.5 py-2.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {sections.length === 0 ? (
          <div className="px-2 py-8 text-center">
            <Inbox className="mx-auto h-7 w-7 text-slate-300" />
            <p className="mt-2 text-[13px] font-semibold text-slate-800">No checks yet</p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              Search a company in the center to request a check, or turn on your fee above to
              receive them.
            </p>
          </div>
        ) : (
          sections.map((section) => {
            const Icon = section.icon;
            return (
              <div key={section.id}>
                <div className="mb-1.5 flex items-center gap-1.5 px-1">
                  <Icon className="h-3 w-3 text-slate-400" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
                    {section.title}
                  </p>
                  <span className="text-[10px] font-semibold text-slate-400">
                    {section.items.length}
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {section.items.map((r) => {
                    const selected = selectedId === r.id;
                    const peer = getReferencePeerLabel(r, userId);
                    const iAmReferee = r.refereeId === userId;
                    return (
                      <li key={r.id}>
                        <button
                          type="button"
                          onClick={() => onSelect(r.id)}
                          className={`flex w-full items-start gap-2.5 rounded-[14px] border px-2.5 py-2.5 text-left transition ${
                            selected
                              ? 'border-[rgba(32,152,200,0.35)] bg-sky-50/80 shadow-sm'
                              : 'border-slate-200/90 bg-white hover:border-[rgba(32,152,200,0.25)]'
                          }`}
                        >
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#176F96] text-[11px] font-bold uppercase text-white">
                            {(peer || '?').slice(0, 1)}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-[12px] font-semibold text-slate-900">
                              {peer}
                            </span>
                            <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                              {r.companyName}
                              {iAmReferee ? ' · received' : ' · sent'}
                            </span>
                            <span
                              className={`mt-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ${statusTone(r)}`}
                            >
                              {statusLabel(r, userId)}
                            </span>
                            {r.feeTokens ? (
                              <span className="ml-1 inline-flex items-center gap-0.5 text-[9px] font-semibold text-amber-800">
                                <TokenCoinIcon className="h-2.5 w-2.5" />
                                {r.feeTokens}
                              </span>
                            ) : null}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
