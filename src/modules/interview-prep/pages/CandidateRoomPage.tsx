'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { buildInterviewLiveMeetingUrl } from '@/lib/interview-live-meeting';
import { useAuth } from '@/components/auth/AuthContext';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import {
  candidateScheduleDecision,
  getInterviewRequestChat,
  getMyInterviewRequests,
  postInterviewRequestChat,
  submitInterviewReview,
} from '@/lib/interview-request-api';
import { InterviewRoomChat } from '@/modules/interview-prep/components/InterviewRoomChat';
import { InterviewSimpleTabs } from '@/modules/interview-prep/components/InterviewSimpleTabs';
import { InterviewReviewModal } from '@/modules/interview-prep/components/InterviewReviewModal';
import {
  formatInterviewWhen,
  getInterviewSessionWindow,
  hasCandidateReviewed,
} from '@/lib/interview-session-window';

export default function CandidateRoomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = String(params?.requestId || '').trim();
  const [selectedSlot, setSelectedSlot] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [roomTab, setRoomTab] = useState<'overview' | 'chat' | 'slot'>('chat');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewBusy, setReviewBusy] = useState(false);

  const requestQuery = useQuery({
    queryKey: ['candidate-room', requestId],
    queryFn: () => getMyInterviewRequests(),
    enabled: Boolean(requestId),
    staleTime: 10_000,
    retry: 0,
  });
  const chatQuery = useQuery({
    queryKey: ['candidate-room-chat', requestId],
    queryFn: () => getInterviewRequestChat(requestId),
    enabled: Boolean(requestId),
    staleTime: 2000,
    refetchInterval: 4000,
    retry: 0,
  });

  const record = useMemo(() => {
    const list = requestQuery.data || [];
    return list.find((item) => String(item.id) === requestId || String(item.requestId) === requestId) || null;
  }, [requestQuery.data, requestId]);

  const joinInterview = async () => {
    if (!record || !user?.id) return;
    if (!record.paymentHeldAt && String(record.status) !== 'SCHEDULED' && String(record.status) !== 'IN_PROGRESS') {
      setError('Confirm and pay tokens before joining. Opening the room does not charge tokens.');
      return;
    }
    setError('');
    setMessage('Opening interview room. Tokens were already charged at confirmation.');
    const liveUrl = buildInterviewLiveMeetingUrl(record.id, {
      role: 'candidate',
      displayName: user?.name || 'Candidate',
    });
    window.open(liveUrl, '_blank', 'noopener,noreferrer');
  };

  const slotOptions = Array.from(
    new Set(
      [record?.proposedSlot, ...(record?.preferredTime || [])].filter(
        (slot): slot is string => Boolean(slot && String(slot).trim())
      )
    )
  );
  const effectiveSlot = selectedSlot || record?.proposedSlot || slotOptions[0] || '';
  const alreadyPaid = Boolean(record?.paymentHeldAt);
  const joinWindowState = useMemo(
    () => getInterviewSessionWindow(record || {}, nowTs),
    [nowTs, record]
  );
  const timelineSteps = useMemo(() => {
    if (!record) return [];
    const status = String(record.status || '').toUpperCase();
    const hasAccepted = ['ACCEPTED', 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(status);
    const hasProposed =
      hasAccepted ||
      (status === 'WAITING_FOR_ACCEPTANCE' && String(record.proposedSlot || '').trim().length > 0);
    const hasScheduled = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED'].includes(status);
    const scheduledAtTime = record.scheduledAt ? new Date(record.scheduledAt).getTime() : null;
    const reminderThreshold =
      typeof scheduledAtTime === 'number' && Number.isFinite(scheduledAtTime)
        ? scheduledAtTime - 60 * 60 * 1000
        : null;
    const reminderSent = Boolean(
      hasScheduled &&
        typeof reminderThreshold === 'number' &&
        Number.isFinite(reminderThreshold) &&
        Date.now() >= reminderThreshold
    );

    return [
      { label: 'Requested', done: true },
      { label: 'Accepted', done: hasAccepted },
      { label: 'Slot Proposed', done: hasProposed },
      { label: 'Scheduled', done: hasScheduled },
      { label: 'Reminder Sent', done: reminderSent },
    ];
  }, [record]);
  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const handleSendChat = async () => {
    const text = chatDraft.trim();
    if (!text) return;
    try {
      setChatSending(true);
      await postInterviewRequestChat(requestId, text, { asRole: 'candidate' });
      setChatDraft('');
      await chatQuery.refetch();
    } finally {
      setChatSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => router.push('/lms/interview-prep/request-interview')}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interview Requests
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Candidate Chat & Slot Room</h1>
        <p className="mt-1 text-sm text-slate-600">Chat with interviewer and finalize one interview slot.</p>

        {requestQuery.isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Loading room details...</p>
        ) : requestQuery.isError ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Unable to connect right now. Please try again in a little while.
          </p>
        ) : !record ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
            Interview not found. This interview isn’t available, or you don’t have access.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-bold text-slate-900">{record.requestId} • {record.statusLabel}</p>
              <p className="mt-1 text-sm text-slate-700">
                Interviewer: {record.interviewerProfile?.fullName || record.interviewerId || 'N/A'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {record.interviewType} • {record.duration} mins • {record.language}
              </p>
              {(() => {
                const when = formatInterviewWhen(record);
                return (
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {when.dateLabel} · {when.timeLabel}
                    {['ACCEPTED', 'WAITING_FOR_ACCEPTANCE'].includes(String(record.status || ''))
                      ? ' · pending confirmation'
                      : ''}
                  </p>
                );
              })()}
            </div>

            <InterviewSimpleTabs
              active={roomTab}
              onChange={(id) => setRoomTab(id as typeof roomTab)}
              tabs={[
                { id: 'overview', label: 'Overview' },
                { id: 'chat', label: 'Chat' },
                { id: 'slot', label: 'Slot' },
              ]}
            />

            {roomTab === 'overview' ? (
              <>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Interview Timeline</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-5">
                {timelineSteps.map((step, index) => (
                  <div
                    key={`${step.label}-${index}`}
                    className={`rounded-lg border px-2 py-1.5 text-center text-[11px] font-semibold ${
                      step.done
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                        : 'border-slate-200 bg-slate-50 text-slate-500'
                    }`}
                  >
                    {step.label}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                {joinWindowState.canJoinNow ? (
                  <button
                    type="button"
                    onClick={() => void joinInterview()}
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white"
                  >
                    Join Interview
                  </button>
                ) : null}
                {joinWindowState.joinOpensAtLabel ? (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700">
                    Join opens at {joinWindowState.joinOpensAtLabel}
                  </span>
                ) : null}
                {joinWindowState.canComplete &&
                record &&
                String(record.status || '') !== 'COMPLETED' &&
                !hasCandidateReviewed(record) ? (
                  <button
                    type="button"
                    onClick={() => setReviewOpen(true)}
                    className="rounded-full bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-white"
                  >
                    Completed
                  </button>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Interview cost
              </p>
              <p className="mt-2 inline-flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-800">
                <TokenCoinIcon className="h-4 w-4" /> {record.interviewPrice || record.interviewerProfile?.interviewPrice || 50} tokens
                <span className="font-normal text-slate-500">
                  · {record.paymentHeldAt ? 'paid at confirmation' : 'due when you confirm'}
                  {record.payoutReleasedAt ? ' · released to interviewer' : ''}
                </span>
              </p>
            </div>
              </>
            ) : null}

            {roomTab === 'chat' ? (
            <InterviewRoomChat
              messages={chatQuery.data || []}
              viewerRole="candidate"
              candidateName={user?.name || 'Candidate'}
              interviewerName={
                record.interviewerProfile?.fullName ||
                record.interviewerId ||
                'Interviewer'
              }
              draft={chatDraft}
              onDraftChange={setChatDraft}
              onSend={() => void handleSendChat()}
              sending={chatSending}
              placeholder="Type message to interviewer…"
            />
            ) : null}

            {roomTab === 'slot' ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final Slot Decision</p>
              {record.status === 'ACCEPTED' ? (
                <p className="mt-1 text-xs text-slate-600">
                  {alreadyPaid
                    ? 'Interviewer proposed a new time. Confirm it at no extra cost.'
                    : 'Interviewer proposed a final slot. Confirm and pay once, then later reschedules are free.'}
                </p>
              ) : (
                <p className="mt-1 text-xs text-slate-600">
                  Current status: {record.statusLabel}
                </p>
              )}
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <select
                  value={effectiveSlot}
                  onChange={(event) => setSelectedSlot(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-cyan-400"
                >
                  {slotOptions.map((slot) => (
                    <option key={`${record.id}-${slot}`} value={slot}>
                      {slot}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={saving || record.status !== 'ACCEPTED'}
                  onClick={async () => {
                    try {
                      setSaving(true);
                      setMessage('');
                      setError('');
                      if (!effectiveSlot) {
                        setError('Please select a slot.');
                        return;
                      }
                      const updated = await candidateScheduleDecision(
                        record.id,
                        'CONFIRM',
                        '',
                        effectiveSlot,
                        record.proposedDate || undefined
                      );
                      setMessage(
                        alreadyPaid
                          ? `New slot confirmed for ${updated.requestId}. Join will use this time.`
                          : `Final slot accepted for ${updated.requestId}.`
                      );
                      await requestQuery.refetch();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Unable to accept slot');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {saving
                    ? 'Saving...'
                    : alreadyPaid
                      ? 'Confirm new slot'
                      : 'Confirm & Pay'}
                </button>
                <button
                  type="button"
                  disabled={saving || record.status !== 'ACCEPTED'}
                  onClick={async () => {
                    try {
                      setSaving(true);
                      setMessage('');
                      setError('');
                      await candidateScheduleDecision(record.id, 'REQUEST_NEW_SLOT', 'Candidate rejected proposed slot');
                      setMessage(`Slot rejected for ${record.requestId}. Interviewer will propose a new slot.`);
                      await requestQuery.refetch();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Unable to reject slot');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold text-rose-700 disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Reject Slot'}
                </button>
              </div>
              {message ? (
                <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {message}
                </p>
              ) : null}
              {error ? (
                <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {error}
                </p>
              ) : null}
            </div>
            ) : null}
          </div>
        )}
      </section>
      <InterviewReviewModal
        open={reviewOpen}
        counterpartName={record?.interviewerProfile?.fullName || 'the interviewer'}
        viewerRole="candidate"
        submitting={reviewBusy}
        error={error}
        onClose={() => setReviewOpen(false)}
        onSubmit={async ({ rating, feedback }) => {
          if (!record) return;
          try {
            setReviewBusy(true);
            setError('');
            await submitInterviewReview(record.id, { rating, feedback });
            setReviewOpen(false);
            setMessage('Review submitted. The interview is marked completed.');
            await requestQuery.refetch();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Unable to submit review');
          } finally {
            setReviewBusy(false);
          }
        }}
      />
    </div>
  );
}
