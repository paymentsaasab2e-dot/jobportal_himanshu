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
} from '@/lib/interview-request-api';
import {
  getInterviewEscrow,
  holdInterviewEscrowOnStart,
  REFERENCE_RATING_OPTIONS,
  settleInterviewEscrowWithRating,
  type InterviewRating,
} from '@/lib/interview-token-escrow';
import { InterviewRoomChat } from '@/modules/interview-prep/components/InterviewRoomChat';
import { InterviewSimpleTabs } from '@/modules/interview-prep/components/InterviewSimpleTabs';

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
  const [escrowTick, setEscrowTick] = useState(0);
  const [ratingBusy, setRatingBusy] = useState(false);
  const [roomTab, setRoomTab] = useState<'overview' | 'chat' | 'slot'>('chat');

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

  const escrowKey = String(record?.id || requestId);
  const escrow = useMemo(() => {
    void escrowTick;
    return escrowKey ? getInterviewEscrow(escrowKey) : null;
  }, [escrowKey, escrowTick]);

  const joinInterview = async () => {
    if (!record || !user?.id) return;
    setError('');
    setMessage('');
    const held = await holdInterviewEscrowOnStart({
      requestId: record.id || requestId,
      candidateId: user.id,
    });
    if (!held.ok) {
      setError(held.error);
      return;
    }
    setEscrowTick((n) => n + 1);
    setMessage(`Escrow held · ${held.escrow.feeTokens} tokens. Opening interview room…`);
    const liveUrl = buildInterviewLiveMeetingUrl(record.requestId || record.id, {
      role: 'candidate',
      displayName: user?.name || 'Candidate',
    });
    window.open(liveUrl, '_blank', 'noopener,noreferrer');
  };

  const submitRating = async (rating: InterviewRating) => {
    if (!user?.id || !record) return;
    setRatingBusy(true);
    setError('');
    try {
      const result = await settleInterviewEscrowWithRating({
        requestId: record.id || requestId,
        candidateId: user.id,
        rating,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEscrowTick((n) => n + 1);
      setMessage(
        `Thanks for your feedback. ${result.escrow.payoutTokens ?? 0} tokens paid to the interviewer.`,
      );
    } finally {
      setRatingBusy(false);
    }
  };

  const effectiveSlot = selectedSlot || record?.preferredTime?.[0] || '';
  const joinWindowState = useMemo(() => {
    const scheduledAtMs = record?.scheduledAt ? new Date(record.scheduledAt).getTime() : Number.NaN;
    if (!Number.isFinite(scheduledAtMs)) {
      return { canJoinNow: false, joinOpensAtLabel: null as string | null };
    }
    const durationMin = Math.max(15, Number(record?.duration || 45));
    const joinOpensAt = scheduledAtMs - 15 * 60 * 1000;
    const joinClosesAt = scheduledAtMs + (durationMin + 30) * 60 * 1000;
    const canJoinNow = nowTs >= joinOpensAt && nowTs <= joinClosesAt;
    const joinOpensAtLabel =
      nowTs < joinOpensAt
        ? new Date(joinOpensAt).toLocaleString('en-IN', {
            day: '2-digit',
            month: 'short',
            hour: 'numeric',
            minute: '2-digit',
          })
        : null;
    return { canJoinNow, joinOpensAtLabel };
  }, [nowTs, record?.duration, record?.scheduledAt]);
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
            Unable to load interview room right now.
          </p>
        ) : !record ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
            Interview request not found.
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
                    {escrow?.feeTokens ? (
                      <span className="inline-flex items-center gap-0.5 opacity-90">
                        · <TokenCoinIcon className="h-3 w-3" /> {escrow.feeTokens}
                      </span>
                    ) : null}
                  </button>
                ) : null}
                {joinWindowState.joinOpensAtLabel ? (
                  <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700">
                    Join opens at {joinWindowState.joinOpensAtLabel}
                  </span>
                ) : null}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Token fee
              </p>
              {escrow ? (
                <p className="mt-2 inline-flex flex-wrap items-center gap-1 text-sm font-semibold text-slate-800">
                  Fee <TokenCoinIcon className="h-4 w-4" /> {escrow.feeTokens}
                  <span className="font-normal text-slate-500">
                    ·{' '}
                    {escrow.settledAt
                      ? `settled (paid ${escrow.payoutTokens ?? 0})`
                      : escrow.escrowHeld
                        ? 'held — rate below to release payout'
                        : 'due when you join'}
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-xs text-amber-700">
                  Waiting for interviewer to set the token fee.
                </p>
              )}
            </div>

            {escrow?.escrowHeld && !escrow.settledAt ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                  Rate interviewer feedback
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {REFERENCE_RATING_OPTIONS.map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      disabled={ratingBusy}
                      onClick={() => void submitRating(opt.id)}
                      className="rounded-full border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-950 hover:bg-amber-100 disabled:opacity-50"
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
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
                  Interviewer proposed a final slot. Accept or reject this slot.
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
                  {(record.preferredTime || []).map((slot) => (
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
                      const updated = await candidateScheduleDecision(record.id, 'CONFIRM', '', effectiveSlot);
                      setMessage(`Final slot accepted for ${updated.requestId}.`);
                      await requestQuery.refetch();
                    } catch (err) {
                      setError(err instanceof Error ? err.message : 'Unable to accept slot');
                    } finally {
                      setSaving(false);
                    }
                  }}
                  className="rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
                >
                  {saving ? 'Saving...' : 'Accept Slot'}
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
    </div>
  );
}
