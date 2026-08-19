'use client';

import { useQuery } from '@tanstack/react-query';
import { getInterviewLiveHistory } from '@/lib/interview-request-api';

type Props = {
  requestId: string;
};

export function InterviewLiveHistory({ requestId }: Props) {
  const query = useQuery({
    queryKey: ['interview-live-history', requestId],
    queryFn: () => getInterviewLiveHistory(requestId),
    enabled: Boolean(requestId),
    staleTime: 15_000,
    retry: 0,
  });

  const notes = String(query.data?.notes || '').trim();
  const messages = query.data?.messages || [];

  if (query.isLoading) {
    return <p className="mt-2 text-xs text-slate-500">Loading meeting notes…</p>;
  }

  if (query.isError) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        Meeting notes are unavailable right now.
      </p>
    );
  }

  if (!notes && messages.length === 0) {
    return (
      <p className="mt-2 text-xs text-slate-500">
        No shared notes or live-room chat were saved for this interview.
      </p>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
      <p className="font-semibold text-slate-900">Meeting notes</p>
      <p className="whitespace-pre-wrap text-slate-700">{notes || 'None'}</p>
      <p className="pt-1 font-semibold text-slate-900">Live room chat</p>
      {messages.length === 0 ? (
        <p className="text-slate-500">No live chat messages.</p>
      ) : (
        <div className="max-h-40 space-y-1.5 overflow-y-auto">
          {messages.map((item, index) => (
            <div key={`${item.id || item.createdAt}-${index}`}>
              <span className="font-semibold text-slate-800">{item.displayName}: </span>
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
