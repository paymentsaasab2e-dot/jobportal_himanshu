'use client';

import { useEffect, useRef, useState, type RefObject } from 'react';
import Image from 'next/image';
import { BadgeCheck, Check, Mic, Minus, X, ArrowLeft } from 'lucide-react';
import { formatInUserTimeZone } from '@/lib/user-timezone';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import {
  getReferenceCheck,
  getReferencePeerLabel,
  rateReferenceCheck,
  respondReferenceCheck,
  REFERENCE_RATING_OPTIONS,
  sendReferenceMessage,
  submitReferenceAnswers,
  type ReferenceRating,
} from '@/lib/reference-check-store';
import {
  getDmPeerLabel,
  getDmThread,
  respondDirectMessage,
  sendDirectMessage,
  softPullSocialFromServer,
} from '@/lib/social-store';
import {
  getHryantraVerifiedChatById,
  HRYANTRA_SYSTEM_SENDER_ID,
  markHryantraVerifiedChatRead,
  sendHryantraVerifiedUserMessage,
} from '@/lib/hryantra-verified-chat-store';
import { recordSuggestionClick } from '@/lib/suggestions-engine';
import { fileToDataUrl, getGossipIdentity } from '@/lib/community-store';
import { isUserOnline } from '@/lib/presence';
import { WritingAssistField } from '@/components/common/WritingSuggestions';

function ComposeAssetIcon({
  src,
  alt,
  size = 20,
}: {
  src: string;
  alt: string;
  size?: number;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="object-contain"
      style={{ width: size, height: size }}
      aria-hidden
    />
  );
}

export type ChatKind = 'reference' | 'dm' | 'hryantra';

type ChatMediaKind = 'image' | 'voice';

function calendarDayKey(date: Date) {
  return formatInUserTimeZone(date, { year: 'numeric', month: '2-digit', day: '2-digit' }, 'en-CA');
}

function sameCalendarDay(a: Date, b: Date) {
  return calendarDayKey(a) === calendarDayKey(b);
}

/** WhatsApp-style day chip: Today / Yesterday / full past date */
function formatChatDayLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  if (sameCalendarDay(d, today)) return 'Today';
  if (sameCalendarDay(d, yesterday)) return 'Yesterday';
  return formatInUserTimeZone(d, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatChatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return formatInUserTimeZone(d, { hour: 'numeric', minute: '2-digit' });
}

/** Time only for today; for older days include short date + time under the bubble */
function formatChatBubbleStamp(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const time = formatChatTime(iso);
  const today = new Date();
  if (sameCalendarDay(d, today)) return time;
  const thisYear = formatInUserTimeZone(today, { year: 'numeric' }, 'en-CA');
  const msgYear = formatInUserTimeZone(d, { year: 'numeric' }, 'en-CA');
  const datePart = formatInUserTimeZone(d, {
    day: 'numeric',
    month: 'short',
    ...(msgYear !== thisYear ? { year: 'numeric' as const } : {}),
  });
  return `${datePart}, ${time}`;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return `unknown-${iso}`;
  return calendarDayKey(d) || `unknown-${iso}`;
}

type Props = {
  kind: ChatKind;
  chatId: string;
  userId: string;
  onClose: () => void;
  onRefresh?: () => void;
  /** `embedded` = WhatsApp-style pane in the main Chat section (default for Community). */
  mode?: 'float' | 'embedded';
};

