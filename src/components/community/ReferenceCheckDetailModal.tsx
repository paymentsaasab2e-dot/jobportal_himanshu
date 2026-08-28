'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  EyeOff,
  ShieldCheck,
  X,
  BadgeCheck,
} from 'lucide-react';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import {
  getGossipIdentity,
} from '@/lib/community-store';
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

type Props = {
  requestId: string;
  userId: string;
  onClose: () => void;
  onChanged?: () => void;
};

function statusLabel(r: ReferenceCheckRequest, viewerId: string) {
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
}

function statusTone(r: ReferenceCheckRequest) {
  if (r.status === 'rejected') return 'bg-rose-50 text-rose-700 ring-rose-100';
  if (r.status === 'completed') return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
  if (r.status === 'answered') return 'bg-sky-50 text-[#08428c] ring-sky-100';
  if (r.status === 'awaiting_answers') return 'bg-amber-50 text-amber-800 ring-amber-100';
  return 'bg-slate-100 text-slate-600 ring-slate-200';
}

/** Full-screen style popup (same shell as apply wizard) for request status + responses. */
export function ReferenceCheckDetailModal({
  requestId,
  userId,
  onClose,
  onChanged,
}: Props) {
  const identity = getGossipIdentity(userId);
  const forcedAnon = Boolean(identity?.isAnonymous);
  const defaultAcceptAnon = forcedAnon || Boolean(identity?.followAnonymously);

  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [stayAnon, setStayAnon] = useState(defaultAcceptAnon);
  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const request = useMemo(() => getReferenceCheck(requestId), [requestId, tick]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    if (!request?.answers?.length) return;
    const next: Record<number, string> = {};
    request.answers.forEach((a, i) => {
      next[i] = a.answer;
    });
    setDrafts(next);
  }, [request?.id, request?.answers?.length]);

  if (!request) {
    return (
      <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-[2px]">
        <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
          <p className="text-sm text-slate-600">Request not found.</p>
          <button
            type="button"
            onClick={onClose}
            className="mt-4 rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white"
          >
            Close
          </button>
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
      : 'Reference request';

  const bump = () => {
    setTick((n) => n + 1);
    onChanged?.();
  };

  const handleRespond = async (accept: boolean) => {
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

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-900/45 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="flex max-h-[92dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="ref-detail-title"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
              <ShieldCheck className="h-3.5 w-3.5" />
              Reference check
            </p>
            <h2 id="ref-detail-title" className="mt-1 text-lg font-bold text-slate-900">
              {title}
            </h2>
            <p className="mt-0.5 truncate text-sm text-slate-500">
              {peer} · {request.companyName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusTone(request)}`}
            >
              {statusLabel(request, userId)}
            </span>
            {request.feeTokens ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-900">
                <TokenCoinIcon className="h-3.5 w-3.5" />
                {request.feeTokens}
              </span>
            ) : null}
            {request.enquiryRole ? (
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-600">
                {request.enquiryRole === 'employer' ? 'About person' : 'About company'}
              </span>
            ) : null}
          </div>

          {request.status === 'pending' && iAmReferee ? (
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3.5">
              <p className="text-sm font-semibold text-slate-800">They asked you these questions</p>
              <ul className="space-y-1.5">
                {request.questions.map((q, i) => (
                  <li key={`${request.id}-q-${i}`} className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-400">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
              <label
                className={`flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 ${
                  forcedAnon ? 'opacity-80' : 'cursor-pointer'
                }`}
              >
                <input
                  type="checkbox"
                  checked={stayAnon}
                  disabled={forcedAnon || busy}
                  onChange={(e) => setStayAnon(e.target.checked)}
                  className="rounded border-slate-300 text-[#08428c]"
                />
                <EyeOff className="h-3.5 w-3.5" />
                Stay anonymous
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRespond(true)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-emerald-600 text-sm font-semibold text-white disabled:opacity-50"
                >
                  <Check className="h-4 w-4" />
                  Accept
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void handleRespond(false)}
                  className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-full border border-slate-200 bg-white text-sm font-semibold text-slate-700 disabled:opacity-50"
                >
                  <X className="h-4 w-4" />
                  Reject
                </button>
              </div>
            </div>
          ) : null}

          {request.status === 'pending' && iAmRequester ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">Waiting for accept</p>
              <p className="mt-1 text-xs text-amber-800/80">
                They’ll see your questions and can Accept or Reject.
              </p>
              <ul className="mt-3 space-y-1.5">
                {request.questions.map((q, i) => (
                  <li key={`${request.id}-pq-${i}`} className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-400">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {request.status === 'awaiting_answers' && iAmReferee ? (
            <div className="space-y-3">
              <p className="text-sm font-semibold text-slate-800">Write your response</p>
              {request.questions.map((q, i) => (
                <div key={`${request.id}-aq-${i}`}>
                  <p className="text-sm font-semibold text-slate-800">
                    {i + 1}. {q}
                  </p>
                  <WritingAssistField
                    value={drafts[i] || ''}
                    onChange={(next) => setDrafts((prev) => ({ ...prev, [i]: next }))}
                    rows={3}
                    placeholder="Your answer…"
                    className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-[#08428c]"
                  />
                </div>
              ))}
              <button
                type="button"
                disabled={busy}
                onClick={() => void handleSubmitAnswers()}
                className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#08428c] text-sm font-semibold text-white disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Send response
              </button>
            </div>
          ) : null}

          {request.status === 'awaiting_answers' && iAmRequester ? (
            <div className="rounded-xl border border-amber-100 bg-amber-50/70 px-4 py-3">
              <p className="text-sm font-semibold text-amber-900">Accepted · waiting for response</p>
              <p className="mt-1 text-xs text-amber-800/80">
                They accepted. You’ll see answers here when they reply.
              </p>
              <ul className="mt-3 space-y-1.5">
                {request.questions.map((q, i) => (
                  <li key={`${request.id}-wq-${i}`} className="text-sm text-slate-700">
                    <span className="font-semibold text-slate-400">{i + 1}.</span> {q}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {(request.status === 'answered' || request.status === 'completed') && (
            <div className="space-y-3">
              <p className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <BadgeCheck className="h-4 w-4 text-emerald-600" />
                Responses
              </p>
              {request.answers?.length ? (
                <ul className="space-y-3">
                  {request.answers.map((a, i) => (
                    <li
                      key={`${request.id}-ans-${i}`}
                      className="rounded-xl border border-slate-200 bg-slate-50/80 px-3.5 py-3"
                    >
                      <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
                        Q{i + 1}
                      </p>
                      <p className="mt-0.5 text-sm font-semibold text-slate-800">{a.question}</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-slate-700">
                        {a.answer}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500">No answers yet.</p>
              )}

              {request.status === 'answered' && iAmRequester && request.escrowHeld ? (
                <div className="rounded-xl border border-sky-100 bg-sky-50/80 p-3.5">
                  <p className="text-sm font-semibold text-slate-800">Rate this response</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Your rating unlocks their token payout.
                  </p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {REFERENCE_RATING_OPTIONS.map(({ id, label, payoutPct }) => (
                      <button
                        key={id}
                        type="button"
                        disabled={busy}
                        onClick={() => void handleRate(id)}
                        className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                      >
                        {label} · {payoutPct}%
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {request.status === 'completed' && request.payoutTokens != null ? (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                  <TokenCoinIcon className="h-4 w-4" />
                  {request.payoutTokens} paid out
                </p>
              ) : null}
            </div>
          )}

          {request.status === 'rejected' ? (
            <div className="rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              This request was rejected.
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 border-t border-slate-100 px-5 py-3.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
