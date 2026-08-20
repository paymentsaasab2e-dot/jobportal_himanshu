const DISPLAY_TZ = 'Asia/Kolkata';

function formatIstTime(date: Date) {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DISPLAY_TZ,
  });
}

function formatIstDate(date: Date) {
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: DISPLAY_TZ,
  });
}

function formatIstDateTime(date: Date) {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: DISPLAY_TZ,
  });
}

function firstPreferredSlot(preferredTime?: string[]) {
  if (!Array.isArray(preferredTime)) return '';
  return String(preferredTime[0] || '').trim();
}

function parseSlotClock(slotValue?: string | null) {
  const raw = String(slotValue || '').trim();
  const range = /^(\d{1,2}):(\d{2})\s*-\s*\d{1,2}:\d{2}/.exec(raw);
  const single = /^(\d{1,2}):(\d{2})/.exec(raw);
  const match = range || single;
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || hour > 23 || minute > 59) return null;
  return { hour, minute };
}

function toDateKey(value?: string | null) {
  const raw = String(value || '').trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0, 10);
  const parsed = raw ? new Date(raw) : null;
  if (!parsed || Number.isNaN(parsed.getTime())) return '';
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: DISPLAY_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(parsed);
}

/** Prefer Asia/Kolkata wall-clock from preferredDate + preferredTime when available. */
function resolveScheduledAtMs(request: {
  scheduledAt?: string | null;
  preferredDate?: string | null;
  preferredTime?: string[];
  proposedSlot?: string | null;
  proposedDate?: string | null;
}) {
  const slot =
    firstPreferredSlot(request?.preferredTime) ||
    String(request?.proposedSlot || '').trim();
  const clock = parseSlotClock(slot);
  const dateKey =
    toDateKey(request?.preferredDate) ||
    toDateKey(request?.proposedDate) ||
    toDateKey(request?.scheduledAt);
  if (clock && dateKey) {
    const hour = String(clock.hour).padStart(2, '0');
    const minute = String(clock.minute).padStart(2, '0');
    const istMs = new Date(`${dateKey}T${hour}:${minute}:00+05:30`).getTime();
    if (Number.isFinite(istMs)) return istMs;
  }
  const fallback = request?.scheduledAt ? new Date(request.scheduledAt).getTime() : Number.NaN;
  return fallback;
}

export function formatInterviewWhen(request: {
  status?: string;
  scheduledAt?: string | null;
  preferredDate?: string;
  preferredTime?: string[];
  proposedSlot?: string | null;
  proposedDate?: string | null;
}) {
  const status = String(request?.status || '').toUpperCase();
  const pending = status === 'ACCEPTED' || status === 'WAITING_FOR_ACCEPTANCE';
  const proposedTime = String(request?.proposedSlot || '').trim();
  if (pending && proposedTime) {
    const dateValue = request?.proposedDate || request?.preferredDate || '';
    const dateObj = dateValue ? new Date(dateValue) : null;
    return {
      dateLabel:
        dateObj && !Number.isNaN(dateObj.getTime())
          ? formatIstDate(dateObj)
          : String(dateValue || 'Date TBD'),
      timeLabel: proposedTime,
    };
  }

  // Confirmed interviews: prefer the agreed slot string so cards match what both sides picked.
  const confirmedSlot = firstPreferredSlot(request?.preferredTime);
  const scheduled = request?.scheduledAt ? new Date(request.scheduledAt) : null;
  const hasClock =
    scheduled &&
    !Number.isNaN(scheduled.getTime()) &&
    (scheduled.getUTCHours() !== 0 ||
      scheduled.getUTCMinutes() !== 0 ||
      scheduled.getHours() !== 0 ||
      scheduled.getMinutes() !== 0);

  if (status === 'SCHEDULED' || status === 'IN_PROGRESS' || status === 'COMPLETED') {
    if (hasClock && scheduled) {
      return {
        dateLabel: formatIstDate(scheduled),
        timeLabel: confirmedSlot || formatIstTime(scheduled),
      };
    }
  }

  if (hasClock && scheduled) {
    return {
      dateLabel: formatIstDate(scheduled),
      timeLabel: confirmedSlot || formatIstTime(scheduled),
    };
  }

  const dateValue = request?.proposedDate || request?.preferredDate || '';
  const dateObj = dateValue ? new Date(dateValue) : null;
  const dateLabel =
    dateObj && !Number.isNaN(dateObj.getTime())
      ? formatIstDate(dateObj)
      : String(dateValue || 'Date TBD');
  const timeLabel =
    String(request?.proposedSlot || '').trim() ||
    confirmedSlot ||
    'Time TBD';
  return { dateLabel, timeLabel };
}

export function getInterviewSessionWindow(
  request: {
    scheduledAt?: string | null;
    duration?: number;
    status?: string;
    preferredDate?: string | null;
    preferredTime?: string[];
    proposedSlot?: string | null;
    proposedDate?: string | null;
  },
  nowTs: number
) {
  const scheduledAtMs = resolveScheduledAtMs(request);
  const status = String(request?.status || '').toUpperCase();
  if (!Number.isFinite(scheduledAtMs)) {
    return {
      canJoinNow: false,
      canComplete: status === 'COMPLETED',
      joinOpensAtLabel: null as string | null,
    };
  }

  const durationMin = Math.max(15, Number(request?.duration || 45));
  const joinOpensAt = scheduledAtMs - 15 * 60 * 1000;
  const meetingEndsAt = scheduledAtMs + durationMin * 60 * 1000;
  const joinClosesAt = scheduledAtMs + (durationMin + 30) * 60 * 1000;
  const joinableStatus = status === 'SCHEDULED' || status === 'IN_PROGRESS';

  const joinOpensAtLabel =
    nowTs < joinOpensAt ? formatIstDateTime(new Date(joinOpensAt)) : null;

  return {
    canJoinNow: joinableStatus && nowTs >= joinOpensAt && nowTs <= joinClosesAt,
    canComplete: status === 'COMPLETED' || (joinableStatus && nowTs >= meetingEndsAt),
    joinOpensAtLabel,
  };
}

export function hasCandidateReviewed(request: { candidateRating?: number | null; candidateFeedback?: string | null }) {
  if (Number(request?.candidateRating || 0) > 0) return true;
  const note = String(request?.candidateFeedback || '').trim();
  if (note.startsWith('SLOT_PROPOSAL::')) return false;
  return note.length >= 10 && !note.toLowerCase().includes('requested a new slot');
}

export function hasInterviewerReviewed(request: {
  interviewerRating?: number | null;
  interviewerFeedback?: string | null;
}) {
  if (Number(request?.interviewerRating || 0) > 0) return true;
  const note = String(request?.interviewerFeedback || '').trim();
  return note.length >= 10 && !note.startsWith('SLOT_PROPOSAL::');
}

export function displayReviewText(value: string | null | undefined) {
  const note = String(value || '').trim();
  if (!note || note.startsWith('SLOT_PROPOSAL::') || note.toLowerCase().includes('requested a new slot')) {
    return '';
  }
  return note;
}
