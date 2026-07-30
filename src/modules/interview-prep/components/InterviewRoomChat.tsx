'use client';

import { useEffect, useRef } from 'react';
import type { InterviewRequestChatMessage } from '@/lib/interview-request-api';

type Props = {
  messages: InterviewRequestChatMessage[];
  viewerRole: 'candidate' | 'interviewer';
  candidateName: string;
  interviewerName: string;
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  sending?: boolean;
  placeholder?: string;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function InterviewRoomChat({
  messages,
  viewerRole,
  candidateName,
  interviewerName,
  draft,
  onDraftChange,
  onSend,
  sending,
  placeholder,
}: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const peerName = viewerRole === 'candidate' ? interviewerName : candidateName;

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-[#075e54] px-3 py-2.5 text-white">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
          {(peerName || '?').slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{peerName}</p>
          <p className="text-[10px] text-white/80">
            {viewerRole === 'candidate' ? 'Interviewer' : 'Candidate'}
          </p>
        </div>
      </div>

      <div className="bg-[#e5ddd5] p-2">
        <div className="max-h-72 space-y-1.5 overflow-y-auto rounded-md bg-[#efeae2] p-2 pr-1">
          {messages.length === 0 ? (
            <p className="py-6 text-center text-xs text-slate-500">No messages yet</p>
          ) : (
            messages.map((item) => {
              const role = String(item.senderRole || '').toLowerCase();
              const isMine = role === viewerRole;
              const label = isMine
                ? 'You'
                : role === 'interviewer'
                  ? interviewerName
                  : candidateName;
              return (
                <div
                  key={item.id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] rounded-lg px-2.5 py-1.5 text-xs shadow-sm ${
                      isMine
                        ? 'rounded-tr-none bg-[#dcf8c6] text-slate-900'
                        : 'rounded-tl-none bg-white text-slate-800'
                    }`}
                  >
                    <p className="mb-0.5 text-[10px] font-semibold text-slate-500">{label}</p>
                    <p className="whitespace-pre-wrap break-words">{item.message}</p>
                    <p className="mt-0.5 text-right text-[9px] text-slate-500">
                      {formatTime(item.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={endRef} />
        </div>

        <div className="mt-2 flex items-center gap-2">
          <input
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            placeholder={placeholder || 'Type a message…'}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                if (!sending) onSend();
              }
            }}
            className="w-full rounded-full border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-700 outline-none focus:border-emerald-400"
          />
          <button
            type="button"
            disabled={sending || !draft.trim()}
            onClick={onSend}
            className="shrink-0 rounded-full bg-[#25d366] px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
          >
            {sending ? '…' : 'Send'}
          </button>
        </div>
      </div>
    </div>
  );
}