/** Messaging window — float popup or embedded main-pane (WhatsApp-style). */
export function ReferenceMessagingPanel({
  kind,
  chatId,
  userId,
  onClose,
  onRefresh,
  mode = 'float',
}: Props) {
  const embedded = mode === 'embedded';
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [tick, setTick] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [acceptAnon, setAcceptAnon] = useState(false);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaKind, setMediaKind] = useState<ChatMediaKind | null>(null);
  const [recording, setRecording] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const myIdentity = getGossipIdentity(userId);
  const forcedAnon = Boolean(myIdentity?.isAnonymous);

  useEffect(() => {
    stickToBottomRef.current = true;
    setMinimized(false);
    setDraft('');
    setAnswers({});
    setMediaPreview(null);
    setMediaKind(null);
    setRecording(false);
    setAcceptAnon(forcedAnon || Boolean(myIdentity?.followAnonymously));
    if (kind === 'hryantra') {
      markHryantraVerifiedChatRead(userId);
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [chatId, kind, forcedAnon, myIdentity?.followAnonymously, userId]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1500);
    const onHry = () => setTick((n) => n + 1);
    const onSocial = () => setTick((n) => n + 1);
    window.addEventListener('saasa:hryantra-chat-updated', onHry);
    window.addEventListener('saasa:social-updated', onSocial);
    window.addEventListener('saasa:office-gossips-hydrated', onSocial);

    let softTimer: number | undefined;
    if (kind === 'dm') {
      softTimer = window.setInterval(() => {
        void softPullSocialFromServer();
      }, 12_000);
    }

    return () => {
      window.clearInterval(id);
      if (softTimer) window.clearInterval(softTimer);
      window.removeEventListener('saasa:hryantra-chat-updated', onHry);
      window.removeEventListener('saasa:social-updated', onSocial);
      window.removeEventListener('saasa:office-gossips-hydrated', onSocial);
    };
  }, [chatId, kind]);

  void tick;

  const handleThreadScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 80;
  };

  const refLive = kind === 'reference' ? getReferenceCheck(chatId) : null;
  const dmLive = kind === 'dm' ? getDmThread(chatId) : null;
  const hryLive = kind === 'hryantra' ? getHryantraVerifiedChatById(chatId) : null;

  const otherUserId =
    kind === 'reference' && refLive
      ? refLive.requesterId === userId
        ? refLive.refereeId
        : refLive.requesterId
      : dmLive
        ? dmLive.fromUserId === userId
          ? dmLive.toUserId
          : dmLive.fromUserId
        : null;

  const otherRaw =
    kind === 'hryantra'
      ? 'HRYantra'
      : kind === 'reference' && refLive
        ? getReferencePeerLabel(refLive, userId)
        : dmLive
          ? getDmPeerLabel(dmLive, userId)
          : 'Chat';
  const other = otherRaw.replace(/^@+/, '').trim() || 'Chat';
  const otherInitial = kind === 'hryantra' ? 'H' : other.slice(0, 1).toUpperCase();
  const online = kind === 'hryantra' ? true : isUserOnline(otherUserId);
  const status =
    kind === 'hryantra' ? 'verified' : kind === 'reference' ? refLive?.status : dmLive?.status;
  const subtitle =
    kind === 'hryantra'
      ? 'Official updates'
      : kind === 'reference'
        ? `${refLive?.companyName || 'Reference'} · paid`
        : `${dmLive?.companyName || 'Direct message'} · free`;
  const messages =
    kind === 'hryantra'
      ? hryLive?.messages || []
      : kind === 'reference'
        ? refLive?.messages || []
        : dmLive?.messages || [];
  const canChat =
    kind === 'hryantra' ||
    status === 'active' ||
    status === 'awaiting_answers' ||
    status === 'answered';
  const canRate =
    kind === 'reference' &&
    refLive?.status === 'answered' &&
    refLive.requesterId === userId &&
    Boolean(refLive.answers?.length) &&
    Boolean(refLive.escrowHeld);
  const iAmDmRecipient =
    kind === 'dm' && dmLive?.status === 'pending' && dmLive.toUserId === userId;
  const iAmRefRecipient =
    kind === 'reference' && refLive?.status === 'pending' && refLive.refereeId === userId;
  const iAmRefAnswerer =
    kind === 'reference' &&
    refLive?.status === 'awaiting_answers' &&
    refLive.refereeId === userId;

  useEffect(() => {
    if (minimized) return;
    if (!stickToBottomRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [messages.length, chatId, minimized]);

  if (
    (kind === 'reference' && !refLive) ||
    (kind === 'dm' && !dmLive) ||
    (kind === 'hryantra' && !hryLive)
  ) {
    return (
      <div
        className={
          embedded
            ? 'flex h-full min-h-0 flex-col items-center justify-center rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500'
            : 'fixed bottom-4 right-4 z-[80] w-[min(360px,calc(100vw-1.5rem))] rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500 shadow-2xl'
        }
      >
        Conversation not found.
        <button type="button" onClick={onClose} className="ml-2 font-semibold text-[#176F96]">
          Close
        </button>
      </div>
    );
  }

  const handleSend = () => {
    stickToBottomRef.current = true;
    const mediaOpts =
      mediaPreview && mediaKind
        ? { mediaUrl: mediaPreview, mediaType: mediaKind }
        : undefined;
    if (kind === 'hryantra') {
      const result = sendHryantraVerifiedUserMessage(userId, draft, mediaOpts);
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
    } else if (kind === 'reference') {
      const result = sendReferenceMessage(chatId, userId, draft, mediaOpts);
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
    } else {
      const result = sendDirectMessage(chatId, userId, draft, mediaOpts);
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
    }
    setDraft('');
    setMediaPreview(null);
    setMediaKind(null);
    setTick((n) => n + 1);
    onRefresh?.();
  };

  const clearMedia = () => {
    setMediaPreview(null);
    setMediaKind(null);
  };

  const pickImage = async (file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showErrorToast('Media', 'Please choose an image file.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      showErrorToast('File too large', 'Keep media under 4 MB for now.');
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      setMediaPreview(url);
      setMediaKind('image');
    } catch {
      showErrorToast('Media', 'Could not attach image.');
    }
  };

  const startVoice = async () => {
    if (recording) {
      mediaRecorderRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        try {
          const url = await fileToDataUrl(new File([blob], 'voice.webm', { type: 'audio/webm' }));
          setMediaPreview(url);
          setMediaKind('voice');
        } catch {
          showErrorToast('Voice', 'Could not save recording.');
        }
        setRecording(false);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      showErrorToast('Mic unavailable', 'Allow microphone access to record voice.');
    }
  };

  const handleDmRespond = (accept: boolean) => {
    setBusy(true);
    try {
      const result = respondDirectMessage(chatId, userId, accept, {
        anonymous: accept ? acceptAnon || forcedAnon : undefined,
      });
      if (!result.ok) {
        showErrorToast('Message', result.error);
        return;
      }
      showSuccessToast(accept ? 'Accepted' : 'Rejected');
      setTick((n) => n + 1);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const handleRefRespond = async (accept: boolean) => {
    setBusy(true);
    try {
      const result = await respondReferenceCheck(chatId, userId, accept, {
        anonymous: accept ? acceptAnon || forcedAnon : undefined,
      });
      if (!result.ok) {
        showErrorToast('Reference', result.error);
        return;
      }
      showSuccessToast(
        accept ? 'Accepted' : 'Rejected',
        accept ? 'Answer questions. You’ll be paid after they rate your response.' : undefined,
      );
      setTick((n) => n + 1);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const handleSubmitAnswers = async () => {
    if (!refLive) return;
    setBusy(true);
    try {
      const payload = refLive.questions.map((q, i) => ({
        question: q,
        answer: (answers[i] || '').trim(),
      }));
      const result = await submitReferenceAnswers(chatId, userId, payload);
      if (!result.ok) {
        showErrorToast('Answers', result.error);
        return;
      }
      showSuccessToast(
        'Submitted',
        'Answers sent. You’ll be paid after they rate your response.',
      );
      setTick((n) => n + 1);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  const handleRate = async (rating: ReferenceRating) => {
    setBusy(true);
    try {
      const result = await rateReferenceCheck(chatId, userId, rating);
      if (!result.ok) {
        showErrorToast('Rating', result.error);
        return;
      }
      showSuccessToast('Thanks', 'Feedback saved — payout sent to the reference provider.');
      setTick((n) => n + 1);
      onRefresh?.();
    } finally {
      setBusy(false);
    }
  };

  if (!embedded && minimized) {
    return (
      <button
        type="button"
        onClick={() => setMinimized(false)}
        className="fixed bottom-4 right-4 z-[80] flex w-[min(280px,calc(100vw-1.5rem))] items-center gap-2 rounded-t-xl border border-slate-700 bg-[#176F96] px-3 py-3 text-left text-white shadow-2xl"
      >
        {kind === 'hryantra' ? (
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fs.png" alt="" className="h-7 w-7 object-contain" />
          </span>
        ) : (
          <span className="relative flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-sm font-bold">
            {otherInitial}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#176F96] ${
                online ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
              title={online ? 'Online' : 'Offline'}
            />
          </span>
        )}
        <span className="flex min-w-0 flex-1 items-center gap-1 truncate text-sm font-semibold">
          {other}
          {kind === 'hryantra' ? (
            <BadgeCheck className="h-3.5 w-3.5 shrink-0 text-sky-300" aria-label="Verified" />
          ) : null}
        </span>
        {kind === 'hryantra' ? null : (
          <span className="text-[10px] uppercase text-white/60">{status}</span>
        )}
      </button>
    );
  }

  return (
    <div
      className={
        embedded
          ? 'flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[24px] bg-linear-to-br from-[#2098C8] via-[#4BB3D4] to-[#2098C8] p-[1.5px] shadow-[0_12px_30px_rgba(32,152,200,0.12),0_4px_16px_rgba(32,152,200,0.1)]'
          : 'fixed bottom-0 right-3 z-[80] flex h-[min(520px,75vh)] w-[min(400px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-t-xl border border-slate-200 border-b-0 bg-white shadow-[0_-8px_40px_rgba(15,23,42,0.2)] sm:bottom-4 sm:right-4 sm:rounded-xl sm:border-b'
      }
    >
      <div
        className={
          embedded
            ? 'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-[22.5px] bg-white'
            : 'contents'
        }
      >
      <div className="relative flex shrink-0 items-center gap-2.5 overflow-hidden border-b border-slate-100/80 bg-linear-to-r from-[#0F5A7A] via-[#176F96] to-[#2098C8] px-3 py-3 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(32,152,200,0.22),transparent_42%)]" />
        {kind === 'hryantra' ? (
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-white/90 bg-white shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/fs.png" alt="" className="h-8 w-8 object-contain" />
          </div>
        ) : (
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
            {otherInitial}
            <span
              className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full ring-2 ring-[#176F96] ${
                online ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
              title={online ? 'Online' : 'Offline'}
            />
          </div>
        )}
        <div className="relative min-w-0 flex-1">
          <p className="flex items-center gap-1.5 truncate text-[15px] font-bold tracking-tight text-white drop-shadow-sm">
            <span className="text-white">{other}</span>
            {kind === 'hryantra' ? (
              <BadgeCheck className="h-4 w-4 shrink-0 text-[#7DD3FC]" aria-label="Verified" />
            ) : null}
          </p>
          <p className="truncate text-[11px] font-medium text-white/90">
            {kind === 'hryantra' ? (
              <span>{subtitle}</span>
            ) : (
              <>
                <span className={online ? 'text-emerald-200' : 'text-rose-200'}>
                  {online ? 'Active now' : 'Offline'}
                </span>
                {' · '}
                {subtitle}
              </>
            )}
          </p>
        </div>
        {embedded ? (
          <button
            type="button"
            onClick={onClose}
            className="relative rounded-md p-1.5 text-white hover:bg-white/15 lg:hidden"
            title="Back to chats"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setMinimized(true)}
              className="relative rounded-md p-1.5 text-white hover:bg-white/15"
              title="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="relative rounded-md p-1.5 text-white hover:bg-white/15"
              title="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </>
        )}
      </div>

      <div
        ref={scrollRef}
        onScroll={handleThreadScroll}
        className="relative min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-3"
        style={{
          backgroundColor: '#DCEEF8',
          backgroundImage:
            'radial-gradient(circle at 12% 18%, rgba(32,152,200,0.14), transparent 26%), radial-gradient(circle at 88% 12%, rgba(32,152,200,0.22), transparent 28%), radial-gradient(circle at 70% 78%, rgba(32,152,200,0.1), transparent 24%), linear-gradient(180deg, #E8F5FC 0%, #E3F1F9 42%, #F0F7FB 100%)',
        }}
      >
        {messages.length === 0 ? (
          <p className="rounded-2xl bg-white/85 px-3 py-4 text-center text-xs text-slate-500 shadow-sm backdrop-blur-sm">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((m, index) => {
            const mine = m.senderId === userId;
            const isSystem =
              kind === 'hryantra' && m.senderId === HRYANTRA_SYSTEM_SENDER_ID;
            const actionUrl =
              kind === 'hryantra' && 'actionUrl' in m
                ? (m as { actionUrl?: string }).actionUrl
                : undefined;
            const hqMeta =
              kind === 'hryantra' && 'hqMeta' in m
                ? (m as { hqMeta?: Record<string, unknown> }).hqMeta
                : undefined;
            const recoverySuggestionId =
              (hqMeta?.source === 'suggestions-engine' ||
                hqMeta?.source === 'rejection-recovery') &&
              typeof hqMeta.suggestionId === 'string'
                ? hqMeta.suggestionId
                : null;
            const prev = index > 0 ? messages[index - 1] : null;
            const showDay =
              !prev || dayKey(String(prev.createdAt || '')) !== dayKey(String(m.createdAt || ''));
            const dayLabel = formatChatDayLabel(String(m.createdAt || ''));
            const timeLabel = formatChatBubbleStamp(String(m.createdAt || ''));
            return (
              <div key={m.id}>
                {showDay ? (
                  <div className="mb-2.5 flex justify-center pt-1">
                    <span className="rounded-full bg-[#176F96]/85 px-3 py-1 text-[11px] font-semibold text-white shadow-sm backdrop-blur-sm">
                      {dayLabel || 'Earlier'}
                    </span>
                  </div>
                ) : null}
                <div
                  className={`flex items-start gap-2 ${mine ? 'justify-end' : 'justify-start'}`}
                >
                  {!mine ? (
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white bg-white shadow-sm">
                      {isSystem ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src="/fs.png" alt="" className="h-6 w-6 object-contain" />
                      ) : (
                        <span className="text-[11px] font-bold text-[#2098C8]">
                          {(other || 'U').slice(0, 1).toUpperCase()}
                        </span>
                      )}
                    </div>
                  ) : null}
                  <div
                    className={`max-w-[78%] min-w-[140px] whitespace-pre-wrap px-3 py-2 text-[13px] leading-relaxed shadow-[0_4px_14px_rgba(15,23,42,0.08)] ${
                      mine
                        ? 'rounded-2xl rounded-br-md bg-linear-to-br from-[#4BB3D4] to-[#2098C8] text-white'
                        : isSystem
                          ? 'rounded-2xl rounded-tl-md border border-[#B8E0F4] bg-linear-to-br from-[#FFFFFF] via-[#F2FAFE] to-[#DFF2FB] text-slate-800'
                          : 'rounded-2xl rounded-tl-md border border-white/90 bg-white text-slate-800'
                    }`}
                  >
                    {'mediaUrl' in m &&
                    m.mediaUrl &&
                    (m as { mediaType?: string }).mediaType === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.mediaUrl}
                        alt=""
                        className="mb-1.5 max-h-52 w-full rounded-lg object-cover"
                      />
                    ) : null}
                    {'mediaUrl' in m &&
                    m.mediaUrl &&
                    (m as { mediaType?: string }).mediaType === 'voice' ? (
                      <div
                        className={`mb-1.5 flex items-center gap-2 rounded-lg px-2 py-1.5 ${
                          mine ? 'bg-white/15' : 'bg-[#EAF6FC]'
                        }`}
                      >
                        <Mic
                          className={`h-3.5 w-3.5 shrink-0 ${mine ? 'text-white/80' : 'text-slate-500'}`}
                        />
                        <audio src={m.mediaUrl} controls className="h-8 min-w-0 flex-1" />
                      </div>
                    ) : null}
                    {(() => {
                      const hasMedia = Boolean('mediaUrl' in m && m.mediaUrl);
                      const placeholder = m.text === 'Image' || m.text === 'Voice note';
                      if (!m.text || (hasMedia && placeholder)) return null;
                      return (
                        <p className={`whitespace-pre-wrap ${mine ? 'text-white' : 'text-slate-800'}`}>
                          {m.text}
                        </p>
                      );
                    })()}
                    {actionUrl ? (
                      <a
                        href={actionUrl}
                        onClick={() => {
                          if (recoverySuggestionId) {
                            recordSuggestionClick(userId, recoverySuggestionId);
                          }
                        }}
                        className={`mt-1.5 inline-flex items-center rounded-full px-2.5 py-0.5 text-[12px] font-semibold ${
                          mine
                            ? 'bg-white/20 text-white hover:bg-white/30'
                            : 'bg-[#2098C8]/12 text-[#0285C7] hover:bg-[#2098C8]/20'
                        }`}
                      >
                        Open →
                      </a>
                    ) : null}
                    {timeLabel ? (
                      <p
                        className={`mt-1.5 text-right text-[10px] leading-none ${
                          mine ? 'text-white/70' : 'text-slate-400'
                        }`}
                      >
                        {timeLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {iAmRefAnswerer && refLive ? (
        <div className="max-h-[40%] shrink-0 space-y-2 overflow-y-auto border-t border-emerald-100 bg-emerald-50/90 px-3 py-2.5">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            Answer questions · paid after their feedback
          </p>
          {refLive.questions.map((q, i) => (
            <div key={`${q}-${i}`}>
              <p className="text-[11px] font-semibold text-slate-800">{i + 1}. {q}</p>
              <WritingAssistField
                value={answers[i] || ''}
                onChange={(next) => setAnswers((prev) => ({ ...prev, [i]: next }))}
                rows={2}
                placeholder="Your answer…"
                className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[12px] outline-none focus:border-emerald-500"
              />
            </div>
          ))}
          <button
            type="button"
            disabled={busy}
            onClick={() => void handleSubmitAnswers()}
            className="inline-flex h-9 w-full items-center justify-center gap-1 rounded-full bg-emerald-600 text-xs font-semibold text-white disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Submit answers
          </button>
        </div>
      ) : null}

      {canRate ? (
        <div className="shrink-0 space-y-1.5 border-t border-slate-100 bg-white px-3 py-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Rate this response · % of fee goes to them
          </p>
          <div className="flex flex-wrap gap-1.5">
            {REFERENCE_RATING_OPTIONS.map(({ id, label, payoutPct }) => (
              <button
                key={id}
                type="button"
                disabled={busy}
                onClick={() => void handleRate(id)}
                className="rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                {label} · {payoutPct}%
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {status === 'completed' || status === 'rejected' || status === 'closed' ? (
        <p className="shrink-0 border-t border-slate-100 bg-slate-50 px-3 py-2.5 text-center text-xs font-medium text-slate-600">
          Conversation {status}
        </p>
      ) : null}

      {canChat && !iAmRefAnswerer ? (
        <div className="shrink-0 border-t border-[rgba(32,152,200,0.2)] bg-[var(--brand-primary-soft)] px-2.5 py-2">
          {mediaPreview ? (
            <div className="mb-1.5 flex items-center gap-2 rounded-[14px] border border-[rgba(32,152,200,0.22)] bg-white px-2.5 py-1.5">
              {mediaKind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaPreview} alt="" className="h-10 w-10 rounded-lg object-cover" />
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600">
                  <Mic className="h-3.5 w-3.5" />
                  Voice note ready
                </span>
              )}
              <button
                type="button"
                onClick={clearMedia}
                className="ml-auto text-[10px] font-semibold text-rose-600 hover:underline"
              >
                Remove
              </button>
            </div>
          ) : null}
          <div className="flex items-end gap-1.5 rounded-[16px] border border-[rgba(32,152,200,0.22)] bg-white px-1.5 py-1.5 shadow-sm">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] || null;
                void pickImage(f);
                e.target.value = '';
              }}
            />
            <div className="mb-0.5 flex shrink-0 items-center gap-0.5">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                title="Add image"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-[var(--brand-primary-soft)]"
              >
                <ComposeAssetIcon src="/icons/image-.png" alt="Image" size={16} />
              </button>
              <button
                type="button"
                onClick={() => void startVoice()}
                title={recording ? 'Stop recording' : 'Voice note'}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-[var(--brand-primary-soft)] ${
                  recording ? 'bg-rose-50 ring-1 ring-rose-300' : ''
                }`}
              >
                <ComposeAssetIcon src="/icons/waveform-path.png" alt="Voice" size={16} />
              </button>
            </div>
            <WritingAssistField
              inputRef={inputRef}
              value={draft}
              onChange={setDraft}
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Write a message…"
              wrapperClassName="min-w-0 flex-1"
              className="max-h-24 min-h-[36px] w-full resize-none bg-transparent px-1.5 py-2 text-[13px] leading-snug text-slate-800 outline-none placeholder:text-slate-400"
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={!draft.trim() && !mediaPreview}
              className="mb-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2098C8] shadow-[0_4px_12px_rgba(32,152,200,0.28)] transition hover:bg-[#1F8FC2] disabled:opacity-40"
              title="Send (Enter) · New line (Shift+Enter)"
            >
              <span className="brightness-0 invert">
                <ComposeAssetIcon src="/icons/send.png" alt="Send" size={15} />
              </span>
            </button>
          </div>
          {recording ? (
            <p className="mt-1 px-1 text-[10px] font-medium text-rose-600">
              Recording… tap mic to stop
            </p>
          ) : null}
        </div>
      ) : iAmRefRecipient ? (
        <div className="shrink-0 space-y-2 border-t border-amber-100 bg-amber-50/80 px-3 py-3">
          <p className="text-center text-[11px] font-medium text-slate-600">
            Reference request — accept to answer. Tokens credit after they rate your answers.
          </p>
          <label
            className={`flex items-center justify-center gap-2 text-[11px] text-slate-700 ${
              forcedAnon ? 'opacity-80' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={acceptAnon || forcedAnon}
              disabled={forcedAnon || busy}
              onChange={(e) => setAcceptAnon(e.target.checked)}
              className="rounded border-slate-300 text-[#176F96]"
            />
            Stay anonymous
            {forcedAnon ? ' (locked)' : ''}
          </label>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRefRespond(true)}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRefRespond(false)}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      ) : iAmDmRecipient ? (
        <div className="shrink-0 space-y-2 border-t border-amber-100 bg-amber-50/80 px-3 py-3">
          <p className="text-center text-[11px] font-medium text-slate-600">
            Message request — real names stay hidden until you accept
          </p>
          <label
            className={`flex items-center justify-center gap-2 text-[11px] text-slate-700 ${
              forcedAnon ? 'opacity-80' : 'cursor-pointer'
            }`}
          >
            <input
              type="checkbox"
              checked={acceptAnon || forcedAnon}
              disabled={forcedAnon || busy}
              onChange={(e) => setAcceptAnon(e.target.checked)}
              className="rounded border-slate-300 text-[#176F96]"
            />
            Stay anonymous in this chat
            {forcedAnon ? ' (locked)' : ''}
          </label>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDmRespond(true)}
              className="inline-flex h-9 items-center gap-1 rounded-full bg-emerald-600 px-4 text-xs font-semibold text-white disabled:opacity-50"
            >
              <Check className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleDmRespond(false)}
              className="inline-flex h-9 items-center gap-1 rounded-full border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 disabled:opacity-50"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      ) : status === 'pending' ? (
        <div className="shrink-0 border-t border-slate-100 bg-slate-50 px-3 py-3 text-center text-[11px] text-slate-500">
          Waiting for them to accept… Real names stay hidden until then.
        </div>
      ) : null}
      </div>
    </div>
  );
}
