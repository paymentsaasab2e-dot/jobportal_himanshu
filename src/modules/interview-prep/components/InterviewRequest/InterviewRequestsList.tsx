'use client';

import { useQuery } from '@tanstack/react-query';
import {
  candidateScheduleDecision,
  getMyInterviewRequests,
  rematchInterviewRequest,
  submitInterviewReview,
} from '@/lib/interview-request-api';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { buildInterviewLiveMeetingUrl } from '@/lib/interview-live-meeting';
import { useAuth } from '@/components/auth/AuthContext';
import { fetchTokenBalance } from '@/lib/tokens-api';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { ArrowRight } from 'lucide-react';
import { InterviewLiveHistory } from '../InterviewLiveHistory';
import { InterviewReviewModal } from '../InterviewReviewModal';
import {
  displayReviewText,
  formatInterviewWhen,
  getInterviewSessionWindow,
  hasCandidateReviewed,
  hasInterviewerReviewed,
} from '@/lib/interview-session-window';
import { InterviewRescheduleModal } from '../InterviewRescheduleModal';

type Props = {
  title?: string;
  subtitle?: string;
  refreshKey?: number;
  mode?: 'inbox' | 'scheduled' | 'completed' | 'active';
};

const INBOX_STATUSES = [
  'PENDING_MATCHING',
  'MATCHING',
  'MATCHED',
  'FINDING_INTERVIEWER',
  'WAITING_FOR_ACCEPTANCE',
  'ACCEPTED',
];
const SCHEDULED_STATUSES = ['SCHEDULED', 'IN_PROGRESS'];

