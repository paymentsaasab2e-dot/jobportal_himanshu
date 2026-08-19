'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { getInterviewerQueue, scheduleInterviewSlot } from '@/lib/interviewer-api';
import { getInterviewRequestChat, postInterviewRequestChat, submitInterviewReview } from '@/lib/interview-request-api';
import { buildInterviewLiveMeetingUrl } from '@/lib/interview-live-meeting';
import { useAuth } from '@/components/auth/AuthContext';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import { InterviewRoomChat } from '@/modules/interview-prep/components/InterviewRoomChat';
import { InterviewSimpleTabs } from '@/modules/interview-prep/components/InterviewSimpleTabs';
import { InterviewReviewModal } from '@/modules/interview-prep/components/InterviewReviewModal';
import { InterviewRescheduleModal } from '@/modules/interview-prep/components/InterviewRescheduleModal';
import {
  formatInterviewWhen,
  getInterviewSessionWindow,
  hasInterviewerReviewed,
} from '@/lib/interview-session-window';

export default function InterviewerRoomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = String(params?.requestId || '').trim();
  const [selectedSlot, setSelectedSlot] = useState('');
  const [customTime, setCustomTime] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [roomTab, setRoomTab] = useState<'overview' | 'chat' | 'slot'>('chat');
  const [reviewOpen, setReviewOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);

  const queueQuery = useQuery({
    queryKey: ['interviewer-room', requestId],
    queryFn: getInterviewerQueue,
    enabled: Boolean(requestId),
    staleTime: 10_000,
    retry: 0,
  });
  const chatQuery = useQuery({
    queryKey: ['interviewer-room-chat', requestId],
    queryFn: () => getInterviewRequestChat(requestId),
    enabled: Boolean(requestId),
    refetchInterval: 4000,
    staleTime: 2000,
    retry: 0,
  });

  const record = useMemo(() => {
    const list = queueQuery.data || [];
    return list.find((item) => String(item.id) === requestId || String(item.requestId) === requestId) || null;
  }, [queueQuery.data, requestId]);

  const slotOptions = Array.from(
    new Set(
      [
        record?.candidateProposedSlot,
        record?.proposedSlot,
        ...(record?.preferredTime || []),
      ].filter((slot): slot is string => Boolean(slot && String(slot).trim()))
    )
  );
  const effectiveSlot = selectedSlot || record?.proposedSlot || slotOptions[0] || '';
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
  const canProposeFinalSlot =
    record?.status === 'ACCEPTED' ||
    record?.status === 'WAITING_FOR_ACCEPTANCE' ||
    record?.status === 'SCHEDULED';

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
      await postInterviewRequestChat(requestId, text, { asRole: 'interviewer' });
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
        onClick={() => router.push('/lms/interview-prep/become-interviewer')}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interviewer Queue
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-xl font-bold text-slate-900">Interview Room</h1>
            <p className="mt-1 text-sm text-slate-600">Coordinate with candidate and finalize interview timing.</p>
          </div>
          {record ? (
            <div className="flex shrink-0 flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              <span className="text-xs font-semibold text-slate-600">Agreed price</span>
              <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800">
                <TokenCoinIcon className="h-4 w-4" />
                {record.interviewPrice || 50}
              </span>
              <span className="text-[11px] text-slate-500">
                {record.payoutReleasedAt
                  ? 'Paid to you'
                  : record.paymentHeldAt
                    ? 'Held until you complete'
                    : 'Candidate pays on confirm'}
              </span>
            </div>
          ) : null}
        </div>

        {queueQuery.isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Loading interview details...</p>
        ) : queueQuery.isError ? (
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
                Candidate: {record.candidateProfile?.fullName || record.candidateId} • Role: {record.targetRole || 'N/A'}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                {record.interviewType} • {record.language} • {record.duration} mins
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
                    onClick={() => {
                      const liveUrl = buildInterviewLiveMeetingUrl(record.id, {
                        role: 'interviewer',
                        displayName: user?.name || 'Interviewer',
                      });
                      window.open(liveUrl, '_blank', 'noopener,noreferrer');
                    }}
                    className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
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
                !hasInterviewerReviewed(record) ? (
                  <button
                    type="button"
                    onClick={() => setReviewOpen(true)}
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                  >
                    Completed
                  </button>
                ) : null}
              </div>
            </div>
            ) : null}

            {roomTab === 'chat' ? (
            <InterviewRoomChat
              messages={chatQuery.data || []}
              viewerRole="interviewer"
              candidateName={
                record.candidateProfile?.fullName || record.candidateId || 'Candidate'
              }
              interviewerName={user?.name || 'Interviewer'}
              draft={chatDraft}
              onDraftChange={setChatDraft}
              onSend={() => void handleSendChat()}
              sending={chatSending}
              placeholder="Type message to candidate…"
            />
            ) : null}

            {roomTab === 'slot' ? (
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Final Slot Proposal</p>
              <p className="mt-1 text-xs text-slate-600">
                Propose one final slot. Candidate will accept or reject it.
              </p>
              <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_auto]">
                <select
                  value={effectiveSlot}
                  onChange={(event) => setSelectedSlot(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
                >
                  {slotOptions.map((slot) => (
                    <option key={`${record.id}-${slot}`} value={slot}>
                      {slot}
                    </option>
                  ))}
                  {selectedSlot && !slotOptions.includes(selectedSlot) ? (
                    <option value={selectedSlot}>Custom · {selectedSlot}</option>
                  ) : null}
                </select>
                <button
                  type="button"
                  disabled={saving || !canProposeFinalSlot}
                  onClick={async () => {
                    try {
                      setSaving(true);
                      setActionMessage('');
                      setActionError('');
                      if (!effectiveSlot) {
                        setActionError('Please select a slot.');
                        return;
                      }
                      const updated = await scheduleInterviewSlot(record.id, effectiveSlot);
                      setActionMessage(`Slot proposed for ${updated.requestId}. Waiting for candidate accept/reject.`);
                      await queueQuery.refetch();
                    } catch (error) {
                      setActionError(error instanceof Error ? error.message : 'Unable to propose slot');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {saving ? 'Saving...' : canProposeFinalSlot ? 'Propose Final Slot' : 'Already Finalized'}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <input
                  type="time"
                  value={customTime}
                  onChange={(event) => setCustomTime(event.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!customTime) return;
                    setSelectedSlot(customTime);
                  }}
                  className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800"
                >
                  Use this time
                </button>
                <button
                  type="button"
                  onClick={() => setRescheduleOpen(true)}
                  className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800"
                >
                  Pick date & time
                </button>
              </div>
              {actionMessage ? (
                <p className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  {actionMessage}
                </p>
              ) : null}
              {actionError ? (
                <p className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {actionError}
                </p>
              ) : null}
            </div>
            ) : null}
          </div>
        )}
      </section>
      <InterviewReviewModal
        open={reviewOpen}
        counterpartName={record?.candidateProfile?.fullName || 'the candidate'}
        viewerRole="interviewer"
        submitting={saving}
        error={actionError}
        onClose={() => setReviewOpen(false)}
        onSubmit={async ({ rating, feedback }) => {
          if (!record) return;
          try {
            setSaving(true);
            setActionError('');
            await submitInterviewReview(record.id, { rating, feedback });
            setReviewOpen(false);
            setActionMessage('Review submitted. The interview is marked completed.');
            await queueQuery.refetch();
          } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to submit review');
          } finally {
            setSaving(false);
          }
        }}
      />
      <InterviewRescheduleModal
        open={rescheduleOpen && Boolean(record)}
        title="Propose a new interview slot"
        subtitle="Pick a date and time. The candidate will confirm to continue."
        initialDate={record?.proposedDate || record?.preferredDate || record?.scheduledAt}
        initialTime={record?.proposedSlot || record?.scheduledAt || selectedSlot || record?.preferredTime?.[0]}
        submitting={saving}
        error={actionError}
        onClose={() => {
          if (!saving) setRescheduleOpen(false);
        }}
        onSubmit={async ({ date, time }) => {
          if (!record) return;
          try {
            setSaving(true);
            setActionError('');
            await scheduleInterviewSlot(record.id, time, '', date);
            setActionMessage(`Slot proposed for ${record.requestId}. Waiting for candidate confirmation.`);
            setRescheduleOpen(false);
            await queueQuery.refetch();
          } catch (error) {
            setActionError(error instanceof Error ? error.message : 'Unable to propose slot');
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
