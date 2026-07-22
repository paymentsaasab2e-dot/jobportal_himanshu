'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { getInterviewerQueue, scheduleInterviewSlot } from '@/lib/interviewer-api';
import { getInterviewRequestChat, postInterviewRequestChat } from '@/lib/interview-request-api';
import { buildInterviewLiveMeetingUrl } from '@/lib/interview-live-meeting';
import { useAuth } from '@/components/auth/AuthContext';

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
  const chatEndRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chatQuery.data?.length]);

  const handleSendChat = async () => {
    const text = chatDraft.trim();
    if (!text) return;
    try {
      setChatSending(true);
      await postInterviewRequestChat(requestId, text);
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
        <h1 className="text-xl font-bold text-slate-900">Interview Room</h1>
        <p className="mt-1 text-sm text-slate-600">Coordinate with candidate and finalize interview timing.</p>

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
              <p className="mt-2 text-[11px] text-slate-500">
                Reminder is auto-sent around 1 hour before scheduled time.
              </p>
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

            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Interview Room Chat</p>
                <p className="mt-0.5 text-[11px] text-emerald-600">
                  Chat directly here with the candidate.
                </p>
              </div>
              <div className="mt-3 rounded-lg border border-slate-200 bg-[#e5ddd5] p-2">
                <div className="max-h-72 space-y-2 overflow-y-auto rounded-md bg-[#efeae2] p-2 pr-1">
                  {(chatQuery.data || []).length === 0 ? (
                    <p className="text-xs text-slate-500">No messages yet. Start the conversation below.</p>
                  ) : (
                    (chatQuery.data || []).map((item) => (
                      <div
                        key={item.id}
                        className={`rounded-lg px-2.5 py-2 text-xs ${
                          item.senderRole === 'interviewer'
                            ? 'ml-auto max-w-[85%] bg-[#dcf8c6] text-slate-900'
                            : 'mr-auto max-w-[85%] bg-white text-slate-800'
                        }`}
                      >
                        <p className="mb-0.5 text-[10px] font-semibold opacity-70">
                          {item.senderRole === 'interviewer' ? 'You' : 'Candidate'}
                        </p>
                        <p>{item.message}</p>
                        <p className="mt-1 text-[10px] opacity-70">
                          {new Date(item.createdAt).toLocaleString()}
                        </p>
                      </div>
                    ))
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="mt-2 flex gap-2">
                  <input
                    value={chatDraft}
                    onChange={(event) => setChatDraft(event.target.value)}
                    placeholder="Type message to candidate..."
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        if (!chatSending) void handleSendChat();
                      }
                    }}
                    className="w-full rounded-full border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700 outline-none focus:border-emerald-400"
                  />
                  <button
                    type="button"
                    disabled={chatSending}
                    onClick={() => void handleSendChat()}
                    className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    {chatSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </div>
            </div>

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
          </div>
        )}
      </section>
    </div>
  );
}