function getScheduleBadge(request: {
  status: string;
  candidateFeedback?: string | null;
  paymentHeldAt?: string | null;
}) {
  const status = String(request.status || '');
  if (status === 'ACCEPTED') {
    return {
      text: request.paymentHeldAt
        ? 'Confirm new slot — already paid'
        : 'Awaiting Candidate Confirmation',
      className: 'border border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  if (status === 'WAITING_FOR_ACCEPTANCE') {
    return {
      text: request.paymentHeldAt
        ? 'Waiting for interviewer to confirm the new slot — already paid'
        : 'Waiting for interviewer to confirm the new slot',
      className: 'border border-orange-200 bg-orange-50 text-orange-800',
    };
  }
  return null;
}

function getJoinWindowState(request: { scheduledAt?: string | null; duration?: number; status?: string }, nowTs: number) {
  return getInterviewSessionWindow(request, nowTs);
}

export function InterviewRequestsList({
  title = 'Your Interview Requests',
  subtitle = 'Track all submitted requests and current status.',
  refreshKey = 0,
  mode,
}: Props) {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [rematchId, setRematchId] = useState<string | null>(null);
  const [scheduleActionId, setScheduleActionId] = useState<string | null>(null);
  const [selectedSlotByRequest, setSelectedSlotByRequest] = useState<Record<string, string>>({});
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [rescheduleRequestId, setRescheduleRequestId] = useState<string | null>(null);
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const query = useQuery({
    queryKey: ['my-interview-requests', refreshKey],
    queryFn: () => getMyInterviewRequests(),
    staleTime: 20_000,
    retry: 0,
  });
  const balanceQuery = useQuery({
    queryKey: ['token-balance-interview-confirm'],
    queryFn: () => fetchTokenBalance(),
    staleTime: 15_000,
    retry: 0,
  });

  const requests = query.data ?? [];
  const visibleRequests = requests.filter((row) => {
    if (mode === 'completed') return row.status === 'COMPLETED';
    if (mode === 'scheduled') return SCHEDULED_STATUSES.includes(row.status);
    if (mode === 'inbox') return INBOX_STATUSES.includes(row.status);
    if (mode === 'active') return row.status !== 'COMPLETED';
    return true;
  });
  const reviewTarget = requests.find((row) => row.id === reviewRequestId) || null;
  const rescheduleTarget = visibleRequests.find((row) => row.id === rescheduleRequestId) || null;
  useEffect(() => {
    const reviewId = String(searchParams.get('reviewId') || '').trim();
    if (reviewId) setReviewRequestId(reviewId);
  }, [searchParams]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      {query.isLoading ? (
        <p className="text-sm text-slate-500">Loading interview requests...</p>
      ) : query.isError ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
          <p>Unable to load interview requests right now.</p>
          <button
            type="button"
            onClick={() => query.refetch()}
            className="mt-2 rounded-md border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700"
          >
            Retry
          </button>
        </div>
      ) : visibleRequests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          {mode === 'completed'
            ? 'No completed interviews yet. After the meeting ends, both of you can leave a review.'
            : mode === 'scheduled'
              ? 'No scheduled interviews yet.'
              : 'No interview requests in this tab yet.'}
        </p>
      ) : (
        <div className="space-y-2">
          {scheduleMessage ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {scheduleMessage}
            </p>
          ) : null}
          {scheduleError ? (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {scheduleError}
            </p>
          ) : null}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRequests.slice(0, 20).map((request) => (
            <div
              key={request.id}
              className={`flex h-full min-w-0 flex-col rounded-xl border px-2.5 py-2.5 shadow-sm ${
                request.status === 'SCHEDULED'
                  ? 'border-cyan-200 bg-linear-to-br from-cyan-50 via-white to-blue-50'
                  : 'border-slate-200 bg-white'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <p className="text-sm font-bold text-slate-900">{request.requestId}</p>
                <div className="flex items-center gap-2">
                  {(request.status === 'FINDING_INTERVIEWER' || request.status === 'MATCHING') ? (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          setRematchId(request.id);
                          await rematchInterviewRequest(request.id);
                          await query.refetch();
                        } finally {
                          setRematchId(null);
                        }
                      }}
                      disabled={rematchId === request.id}
                      className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 disabled:opacity-60"
                    >
                      {rematchId === request.id ? 'Matching...' : 'Retry Match'}
                    </button>
                  ) : null}
                  <span className="rounded-full bg-[#EAF7FD] px-2.5 py-1 text-xs font-semibold text-[#1F8FC2]">
                    {request.statusLabel}
                  </span>
                </div>
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {request.category}
                </span>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {request.interviewType}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Interviewer:</span>{' '}
                {request.interviewerProfile?.fullName || request.interviewerId || 'Matching in progress'}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {(() => {
                  const when = formatInterviewWhen(request);
                  return (
                    <>
                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                        {when.dateLabel}
                      </span>
                      <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                        {when.timeLabel}
                      </span>
                    </>
                  );
                })()}
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                  {request.duration} mins
                </span>
              </div>
              {getScheduleBadge(request) ? (
                <span
                  className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getScheduleBadge(request)?.className}`}
                >
                  {getScheduleBadge(request)?.text}
                </span>
              ) : null}
              {request.status === 'ACCEPTED' ? (
                <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-2">
                  {(() => {
                    const alreadyPaid = Boolean(request.paymentHeldAt);
                    const cost = Number(request.interviewPrice || request.interviewerProfile?.interviewPrice || 50);
                    const balance = Number(balanceQuery.data?.tokenBalance ?? 0);
                    const remaining = balance - cost;
                    const short = remaining < 0;
                    const confirmSlot =
                      request.proposedSlot ||
                      selectedSlotByRequest[request.id] ||
                      request.preferredTime?.[0] ||
                      '';
                    return (
                      <>
                        <p className="text-xs font-semibold text-amber-800">
                          Interviewer proposed slot: {request.proposedSlot || formatInterviewWhen(request).timeLabel}
                        </p>
                        <p className="mt-1 text-xs text-slate-700">
                          Interviewer: {request.interviewerProfile?.fullName || 'Assigned interviewer'}
                          {request.interviewerProfile?.currentRole ? ` · ${request.interviewerProfile.currentRole}` : ''}
                        </p>
                        {alreadyPaid ? (
                          <p className="mt-2 text-xs text-emerald-800">
                            Tokens already paid. Confirm this new time at no extra cost.
                          </p>
                        ) : (
                          <>
                            <div className="mt-2 space-y-0.5 text-xs text-slate-700">
                              <p>Interview Cost: <span className="font-semibold">{cost} Tokens</span></p>
                              <p>Your Balance: <span className="font-semibold">{balance} Tokens</span></p>
                              <p>
                                Remaining After Booking:{' '}
                                <span className={`font-semibold ${short ? 'text-rose-700' : 'text-emerald-700'}`}>
                                  {short ? `${Math.abs(remaining)} short` : remaining} Tokens
                                </span>
                              </p>
                            </div>
                            {short ? (
                              <a
                                href="/candidate-dashboard"
                                className="mt-2 inline-flex rounded-md bg-[#2098C8] px-2.5 py-1 text-xs font-semibold text-white"
                              >
                                Buy Tokens
                              </a>
                            ) : null}
                          </>
                        )}
                        <div className="mt-2 flex flex-wrap gap-2">
                          <button
                            type="button"
                            disabled={scheduleActionId === request.id || (!alreadyPaid && short)}
                            onClick={async () => {
                              try {
                                setScheduleActionId(request.id);
                                setScheduleError('');
                                setScheduleMessage('');
                                const paid = await candidateScheduleDecision(
                                  request.id,
                                  'CONFIRM',
                                  '',
                                  confirmSlot,
                                  request.proposedDate || undefined
                                );
                                const nextCost = Number(paid.interviewPrice || request.interviewPrice || 50);
                                setScheduleMessage(
                                  alreadyPaid
                                    ? `New slot confirmed for ${request.requestId}. Join will use this time.`
                                    : `Confirmed and paid ${nextCost} tokens for ${request.requestId}. Interview is scheduled.`
                                );
                                await Promise.all([query.refetch(), balanceQuery.refetch()]);
                              } catch (error) {
                                const code = (error as Error & { code?: string }).code;
                                if (code === 'INSUFFICIENT_TOKENS') {
                                  setScheduleError(error instanceof Error ? error.message : 'Insufficient tokens');
                                } else {
                                  setScheduleError(error instanceof Error ? error.message : 'Unable to confirm schedule');
                                }
                              } finally {
                                setScheduleActionId(null);
                              }
                            }}
                            className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                          >
                            {scheduleActionId === request.id
                              ? 'Updating...'
                              : alreadyPaid
                                ? 'Confirm new slot'
                                : `Confirm & Pay ${cost} Tokens`}
                          </button>
                          <button
                            type="button"
                            disabled={scheduleActionId === request.id}
                            onClick={() => {
                              setScheduleError('');
                              setScheduleMessage('');
                              setRescheduleRequestId(request.id);
                            }}
                            className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 disabled:opacity-60"
                          >
                            Request New Slot
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              ) : null}
              {request.interviewerId ? (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {(() => {
                    const fee = Number(request.interviewPrice || request.interviewerProfile?.interviewPrice || 0);
                    return fee ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-800">
                        Cost <TokenCoinIcon className="h-3.5 w-3.5" /> {fee}
                        {request.paymentHeldAt ? ' · paid' : ''}
                      </span>
                    ) : null;
                  })()}
                  <button
                    type="button"
                    onClick={() => router.push(`/lms/interview-prep/candidate-room/${request.id}`)}
                    className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Chat
                  </button>
                  {['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'WAITING_FOR_ACCEPTANCE'].includes(request.status) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setScheduleError('');
                        setRescheduleRequestId(request.id);
                      }}
                      className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold text-amber-800"
                    >
                      Reschedule
                    </button>
                  ) : null}
                  {request.status === 'SCHEDULED' || request.status === 'IN_PROGRESS'
                    ? (() => {
                        const joinState = getJoinWindowState(request, nowTs);
                        if (joinState.canJoinNow) {
                          return (
                            <button
                              type="button"
                              onClick={() => {
                                const liveUrl = buildInterviewLiveMeetingUrl(request.id, {
                                    role: 'candidate',
                                    displayName: user?.name || 'Candidate',
                                  },
                                );
                                window.open(liveUrl, '_blank', 'noopener,noreferrer');
                              }}
                              className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-3 py-1 text-[11px] font-semibold text-white"
                            >
                              Join
                              <ArrowRight className="h-3 w-3" />
                            </button>
                          );
                        }
                        return (
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-800">
                            {joinState.joinOpensAtLabel
                              ? `Join opens at ${joinState.joinOpensAtLabel}`
                              : 'Starts when slot opens'}
                          </span>
                        );
                      })()
                    : null}
                  {request.status !== 'COMPLETED' &&
                  getJoinWindowState(request, nowTs).canComplete &&
                  !hasCandidateReviewed(request) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewError('');
                        setReviewRequestId(request.id);
                      }}
                      className="rounded-full bg-slate-900 px-3 py-1 text-[11px] font-semibold text-white"
                    >
                      Completed
                    </button>
                  ) : null}
                </div>
              ) : null}
              {request.status === 'COMPLETED' || hasCandidateReviewed(request) || hasInterviewerReviewed(request) ? (
                <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-700">
                  <p>
                    <span className="font-semibold text-slate-900">Your review:</span>{' '}
                    {hasCandidateReviewed(request)
                      ? `${request.candidateRating || '—'}★ · ${displayReviewText(request.candidateFeedback) || 'Submitted'}`
                      : 'Not submitted yet'}
                  </p>
                  <p>
                    <span className="font-semibold text-slate-900">Interviewer review:</span>{' '}
                    {hasInterviewerReviewed(request)
                      ? `${request.interviewerRating || '—'}★ · ${displayReviewText(request.interviewerFeedback) || 'Submitted'}`
                      : 'Waiting for interviewer'}
                  </p>
                </div>
              ) : null}
              {mode === 'completed' && !hasCandidateReviewed(request) ? (
                <button
                  type="button"
                  onClick={() => {
                    setReviewError('');
                    setReviewRequestId(request.id);
                  }}
                  className="mt-2 rounded-lg bg-[#2098C8] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  Add review
                </button>
              ) : null}
              {mode === 'completed' ? <InterviewLiveHistory requestId={request.id} /> : null}
            </div>
          ))}
          </div>
        </div>
      )}
      <InterviewReviewModal
        open={Boolean(reviewTarget)}
        counterpartName={reviewTarget?.interviewerProfile?.fullName || 'the interviewer'}
        viewerRole="candidate"
        submitting={reviewBusy}
        error={reviewError}
        onClose={() => {
          setReviewRequestId(null);
          setReviewError('');
        }}
        onSubmit={async ({ rating, feedback }) => {
          if (!reviewTarget) return;
          try {
            setReviewBusy(true);
            setReviewError('');
            await submitInterviewReview(reviewTarget.id, { rating, feedback });
            setReviewRequestId(null);
            await query.refetch();
          } catch (error) {
            setReviewError(error instanceof Error ? error.message : 'Unable to submit review');
          } finally {
            setReviewBusy(false);
          }
        }}
      />
      <InterviewRescheduleModal
        open={Boolean(rescheduleTarget)}
        title="Propose a new interview slot"
        subtitle="Pick a date and time. The interviewer will confirm to continue."
        initialDate={rescheduleTarget?.proposedDate || rescheduleTarget?.preferredDate || rescheduleTarget?.scheduledAt}
        initialTime={rescheduleTarget?.proposedSlot || rescheduleTarget?.scheduledAt || rescheduleTarget?.preferredTime?.[0]}
        submitting={rescheduleBusy}
        error={scheduleError}
        onClose={() => {
          if (!rescheduleBusy) setRescheduleRequestId(null);
        }}
        onSubmit={async ({ date, time }) => {
          if (!rescheduleTarget) return;
          try {
            setRescheduleBusy(true);
            setScheduleError('');
            await candidateScheduleDecision(rescheduleTarget.id, 'PROPOSE_SLOT', '', time, date);
            setScheduleMessage(`New slot sent for ${rescheduleTarget.requestId}. Waiting for interviewer confirmation.`);
            setRescheduleRequestId(null);
            await query.refetch();
          } catch (error) {
            setScheduleError(error instanceof Error ? error.message : 'Unable to propose a new slot');
          } finally {
            setRescheduleBusy(false);
          }
        }}
      />
    </section>
  );
}
