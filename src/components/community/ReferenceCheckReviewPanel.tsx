'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BadgeCheck,
  Check,
  EyeOff,
  Inbox,
  ShieldCheck,
  X,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import { getGossipIdentity } from '@/lib/community-store';
import {
  getReferenceCheck,
  getReferencePeerLabel,
  rateReferenceCheck,
  REFERENCE_RATING_OPTIONS,
  respondReferenceCheck,
  submitReferenceAnswers,
  type ReferenceCheckRequest,
  type ReferenceRating,
} from '@/lib/reference-check-store';

function statusLabel(r: ReferenceCheckRequest, viewerId: string) {
  const iAmRequester = r.requesterId === viewerId;
  if (r.status === 'pending') {
    return iAmRequester ? 'Waiting for accept' : 'Needs your decision';
  }
  if (r.status === 'rejected') return 'Rejected';
  if (r.status === 'awaiting_answers') {
    return iAmRequester ? 'Accepted · awaiting response' : 'Accepted · answer pending';
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
}

function statusTone(r: ReferenceCheckRequest) {
  if (r.status === 'rejected' || r.status === 'cancelled') {
    return 'bg-rose-50 text-rose-700 ring-rose-100';
  }
  if (r.status === 'completed') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (r.status === 'answered') return 'bg-sky-50 text-[#0A66C2] ring-sky-100';
  if (r.status === 'awaiting_answers') return 'bg-amber-50 text-amber-800 ring-amber-100';
  return 'bg-orange-50 text-orange-800 ring-orange-100';
}

type Props = {
  userId: string;
  requestId: string | null;
  attention: ReferenceCheckRequest[];
  onSelect: (id: string) => void;
  onChanged?: () => void;
};

export function ReferenceCheckReviewPanel({
  userId,
  requestId,
  attention,
  onSelect,
  onChanged,
}: Props) {
  const identity = getGossipIdentity(userId);
  const forcedAnon = Boolean(identity?.isAnonymous);
  const defaultAcceptAnon = forcedAnon || Boolean(identity?.followAnonymously);

  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [stayAnon, setStayAnon] = useState(defaultAcceptAnon);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const request = useMemo(
    () => (requestId ? getReferenceCheck(requestId) : null),
    [requestId, tick],
  );

  useEffect(() => {
    setStayAnon(defaultAcceptAnon);
    setDrafts({});
  }, [requestId, defaultAcceptAnon]);

  useEffect(() => {
    if (!request?.answers?.length) return;
    const next: Record<number, string> = {};
    request.answers.forEach((a, i) => {
      next[i] = a.answer;
    });
    setDrafts(next);
  }, [request?.id, request?.answers?.length]);

  const bump = () => {
    setTick((n) => n + 1);
    onChanged?.();
  };

  const handleRespond = async (accept: boolean) => {
    if (!requestId) return;
    setBusy(true);
    try {
      const result = await respondReferenceCheck(requestId, userId, accept, {
        anonymous: accept ? stayAnon : undefined,
      });
      if (!result.ok) {
        showErrorToast('Reference', result.error);
        return;
      }
      showSuccessToast(
        accept ? 'Accepted' : 'Rejected',
        accept ? 'Answer the questions below.' : 'Request closed.',
      );
      bump();
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!requestId || !request) return;
    setBusy(true);
    try {
      const answers = request.questions.map((q, i) => ({
        question: q,
        answer: (drafts[i] || '').trim(),
      }));
      if (answers.some((a) => !a.answer)) {
        showErrorToast('Answers', 'Please answer every question.');
        return;
      }
      const result = await submitReferenceAnswers(requestId, userId, answers);
      if (!result.ok) {
        showErrorToast('Reference', result.error);
        return;
      }
      showSuccessToast('Response sent', 'They can rate your answers next.');
      bump();
    } finally {
      setBusy(false);
    }
  };

  const handleRate = async (rating: ReferenceRating) => {
    if (!requestId) return;
    setBusy(true);
    try {
      const result = await rateReferenceCheck(requestId, userId, rating);
      if (!result.ok) {
        showErrorToast('Feedback', result.error);
        return;
      }
      showSuccessToast('Rated', 'Payout released to the referee.');
      bump();
    } finally {
      setBusy(false);
    }
  };

  if (!request) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(252,150,32,0.08),transparent_36%),radial-gradient(circle_at_bottom_left,rgba(16,185,129,0.1),transparent_40%)]" />
          <div className="relative flex flex-1 flex-col items-center justify-center px-5 py-8 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-[18px] bg-linear-to-br from-emerald-500 to-emerald-700 text-white shadow-[0_12px_24px_rgba(16,185,129,0.28)]">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <h2 className="mt-3 text-[15px] font-semibold tracking-tight text-slate-900">
              Ready to review
            </h2>
            <p className="mt-1.5 max-w-[240px] text-[12px] font-medium leading-relaxed text-slate-500">
              Incoming reference requests open here so you can Accept, answer, or get rated —
              after you set your fee on the left.
            </p>
          </div>

          {attention.length > 0 ? (
            <div className="relative shrink-0 border-t border-slate-100 px-3 py-3">
              <p className="mb-2 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                <Inbox className="h-3 w-3" />
                Needs attention
              </p>
              <ul className="space-y-1.5">
                {attention.slice(0, 4).map((r) => {
                  const peer = getReferencePeerLabel(r, userId);
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => onSelect(r.id)}
                        className="flex w-full items-start gap-2.5 rounded-[14px] border border-amber-100 bg-amber-50/70 px-2.5 py-2.5 text-left transition hover:border-amber-200 hover:bg-amber-50"
                      >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-[#1B3A5F] text-[11px] font-bold uppercase text-white">
                          {(peer || '?').slice(0, 1)}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[12px] font-semibold text-slate-900">
                            {peer}
                          </span>
                          <span className="mt-0.5 block truncate text-[10px] text-slate-500">
                            {r.companyName}
                          </span>
                          <span
                            className={`mt-1.5 inline-flex rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 ${statusTone(r)}`}
                          >
                            {statusLabel(r, userId)}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <p className="relative border-t border-slate-100 px-4 py-3 text-center text-[11px] text-slate-400">
              No open requests needing your review
            </p>
          )}
        </div>
      </div>
    );
  }

  const iAmReferee = request.refereeId === userId;
  const iAmRequester = request.requesterId === userId;
  const peer = getReferencePeerLabel(request, userId);
  const title =
    request.status === 'answered' || request.status === 'completed'
      ? 'Reference response'
      : iAmReferee && request.status === 'pending'
        ? 'Incoming request'
        : 'Reference request';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[22px] border border-slate-200/80 bg-white shadow-[0_10px_28px_rgba(15,23,42,0.05)]">
      <div className="shrink-0 border-b border-slate-100 px-3.5 py-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#1B3A5F] text-sm font-bold uppercase text-white shadow-sm">
            {(peer || '?').slice(0, 1)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">
              <ShieldCheck className="h-3 w-3" />
              Review
            </p>
            <h2 className="truncate text-[14px] font-bold text-slate-900">{title}</h2>
            <p className="truncate text-[11px] text-slate-500">
              {peer} · {request.companyName}
            </p>
          </div>
        </div>
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusTone(request)}`}
          >
            {statusLabel(request, userId)}
          </span>
          {request.feeTokens ? (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
              <TokenCoinIcon className="h-3 w-3" />
              {request.feeTokens}
            </span>
          ) : null}
          {request.enquiryRole ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
              {request.enquiryRole === 'employer' ? 'About person' : 'About company'}
            </span>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-3.5 py-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        {request.status === 'pending' && iAmReferee ? (
          <div className="space-y-3 rounded-[16px] border border-slate-200 bg-slate-50/80 p-3">
            <p className="text-[12px] font-semibold text-slate-800">
              They asked you these questions
            </p>
            <ul className="space-y-1.5">
              {request.questions.map((q, i) => (
                <li key={`${request.id}-q-${i}`} className="text-[12px] text-slate-700">
                  <span className="font-semibold text-slate-400">{i + 1}.</span> {q}
                </li>
              ))}
            </ul>
            <label
              className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[11px] text-slate-700 ${
                forcedAnon ? 'opacity-80' : 'cursor-pointer'
              }`}
            >
              <input
                type="checkbox"
                checked={stayAnon}
                disabled={forcedAnon || busy}
                onChange={(e) => setStayAnon(e.target.checked)}
                className="rounded border-slate-300 text-[#0A66C2]"
              />
              <EyeOff className="h-3.5 w-3.5" />
              Stay anonymous
            </label>
            <div className="flex gap-1.5">
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRespond(true)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full bg-emerald-600 text-[12px] font-semibold text-white disabled:opacity-50"
              >
                <Check className="h-3.5 w-3.5" />
                Accept
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleRespond(false)}
                className="inline-flex h-9 flex-1 items-center justify-center gap-1 rounded-full border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
                Reject
              </button>
            </div>
          </div>
        ) : null}

        {request.status === 'pending' && iAmRequester ? (
          <div className="rounded-[16px] border border-amber-100 bg-amber-50/70 px-3 py-3">
            <p className="text-[12px] font-semibold text-amber-900">Waiting for accept</p>
            <p className="mt-1 text-[11px] text-amber-800/80">
              They’ll see your questions and can Accept or Reject.
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {request.questions.map((q, i) => (
                <li key={`${request.id}-pq-${i}`} className="text-[12px] text-slate-700">
                  <span className="font-semibold text-slate-400">{i + 1}.</span> {q}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {request.status === 'awaiting_answers' && iAmReferee ? (
          <div className="space-y-2.5">
            <p className="text-[12px] font-semibold text-slate-800">Write your response</p>
            {request.questions.map((q, i) => (
              <div key={`${request.id}-aq-${i}`}>
                <p className="text-[12px] font-semibold text-slate-800">
                  {i + 1}. {q}
                </p>
                <WritingAssistField
                  value={drafts[i] || ''}
                  onChange={(next) => setDrafts((prev) => ({ ...prev, [i]: next }))}
                  rows={3}
                  placeholder="Your answer…"
                  className="mt-1 w-full rounded-xl border border-slate-200 px-2.5 py-2 text-[12px] outline-none focus:border-[#0A66C2]"
                />
              </div>
            ))}
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleSubmitAnswers()}
              className="inline-flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#0A66C2] text-[12px] font-semibold text-white disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Send response
            </button>
          </div>
        ) : null}

        {request.status === 'awaiting_answers' && iAmRequester ? (
          <div className="rounded-[16px] border border-amber-100 bg-amber-50/70 px-3 py-3">
            <p className="text-[12px] font-semibold text-amber-900">
              Accepted · waiting for response
            </p>
            <p className="mt-1 text-[11px] text-amber-800/80">
              You’ll see answers here when they reply.
            </p>
          </div>
        ) : null}

        {(request.status === 'answered' || request.status === 'completed') && (
          <div className="space-y-2.5">
            <p className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-slate-800">
              <BadgeCheck className="h-3.5 w-3.5 text-emerald-600" />
              Responses
            </p>
            {request.answers?.length ? (
              <ul className="space-y-2">
                {request.answers.map((a, i) => (
                  <li
                    key={`${request.id}-ans-${i}`}
                    className="rounded-[14px] border border-slate-200 bg-slate-50/80 px-3 py-2.5"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Q{i + 1}
                    </p>
                    <p className="mt-0.5 text-[12px] font-semibold text-slate-800">{a.question}</p>
                    <p className="mt-1.5 whitespace-pre-wrap text-[12px] leading-relaxed text-slate-700">
                      {a.answer}
                    </p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-[12px] text-slate-500">No answers yet.</p>
            )}

            {request.status === 'answered' && iAmRequester && request.escrowHeld ? (
              <div className="rounded-[16px] border border-sky-100 bg-sky-50/80 p-3">
                <p className="text-[12px] font-semibold text-slate-800">Rate this response</p>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Your rating releases their token payout.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {REFERENCE_RATING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={busy}
                      onClick={() => void handleRate(opt.id)}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-700 hover:border-[#0A66C2] hover:text-[#0A66C2] disabled:opacity-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}

        {request.status === 'rejected' ? (
          <p className="rounded-[16px] border border-rose-100 bg-rose-50/80 px-3 py-3 text-[12px] text-rose-800">
            This request was rejected.
          </p>
        ) : null}
      </div>
    </div>
  );
}
