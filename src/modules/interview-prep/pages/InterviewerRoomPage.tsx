'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { getInterviewerQueue, scheduleInterviewSlot } from '@/lib/interviewer-api';
import { getInterviewRequestChat, postInterviewRequestChat } from '@/lib/interview-request-api';
import { buildInterviewLiveMeetingUrl } from '@/lib/interview-live-meeting';
import { useAuth } from '@/components/auth/AuthContext';
import { TokenCoinIcon } from '@/components/tokens/TokenCoinIcon';
import {
  clampInterviewFee,
  getInterviewEscrow,
  setInterviewFee,
} from '@/lib/interview-token-escrow';
import { InterviewRoomChat } from '@/modules/interview-prep/components/InterviewRoomChat';
import { InterviewSimpleTabs } from '@/modules/interview-prep/components/InterviewSimpleTabs';

export default function InterviewerRoomPage() {
  const { user } = useAuth();
  const router = useRouter();
  const params = useParams<{ requestId: string }>();
  const requestId = String(params?.requestId || '').trim();
  const [selectedSlot, setSelectedSlot] = useState('');
  const [actionMessage, setActionMessage] = useState('');
  const [actionError, setActionError] = useState('');
  const [saving, setSaving] = useState(false);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [feeTokens, setFeeTokens] = useState(15);
  const [escrowTick, setEscrowTick] = useState(0);
  const [roomTab, setRoomTab] = useState<'overview' | 'chat' | 'slot'>('chat');

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

  const escrow = useMemo(() => {
    void escrowTick;
    return requestId ? getInterviewEscrow(requestId) : null;
  }, [requestId, escrowTick]);

  useEffect(() => {
    if (escrow?.feeTokens) setFeeTokens(escrow.feeTokens);
  }, [escrow?.feeTokens]);

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
  const canProposeFinalSlot =
    record?.status === 'ACCEPTED' || record?.status === 'WAITING_FOR_ACCEPTANCE';

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
              <span className="text-xs font-semibold text-slate-600">Token fee</span>
              <label className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <TokenCoinIcon className="h-4 w-4" />
                <input
                  type="number"
                  min={5}
                  max={100}
                  disabled={Boolean(escrow?.escrowHeld || escrow?.settledAt)}
                  value={feeTokens}
                  onChange={(e) => setFeeTokens(clampInterviewFee(Number(e.target.value)))}
                  className="w-16 rounded-lg border border-slate-200 bg-white px-2 py-1 text-sm outline-none focus:border-emerald-400 disabled:bg-slate-100"
                />
              </label>
              <button
                type="button"
                disabled={Boolean(escrow?.escrowHeld || escrow?.settledAt) || !user?.id}
                onClick={() => {
                  if (!user?.id || !record) return;
                  const result = setInterviewFee({
                    requestId: record.id || requestId,
                    interviewerId: user.id,
                    candidateId: String(record.candidateId || ''),
                    feeTokens,
                  });
                  if (!result.ok) {
                    setActionError(result.error);
                    return;
                  }
                  setActionError('');
                  setActionMessage(`Fee saved · ${result.escrow.feeTokens} tokens`);
                  setEscrowTick((n) => n + 1);
                }}
                className="rounded-full bg-[#0A66C2] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
              >
                {escrow?.escrowHeld || escrow?.settledAt ? 'Locked' : 'Save'}
              </button>
              {escrow?.settledAt ? (
                <span className="text-[11px] text-slate-500">Paid {escrow.payoutTokens ?? 0}</span>
              ) : escrow?.escrowHeld ? (
                <span className="text-[11px] text-slate-500">Held</span>
              ) : null}
            </div>
          ) : null}
        </div>

        {queueQuery.isLoading ? (
          <p className="mt-4 text-sm text-slate-600">Loading interview details...</p>
        ) : queueQuery.isError ? (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Unable to load interview room right now.
          </p>
        ) : !record ? (
          <p className="mt-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
            Interview request not found in your queue.
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
                      const liveUrl = buildInterviewLiveMeetingUrl(record.requestId || record.id, {
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
                  {(record.preferredTime || []).map((slot) => (
                    <option key={`${record.id}-${slot}`} value={slot}>
                      {slot}
                    </option>
                  ))}
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
    </div>
  );
}
