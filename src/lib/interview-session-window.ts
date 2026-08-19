export function formatInterviewWhen(request: {
  scheduledAt?: string | null;
  preferredDate?: string;
  preferredTime?: string[];
  proposedSlot?: string | null;
  proposedDate?: string | null;
}) {
  const scheduled = request?.scheduledAt ? new Date(request.scheduledAt) : null;
  const hasClock =
    scheduled &&
    !Number.isNaN(scheduled.getTime()) &&
    (scheduled.getHours() !== 0 || scheduled.getMinutes() !== 0);
  if (hasClock && scheduled) {
    return {
      dateLabel: scheduled.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      timeLabel: scheduled.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }),
    };
  }

  const dateValue = request?.proposedDate || request?.preferredDate || '';
  const dateObj = dateValue ? new Date(dateValue) : null;
  const dateLabel =
    dateObj && !Number.isNaN(dateObj.getTime())
      ? dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      : String(dateValue || 'Date TBD');
  const timeLabel =
    String(request?.proposedSlot || '').trim() ||
    (Array.isArray(request?.preferredTime) ? request.preferredTime[0] : '') ||
    'Time TBD';
  return { dateLabel, timeLabel };
}

export function getInterviewSessionWindow(
  request: { scheduledAt?: string | null; duration?: number; status?: string },
  nowTs: number
) {
  const scheduledAtMs = request?.scheduledAt ? new Date(request.scheduledAt).getTime() : Number.NaN;
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
    nowTs < joinOpensAt
      ? new Date(joinOpensAt).toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          hour: 'numeric',
          minute: '2-digit',
        })
      : null;

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
