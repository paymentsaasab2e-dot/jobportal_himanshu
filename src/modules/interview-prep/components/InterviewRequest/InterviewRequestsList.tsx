'use client';

import { useQuery } from '@tanstack/react-query';
import {
  candidateScheduleDecision,
  getMyInterviewRequests,
  rematchInterviewRequest,
} from '@/lib/interview-request-api';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

type Props = {
  title?: string;
  subtitle?: string;
  refreshKey?: number;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getScheduleBadge(request: { status: string; candidateFeedback?: string | null }) {
  const status = String(request.status || '');
  if (status === 'ACCEPTED') {
    return {
      text: 'Awaiting Candidate Confirmation',
      className: 'border border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  if (
    status === 'WAITING_FOR_ACCEPTANCE' &&
    String(request.candidateFeedback || '')
      .toLowerCase()
      .includes('new slot')
  ) {
    return {
      text: 'Candidate Requested New Slot',
      className: 'border border-orange-200 bg-orange-50 text-orange-800',
    };
  }
  return null;
}

export function InterviewRequestsList({
  title = 'Your Interview Requests',
  subtitle = 'Track all submitted requests and current status.',
  refreshKey = 0,
}: Props) {
  const router = useRouter();
  const [rematchId, setRematchId] = useState<string | null>(null);
  const [scheduleActionId, setScheduleActionId] = useState<string | null>(null);
  const [selectedSlotByRequest, setSelectedSlotByRequest] = useState<Record<string, string>>({});
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const query = useQuery({
    queryKey: ['my-interview-requests', refreshKey],
    queryFn: () => getMyInterviewRequests(),
    staleTime: 20_000,
    retry: 0,
  });

  const requests = query.data ?? [];
  const grouped = {
    pending: requests.filter((row) =>
      [
        'PENDING_MATCHING',
        'MATCHING',
        'MATCHED',
        'FINDING_INTERVIEWER',
        'WAITING_FOR_ACCEPTANCE',
        'ACCEPTED',
      ].includes(row.status)
    ),
    scheduled: requests.filter((row) => row.status === 'SCHEDULED'),
    completed: requests.filter((row) => row.status === 'COMPLETED'),
    cancelled: requests.filter((row) => ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(row.status)),
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="text-sm text-slate-600">{subtitle}</p>
      </div>

      <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Pending</p>
          <p className="mt-1 text-xl font-bold text-[#1F8FC2]">{grouped.pending.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Scheduled</p>
          <p className="mt-1 text-xl font-bold text-[#1F8FC2]">{grouped.scheduled.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Completed</p>
          <p className="mt-1 text-xl font-bold text-[#1F8FC2]">{grouped.completed.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cancelled</p>
          <p className="mt-1 text-xl font-bold text-[#1F8FC2]">{grouped.cancelled.length}</p>
        </div>
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
      ) : requests.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          No interview requests yet. Create your first request to start matching.
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
          {requests.slice(0, 10).map((request) => (
            <div
              key={request.id}
              className={`w-full max-w-2xl rounded-xl border px-2.5 py-2.5 shadow-sm ${
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
                <span className="font-semibold text-slate-800">Interviewer Candidate:</span>{' '}
                {request.interviewerProfile?.fullName || request.interviewerId || 'Matching in progress'}
              </p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                  {formatDate(request.preferredDate)}
                </span>
                <span className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800">
                  {request.preferredTime.join(', ') || 'No slots'}
                </span>
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
                  <p className="text-xs font-semibold text-amber-800">
                    Interviewer proposed slot: {request.proposedSlot || request.preferredTime?.[0] || 'N/A'}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={scheduleActionId === request.id}
                      onClick={async () => {
                        try {
                          setScheduleActionId(request.id);
                          setScheduleError('');
                          setScheduleMessage('');
                          const slot = selectedSlotByRequest[request.id] || request.preferredTime?.[0] || '';
                          await candidateScheduleDecision(request.id, 'CONFIRM', '', slot);
                          setScheduleMessage(`Confirmed schedule for ${request.requestId}.`);
                          await query.refetch();
                        } catch (error) {
                          setScheduleError(error instanceof Error ? error.message : 'Unable to confirm schedule');
                        } finally {
                          setScheduleActionId(null);
                        }
                      }}
                      className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white disabled:opacity-60"
                    >
                      {scheduleActionId === request.id ? 'Updating...' : 'Confirm Slot'}
                    </button>
                    <button
                      type="button"
                      disabled={scheduleActionId === request.id}
                      onClick={async () => {
                        try {
                          setScheduleActionId(request.id);
                          setScheduleError('');
                          setScheduleMessage('');
                          await candidateScheduleDecision(request.id, 'REQUEST_NEW_SLOT');
                          setScheduleMessage(`Requested new slot for ${request.requestId}.`);
                          await query.refetch();
                        } catch (error) {
                          setScheduleError(error instanceof Error ? error.message : 'Unable to request new slot');
                        } finally {
                          setScheduleActionId(null);
                        }
                      }}
                      className="rounded-md border border-amber-300 bg-white px-2.5 py-1 text-xs font-semibold text-amber-800 disabled:opacity-60"
                    >
                      {scheduleActionId === request.id ? 'Updating...' : 'Request New Slot'}
                    </button>
                  </div>
                  <select
                    value={selectedSlotByRequest[request.id] ?? request.preferredTime?.[0] ?? ''}
                    onChange={(event) =>
                      setSelectedSlotByRequest((prev) => ({ ...prev, [request.id]: event.target.value }))
                    }
                    className="mt-2 w-full rounded-md border border-amber-200 bg-white px-2 py-1.5 text-xs text-slate-700 outline-none focus:border-amber-400"
                  >
                    {(request.preferredTime || []).map((slot) => (
                      <option key={`${request.id}-${slot}`} value={slot}>
                        {slot}
                      </option>
                    ))}
                  </select>
                </div>
              ) : null}
              {request.status === 'SCHEDULED' ? (
                <div className="mt-1.5 inline-flex max-w-full flex-col rounded-md border border-cyan-200 bg-cyan-50 p-1.5">
                  <p className="text-xs font-semibold text-cyan-800">
                    Final slot accepted. You can continue discussion in chat room.
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => router.push(`/lms/interview-prep/candidate-room/${request.id}`)}
                      className="rounded-md bg-cyan-600 px-2.5 py-1 text-xs font-semibold text-white"
                    >
                      Open Chat Room
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
