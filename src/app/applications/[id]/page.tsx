'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-base';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';

interface CommunicationUpdate {
  id: string;
  channel: 'email' | 'whatsapp';
  title: string;
  preview: string;
  date: string;
  time: string;
}

type InterviewDetailsPayload = {
  timelineTitle: string;
  scheduledAt: string;
  roundLabel: string | null;
  format: string | null;
  meetingLink: string | null;
  location: string | null;
  notes: string | null;
  /** Names of interviewers / panel from CRM. */
  interviewerNames?: string[];
  /** Recruiter / scheduler name. */
  recruiterName?: string | null;
};

type InterviewRoundPayload = InterviewDetailsPayload & { timelineId?: string };

interface ApplicationDetail {
  id: string;
  candidateId?: string;
  jobId?: string;
  status: string;
  /** Raw portal `ApplicationStatus` (e.g. SELECTED, INTERVIEW) — use for pipeline logic when `status` is a display label. */
  statusCode?: string;
  pipelineStage?: string | null;
  pipelineStages?: string[];
  appliedAt: string;
  updatedAt?: string;
  emailUpdates: boolean;
  whatsappUpdates: boolean;
  offerDetails: string | null;
  /** Absolute URL to the signed offer letter PDF (mirrored from CRM placement / client-review uploads). */
  offerLetterUrl?: string | null;
  offerLetterFileName?: string | null;
  offerLetterUploadedAt?: string | null;
  interviewDetails?: InterviewDetailsPayload | null;
  /** All CRM-scheduled interview rounds for this application (chronological). */
  interviewRounds?: InterviewRoundPayload[];
  job: {
    id: string;
    title: string;
    company: string;
    location: string;
    workMode: string;
    experience: string;
    employmentType: string;
    salary: string;
  };
  timeline: Array<{
    id: string;
    status: string;
    title: string;
    description: string | null;
    occurredAt: string;
  }>;
  communications: Array<{
    id: string;
    channel: string;
    subject: string | null;
    message: string;
    sentAt: string;
  }>;
}

function getStatusColor(status: string) {
  const value = (status || '').toLowerCase();
  if (value.includes('selected')) return 'text-green-600';
  if (value.includes('shortlisted')) return 'text-purple-600';
  if (value.includes('review')) return 'text-blue-600';
  if (value.includes('rejected')) return 'text-red-600';
  return 'text-gray-600';
}

function getStatusMessage(status: string) {
  const value = (status || '').toLowerCase();
  if (value.includes('selected')) return 'Congratulations! Offer inbound';
  if (value.includes('shortlisted')) return 'Great progress! Interview stage';
  if (value.includes('interview')) return 'Use Interview details for time, format, and meeting link.';
  if (value.includes('review')) return 'Your application is being reviewed';
  if (value.includes('rejected')) return 'Application not selected';
  return 'Application submitted';
}

/** Prefer raw portal enum from API so the hero card never shows a stale recruiter match label (e.g. Under Review). */
const PORTAL_STAGE_CARD: Record<
  string,
  { title: string; message: string; colorClass: string }
> = {
  SUBMITTED: {
    title: 'Submitted',
    message: 'Your application has been received.',
    colorClass: 'text-gray-600',
  },
  UNDER_REVIEW: {
    title: 'Under Review',
    message: 'Your application is being reviewed by the hiring team.',
    colorClass: 'text-blue-600',
  },
  SHORTLISTED: {
    title: 'Shortlisted',
    message: 'You are on the shortlist for this role.',
    colorClass: 'text-purple-600',
  },
  ASSESSMENT: {
    title: 'Assessment',
    message: 'This stage may include tests or tasks from the employer.',
    colorClass: 'text-amber-700',
  },
  INTERVIEW: {
    title: 'Interview',
    message: 'Use Interview details for time, format, and meeting link.',
    colorClass: 'text-sky-700',
  },
  FINAL_DECISION: {
    title: 'Final decision',
    message: 'A hiring decision is being finalized for this role.',
    colorClass: 'text-violet-700',
  },
  SELECTED: {
    title: 'Selected',
    message: 'Congratulations! You have been selected for this role.',
    colorClass: 'text-green-600',
  },
  REJECTED: {
    title: 'Not selected',
    message: 'This application was not selected to move forward.',
    colorClass: 'text-red-600',
  },
};

function statusCodeAuthoritativeForDisplay(code: string | undefined | null) {
  const u = String(code || '').trim().toUpperCase();
  return ['INTERVIEW', 'FINAL_DECISION', 'SELECTED', 'REJECTED', 'SHORTLISTED', 'ASSESSMENT'].includes(u);
}

function formatDateTime(value: string | Date) {
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  };
}

function normalizeStage(value: string) {
  return String(value || '')
    .toLowerCase()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Hired / offer-accepted style outcomes (portal enums + common labels). */
function isTerminalSuccessStage(value: string) {
  const n = normalizeStage(value);
  const u = String(value || '').trim().toUpperCase();
  if (['SELECTED', 'FINAL_DECISION'].includes(u)) return true;
  return (
    n.includes('selected') ||
    n.includes('placed') ||
    n.includes('hired') ||
    n.includes('offer accepted') ||
    n === 'final decision'
  );
}

function isRejectedApplicationStatus(value: string, statusCode?: string | null) {
  const n = normalizeStage(value);
  const code = String(statusCode || '').toUpperCase();
  return n.includes('reject') || code === 'REJECTED';
}

function hasInterviewEvidence(application: ApplicationDetail): boolean {
  if (application.interviewDetails) return true;
  const rows = application.timeline || [];
  return rows.some((row) => isInterviewTimelineRow(row));
}

/**
 * Job pipeline names may not include "Interview" even after CRM scheduled one and later moved to SELECTED.
 * Insert a synthetic **Interview** step before the terminal success stage so pills read Applied → Interview → Selected.
 */
function enrichPipelineStagesWithInterview(
  sequence: string[],
  application: ApplicationDetail
): string[] {
  if (!sequence.length) return sequence;
  if (isRejectedApplicationStatus(application.status, application.statusCode)) return sequence;

  const code = String(application.statusCode || '').trim().toUpperCase();
  const reachedSuccess =
    isTerminalSuccessStage(application.status) ||
    isTerminalSuccessStage(application.pipelineStage || '') ||
    isTerminalSuccessStage(code);

  if (!reachedSuccess) return sequence;
  if (!hasInterviewEvidence(application)) return sequence;

  const normalizedNames = sequence.map((s) => normalizeStage(s));
  if (normalizedNames.some((n) => n.includes('interview'))) return sequence;

  const out = [...sequence];
  let terminalIdx = -1;
  for (let i = out.length - 1; i >= 0; i--) {
    if (isTerminalSuccessStage(out[i])) {
      terminalIdx = i;
      break;
    }
  }
  if (terminalIdx < 0) {
    terminalIdx = out.length - 1;
  }
  if (terminalIdx <= 0) {
    terminalIdx = Math.min(1, out.length);
  }
  out.splice(terminalIdx, 0, 'Interview');
  return out;
}

function parseInterviewDescriptionClient(description: string | null | undefined) {
  if (!description || typeof description !== 'string') {
    return {
      roundLabel: null as string | null,
      typeFromLine: null as string | null,
      format: null as string | null,
      meetingLink: null as string | null,
      location: null as string | null,
      interviewerNames: [] as string[],
      recruiterName: null as string | null,
    };
  }
  const roundMatch = description.match(/Recruiter scheduled\s+([^.]+)\./i);
  const typeLineMatch = description.match(/^\s*type\s*:\s*(.+)$/im);
  const formatMatch = description.match(/Format:\s*([^.]+)\./i);
  const linkMatch = description.match(/Meeting link:\s*(https?:\/\/\S+)/i);
  const locationMatch = description.match(/Location:\s*(.+?)(?:\.(?:\s|$)|$)/im);
  const interviewerLineMatch = description.match(/^\s*interviewer(?:s)?\s*:\s*(.+)$/im);
  const recruiterLineMatch = description.match(/^\s*recruiter\s*:\s*(.+)$/im);
  return {
    roundLabel: roundMatch ? roundMatch[1].trim() : null,
    typeFromLine: typeLineMatch ? typeLineMatch[1].trim() : null,
    format: formatMatch ? formatMatch[1].trim() : null,
    meetingLink: linkMatch ? linkMatch[1] : null,
    location: locationMatch ? locationMatch[1].trim() : null,
    interviewerNames: interviewerLineMatch
      ? interviewerLineMatch[1]
          .split(/[,;|]/)
          .map((n) => n.trim())
          .filter(Boolean)
      : [],
    recruiterName: recruiterLineMatch ? recruiterLineMatch[1].trim() || null : null,
  };
}

function buildInterviewDetailsFromTimelineRow(
  row: ApplicationDetail['timeline'][number]
): InterviewDetailsPayload {
  const parsed = parseInterviewDescriptionClient(row.description);
  const at = new Date(row.occurredAt);
  const titleTrim = String(row.title || '').trim();
  const titleIsGeneric = /^interview$/i.test(titleTrim);
  return {
    timelineTitle: row.title || 'Interview',
    scheduledAt: Number.isNaN(at.getTime()) ? row.occurredAt : at.toISOString(),
    roundLabel: parsed.roundLabel || parsed.typeFromLine || (!titleIsGeneric ? titleTrim : null),
    format: parsed.format,
    meetingLink: parsed.meetingLink,
    location: parsed.location,
    notes: row.description || null,
    interviewerNames: parsed.interviewerNames,
    recruiterName: parsed.recruiterName,
  };
}

function isInterviewTimelineRow(row: { status: string; title: string }) {
  const blob = `${row.status} ${row.title}`.toLowerCase();
  return blob.includes('interview');
}

/** Pipeline pill names that represent an interview step (CRM may use "Interview", "Interviewing", etc.). */
function isInterviewPipelineStageName(stage: string) {
  const n = normalizeStage(stage);
  return n.includes('interview') || n === 'interviewing';
}

/** 0-based count: which interview-style step this pill is (first Interview pill → 0, second → 1). */
function interviewPipelineStepIndex(flow: string[], pillIndex: number): number {
  let k = 0;
  for (let i = 0; i <= pillIndex; i++) {
    if (!isInterviewPipelineStageName(flow[i])) continue;
    if (i === pillIndex) return k;
    k += 1;
  }
  return 0;
}

const INTERVIEW_KIND_DISPLAY: Record<string, string> = {
  PHONE: 'Phone screening',
  VIDEO: 'Video interview',
  IN_PERSON: 'In-person interview',
  TECHNICAL_TEST: 'Technical test',
  ASSESSMENT: 'Assessment',
  GROUP_DISCUSSION: 'Group discussion',
  ONSITE: 'On-site interview',
  TECHNICAL: 'Technical round',
  FINAL: 'Final interview',
  SCREENING: 'HR screening',
  HR_SCREENING: 'HR screening',
};

function humanizeInterviewKind(raw: string): string {
  const s = raw.trim().replace(/\s+/g, ' ');
  if (!s) return s;
  const upper = s.replace(/[\s-]+/g, '_').toUpperCase();
  if (INTERVIEW_KIND_DISPLAY[upper]) return INTERVIEW_KIND_DISPLAY[upper];
  const collapsed = upper.replace(/_/g, '');
  const hit = Object.keys(INTERVIEW_KIND_DISPLAY).find((k) => k.replace(/_/g, '') === collapsed);
  if (hit) return INTERVIEW_KIND_DISPLAY[hit];
  const token = upper.replace(/^TYPE_?/i, '');
  if (/^[A-Z][A-Z0-9_]+$/.test(token))
    return token
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  return s;
}

/** True if label is useless for "what kind of interview" (avoid "— Type (Interview)"). */
function isGenericInterviewTypeLabel(label: string): boolean {
  const n = normalizeStage(label);
  if (!n) return true;
  if (n === 'interview' || n === 'interviewing') return true;
  if (/^interview\s*progress\b/.test(n)) return true;
  /** e.g. "Round 3" alone (no context); keep "Round 2 of 4" when no type exists */
  if (/^round\s+\d+$/i.test(label.trim())) return true;
  return false;
}

function resolveInterviewTypeLabel(round: InterviewRoundPayload | null | undefined): string | null {
  if (!round) return null;
  const fromNotes = round.notes ? parseInterviewDescriptionClient(round.notes).typeFromLine : null;
  const candidates = [
    round.roundLabel?.trim(),
    fromNotes,
    round.format?.trim(),
    round.timelineTitle?.trim(),
  ].filter(Boolean) as string[];

  for (const c of candidates) {
    const human = humanizeInterviewKind(c);
    const pick = human || c;
    if (!isGenericInterviewTypeLabel(pick)) return pick;
  }
  return null;
}

/**
 * e.g. `Interviewing — HR screening`, `Interview — Technical round` (matches portal / CRM type labels).
 */
function formatPipelineStagePillLabel(
  stage: string,
  pillIndex: number,
  flow: string[],
  rounds: InterviewRoundPayload[]
): string {
  if (!isInterviewPipelineStageName(stage)) return stage;
  const stepIdx = interviewPipelineStepIndex(flow, pillIndex);
  const round = rounds[stepIdx] ?? rounds[rounds.length - 1];
  const typeLabel = resolveInterviewTypeLabel(round ?? null);
  if (!typeLabel) return stage;
  return `${stage} — ${typeLabel}`;
}

function isRejectedTimelineRow(row: { status: string; title: string }) {
  const blob = `${row.status} ${row.title}`.toLowerCase();
  return blob.includes('reject');
}

type RejectionModalPayload = {
  title: string;
  occurredAt: string;
  feedback: string;
};

function buildRejectionPayloadFromRow(row: ApplicationDetail['timeline'][number]): RejectionModalPayload {
  return {
    title: row.title || 'Application update',
    occurredAt: row.occurredAt,
    feedback:
      String(row.description || '').trim() ||
      'No written feedback was provided for this decision.',
  };
}

export default function ApplicationStatusPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const applicationId = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);
  const [interviewModalOpen, setInterviewModalOpen] = useState(false);
  const [interviewModalPayload, setInterviewModalPayload] = useState<InterviewDetailsPayload | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionModalPayload, setRejectionModalPayload] = useState<RejectionModalPayload | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id =
      sessionStorage.getItem('candidateId')?.trim() ||
      localStorage.getItem('candidateId')?.trim() ||
      null;
    setCandidateId(id);
  }, []);

  useEffect(() => {
    async function loadApplicationDetail() {
      if (!applicationId) return;
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE_URL}/applications/detail/${encodeURIComponent(applicationId)}`);
        const result = await response.json();

        if (!response.ok || !result?.success || !result?.data) {
          throw new Error(result?.message || 'Failed to load application details');
        }

        setApplication(result.data as ApplicationDetail);
      } catch (err: any) {
        setError(err?.message || 'Failed to load application details');
      } finally {
        setLoading(false);
      }
    }

    loadApplicationDetail();
  }, [applicationId]);

  const filteredTimelineRows = useMemo(() => {
    if (!application?.timeline?.length) return [] as ApplicationDetail['timeline'];
    const sorted = [...application.timeline].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );
    return sorted.filter((row) => {
      const st = String(row.status || '').toLowerCase();
      const ti = String(row.title || '').toLowerCase();
      if (st.includes('submit') && (ti.includes('application submitted') || ti === 'submitted' || ti.includes('successfully submitted')))
        return false;
      return true;
    });
  }, [application]);

  /** Stack of interview rounds (API or derived from timeline). Chronological: round 1 → round 2. */
  const interviewRoundsStack = useMemo((): InterviewRoundPayload[] => {
    if (!application) return [];
    if (Array.isArray(application.interviewRounds) && application.interviewRounds.length > 0) {
      return application.interviewRounds;
    }
    const rows = [...(application.timeline || [])].sort(
      (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
    );
    return rows
      .filter((row) => isInterviewTimelineRow(row))
      .map((row) => ({
        timelineId: row.id,
        ...buildInterviewDetailsFromTimelineRow(row),
      }));
  }, [application]);

  /** Avoid duplicate copy: interview rounds are shown in the stacked section above. */
  const timelineRowsForDisplay = useMemo(() => {
    if (!interviewRoundsStack.length) return filteredTimelineRows;
    return filteredTimelineRows.filter((row) => !isInterviewTimelineRow(row));
  }, [filteredTimelineRows, interviewRoundsStack]);

  const emailUpdates = useMemo<CommunicationUpdate[]>(() => {
    if (!application) return [];
    return (application.communications || [])
      .filter((item) => String(item.channel || '').toLowerCase() === 'email')
      .map((item) => {
        const { date, time } = formatDateTime(item.sentAt);
        return {
          id: item.id,
          channel: 'email',
          title: item.subject || 'Email Update',
          preview: item.message || 'Status update sent via email.',
          date,
          time,
        };
      });
  }, [application]);

  const whatsappUpdates = useMemo<CommunicationUpdate[]>(() => {
    if (!application) return [];
    return (application.communications || [])
      .filter((item) => String(item.channel || '').toLowerCase() === 'whatsapp')
      .map((item) => {
        const { date, time } = formatDateTime(item.sentAt);
        return {
          id: item.id,
          channel: 'whatsapp',
          title: item.subject || 'WhatsApp Update',
          preview: item.message || 'Status update sent via WhatsApp.',
          date,
          time,
        };
      });
  }, [application]);

  const defaultAppliedAt = application?.appliedAt ? formatDateTime(application.appliedAt).date : '';
  const pipelineStageFlow = useMemo(() => {
    if (!application) return [] as string[];
    const base = Array.isArray(application.pipelineStages) ? application.pipelineStages : [];
    const sequence = base.filter((stage) => String(stage || '').trim().length > 0);
    const normalized = new Set(sequence.map((s) => normalizeStage(s)).filter(Boolean));
    if (!normalized.has('applied')) {
      sequence.unshift('Applied');
      normalized.add('applied');
    }
    const preferAppForCurrent = statusCodeAuthoritativeForDisplay(application.statusCode);
    const currentStage = String(
      preferAppForCurrent
        ? application.status || application.pipelineStage || ''
        : application.pipelineStage || application.status || ''
    ).trim();
    const normalizedCurrent = normalizeStage(currentStage);
    if (currentStage && normalizedCurrent && !normalized.has(normalizedCurrent)) {
      sequence.push(currentStage);
    }
    return enrichPipelineStagesWithInterview(sequence, application);
  }, [application]);
  const currentPipelineIndex = useMemo(() => {
    if (!application || pipelineStageFlow.length === 0) return -1;
    const preferApp = statusCodeAuthoritativeForDisplay(application.statusCode);
    const raw = preferApp
      ? String(application.status || application.pipelineStage || '').trim()
      : String(application.pipelineStage || application.status || '').trim();
    let current = normalizeStage(raw);
    if (!current) return -1;
    let idx = pipelineStageFlow.findIndex((stage) => normalizeStage(stage) === current);
    if (idx < 0) {
      const code = String(application.statusCode || '').trim().toUpperCase();
      const card = code ? PORTAL_STAGE_CARD[code] : null;
      if (card?.title) {
        current = normalizeStage(card.title);
        idx = pipelineStageFlow.findIndex((stage) => normalizeStage(stage) === current);
      }
    }
    return idx;
  }, [application, pipelineStageFlow]);
  const stageProgressCards = useMemo(() => {
    if (!application || pipelineStageFlow.length === 0 || currentPipelineIndex < 0) return [] as string[];
    return pipelineStageFlow.filter((stage, index) => {
      const normalized = normalizeStage(stage);
      return index <= currentPipelineIndex && normalized && normalized !== 'applied';
    });
  }, [application, pipelineStageFlow, currentPipelineIndex]);
  const stageUpdatedAt = application?.updatedAt ? formatDateTime(application.updatedAt) : null;

  const effectiveInterviewDetails = useMemo((): InterviewDetailsPayload | null => {
    if (!application) return null;
    if (application.interviewDetails) return application.interviewDetails;
    const rows = application.timeline || [];
    const interviewRow = [...rows]
      .filter((t) => {
        const st = String(t.status || '').toLowerCase();
        const title = String(t.title || '').toLowerCase();
        return st.includes('interview') || title.includes('interview');
      })
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];
    if (!interviewRow) return null;
    const parsed = parseInterviewDescriptionClient(interviewRow.description);
    const at = new Date(interviewRow.occurredAt);
    return {
      timelineTitle: interviewRow.title || 'Interview',
      scheduledAt: Number.isNaN(at.getTime()) ? interviewRow.occurredAt : at.toISOString(),
      roundLabel: parsed.roundLabel,
      format: parsed.format,
      meetingLink: parsed.meetingLink,
      location: parsed.location,
      notes: interviewRow.description || null,
    };
  }, [application]);

  const showInterviewDetailsButton = Boolean(effectiveInterviewDetails);

  const stagePresentation = useMemo(() => {
    if (!application) {
      return { title: '', message: '', colorClass: 'text-gray-600' };
    }
    const code = String(application.statusCode || '').trim().toUpperCase();
    if (code && PORTAL_STAGE_CARD[code]) {
      return PORTAL_STAGE_CARD[code];
    }
    const status = application.status || '';
    const looksEarly =
      /\b(?:under review|submitted|applied)\b/i.test(status) ||
      normalizeStage(status) === 'submitted' ||
      normalizeStage(status).includes('review');
    if (showInterviewDetailsButton && looksEarly) {
      return PORTAL_STAGE_CARD.INTERVIEW;
    }
    return {
      title: status,
      message: getStatusMessage(status),
      colorClass: getStatusColor(status),
    };
  }, [application, showInterviewDetailsButton]);

  const currentPipelineStageLabel = useMemo(() => {
    if (!application) return '';
    const base = stagePresentation.title;
    const code = String(application.statusCode || '').trim().toUpperCase();
    const inInterview =
      code === 'INTERVIEW' ||
      normalizeStage(base).includes('interview') ||
      normalizeStage(application.pipelineStage || '').includes('interview') ||
      normalizeStage(application.status || '').includes('interview');
    if (!inInterview || interviewRoundsStack.length === 0) return base;
    const activeRound =
      interviewRoundsStack[interviewRoundsStack.length - 1] ?? interviewRoundsStack[0];
    const typeLabel = resolveInterviewTypeLabel(activeRound);
    if (!typeLabel) return base;
    return `${base} — ${typeLabel}`;
  }, [application, stagePresentation, interviewRoundsStack]);

  useEffect(() => {
    if (!interviewModalOpen && !rejectionModalOpen && !withdrawConfirmOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setInterviewModalOpen(false);
      setInterviewModalPayload(null);
      setRejectionModalOpen(false);
      setRejectionModalPayload(null);
      setWithdrawConfirmOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interviewModalOpen, rejectionModalOpen, withdrawConfirmOpen]);

  const closeInterviewModal = () => {
    setInterviewModalOpen(false);
    setInterviewModalPayload(null);
  };

  const closeRejectionModal = () => {
    setRejectionModalOpen(false);
    setRejectionModalPayload(null);
  };

  const closeWithdrawConfirm = () => {
    if (withdrawing) return;
    setWithdrawConfirmOpen(false);
  };

  const confirmWithdrawApplication = async () => {
    if (!application || !candidateId) {
      return;
    }
    if (application.candidateId && application.candidateId !== candidateId) {
      return;
    }

    setWithdrawing(true);
    try {
      const qs = new URLSearchParams({ candidateId });
      const response = await fetch(
        `${API_BASE_URL}/applications/detail/${encodeURIComponent(applicationId)}?${qs.toString()}`,
        { method: 'DELETE' }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(typeof result?.message === 'string' ? result.message : 'Could not withdraw application');
      }
      setWithdrawConfirmOpen(false);
      showSuccessToast('Application withdrawn', 'You can apply again from Explore Jobs.');
      router.push('/explore-jobs');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not withdraw application';
      showErrorToast('Could not withdraw', msg);
    } finally {
      setWithdrawing(false);
    }
  };

  const canWithdraw =
    Boolean(application && candidateId && !withdrawing) &&
    (!application.candidateId || application.candidateId === candidateId);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(135deg, #e0f2fe 0%, #ecf7fd 12%, #fafbfb 30%, #fdf6f0 55%, #fef5ed 85%, #fef5ed 100%)',
      }}
    >

      <main className="mx-auto max-w-[1320px] px-6 lg:px-8 pb-6 sm:pb-8 lg:py-10 pt-2 sm:pt-4 lg:pt-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 text-sm font-medium"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Applications
        </button>

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white p-6 text-sm text-gray-600">Loading application details...</div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">{error}</div>
        ) : application ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2 tracking-tight">{application.job.title}</h1>
                <div className="flex items-center gap-4 text-gray-600 mb-4">
                  <span className="font-medium text-gray-700">{application.job.company}</span>
                  <span>•</span>
                  <span>{application.job.location}</span>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={`text-lg font-semibold ${stagePresentation.colorClass} mb-1`}>{stagePresentation.title}</p>
                    <p className="text-sm text-gray-600">{stagePresentation.message}</p>
                  </div>
                  {showInterviewDetailsButton && effectiveInterviewDetails && interviewRoundsStack.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/interviews/${encodeURIComponent(applicationId)}`)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-[#28A8E1] bg-[#28A8E1] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:opacity-95"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <path d="M3 10h18" />
                        <path d="M8 2v4M16 2v4" />
                      </svg>
                      Interview details
                    </button>
                  ) : interviewRoundsStack.length > 0 ? (
                    <p className="text-sm text-gray-600 shrink-0 max-w-xs text-right">
                      {interviewRoundsStack.length === 1
                        ? 'Interview details are in the section below.'
                        : `${interviewRoundsStack.length} interview rounds — open each card below for links and times.`}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Stage</h2>
                {pipelineStageFlow.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Current stage:{' '}
                      <span className="font-semibold text-gray-900">{currentPipelineStageLabel}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {pipelineStageFlow.map((stage, index) => {
                        const pillLabel = formatPipelineStagePillLabel(
                          stage,
                          index,
                          pipelineStageFlow,
                          interviewRoundsStack
                        );
                        const isCompleted = currentPipelineIndex >= 0 && index <= currentPipelineIndex;
                        const isCurrent = currentPipelineIndex === index;
                        return (
                          <div key={`${stage}-${index}`} className="flex items-center gap-2">
                            <span
                              className={`rounded-2xl border px-3 py-2 text-xs font-semibold text-left whitespace-normal leading-snug max-w-[min(100%,18rem)] sm:max-w-88 ${
                                isCurrent
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : isCompleted
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-50 text-gray-500 border-gray-200'
                              }`}
                              title={pillLabel}
                            >
                              {pillLabel}
                            </span>
                            {index < pipelineStageFlow.length - 1 ? (
                              <span className="text-gray-300 text-xs">→</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Pipeline stages are not available yet.</p>
                )}
              </div>

              {interviewRoundsStack.length > 0 ? (
                <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-1">Scheduled interviews</h2>
                  <p className="text-sm text-gray-600 mb-4">
                    Each round is listed in order (latest scheduling at the bottom). Open a card for meeting link, time,
                    and format.
                  </p>
                  <div className="flex flex-col gap-3">
                    {interviewRoundsStack.map((round, index) => {
                      const when = formatDateTime(round.scheduledAt);
                      const headline =
                        round.roundLabel?.trim() ||
                        round.timelineTitle?.trim() ||
                        `Interview — Round ${index + 1}`;
                      const sub =
                        round.roundLabel?.trim() && round.timelineTitle?.trim() && round.roundLabel !== round.timelineTitle
                          ? round.timelineTitle
                          : null;
                      return (
                        <div
                          key={round.timelineId || `round-${index}-${round.scheduledAt}`}
                          className="rounded-xl border border-emerald-200/90 bg-linear-to-br from-emerald-50 to-white p-4 shadow-sm flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                              Round {index + 1}
                              {interviewRoundsStack.length > 1 ? ` of ${interviewRoundsStack.length}` : ''}
                            </p>
                            <h3 className="text-base font-semibold text-gray-900 mt-0.5">{headline}</h3>
                            {sub ? <p className="text-sm text-gray-600 mt-0.5">{sub}</p> : null}
                            <p className="text-sm text-gray-700 mt-2">
                              {when.date} · {when.time}
                            </p>
                            {round.format ? (
                              <p className="text-sm text-gray-600 mt-1">Format: {round.format}</p>
                            ) : null}
                            {Array.isArray(round.interviewerNames) && round.interviewerNames.length > 0 ? (
                              <p className="text-sm text-gray-600 mt-1">
                                Interviewer{round.interviewerNames.length > 1 ? 's' : ''}: {round.interviewerNames.join(', ')}
                              </p>
                            ) : null}
                            {round.recruiterName ? (
                              <p className="text-sm text-gray-600 mt-1">Recruiter: {round.recruiterName}</p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => router.push(`/interviews/${encodeURIComponent(applicationId)}`)}
                            className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-600/40 bg-white px-4 py-2.5 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-50"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                              <rect width="18" height="18" x="3" y="4" rx="2" />
                              <path d="M3 10h18" />
                              <path d="M8 2v4M16 2v4" />
                            </svg>
                            Interview details
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {application.offerLetterUrl ? (
                <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">Offer Letter</h2>
                      <p className="mt-1 text-sm text-gray-600">
                        Congratulations — your offer letter has been shared by the recruiter. Open it to review the
                        details, or save a copy for your records.
                      </p>
                      {application.offerLetterUploadedAt
                        ? (() => {
                            const d = new Date(application.offerLetterUploadedAt);
                            if (Number.isNaN(d.getTime())) return null;
                            const { date, time } = formatDateTime(d);
                            return (
                              <p className="mt-1 text-xs text-gray-500">
                                Received {date} at {time}
                              </p>
                            );
                          })()
                        : null}
                    </div>
                  </div>

                  <div className="mt-4 rounded-xl border border-emerald-100 bg-emerald-50/70 p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M9 13h6M9 17h6" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">
                          {application.offerLetterFileName || 'Offer letter.pdf'}
                        </p>
                        <p className="text-xs text-gray-500">PDF document</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <a
                        href={application.offerLetterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700/30 bg-white px-3 py-2 text-sm font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        View
                      </a>
                      <a
                        href={application.offerLetterUrl}
                        download={application.offerLetterFileName || 'offer-letter.pdf'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        Download
                      </a>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Application Timeline</h2>
                <div className="space-y-4">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
                    <h3 className="text-base font-semibold text-gray-900">Application Submitted</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {application.appliedAt ? `${formatDateTime(application.appliedAt).date}, ${formatDateTime(application.appliedAt).time}` : '-'}
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Your application has been successfully submitted
                    </p>
                  </div>

                  {timelineRowsForDisplay.map((row) => {
                    const rejectedRow = isRejectedTimelineRow(row);
                    const interviewRow = !rejectedRow && isInterviewTimelineRow(row);
                    const { date, time } = formatDateTime(row.occurredAt);
                    const cardBorder = rejectedRow
                      ? 'border-rose-200 bg-rose-50/90'
                      : interviewRow
                        ? 'border-emerald-200 bg-emerald-50/90'
                        : 'border-gray-200 bg-gray-50';
                    return (
                      <div key={row.id} className={`rounded-xl border p-4 ${cardBorder}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="text-base font-semibold text-gray-900">{row.title || row.status}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                              {date}, {time}
                            </p>
                            {row.description ? (
                              <p className="text-sm text-gray-700 mt-2 line-clamp-4">{row.description}</p>
                            ) : (
                              <p className="text-sm text-gray-600 mt-2 italic">No additional notes for this step.</p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2 sm:pt-0.5">
                            {interviewRow ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/interviews/${encodeURIComponent(applicationId)}`)}
                                className="rounded-lg border border-emerald-600/30 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                              >
                                Interview details
                              </button>
                            ) : null}
                            {rejectedRow ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectionModalPayload(buildRejectionPayloadFromRow(row));
                                  setRejectionModalOpen(true);
                                }}
                                className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-xs font-semibold text-rose-900 shadow-sm hover:bg-rose-50"
                              >
                                View feedback
                              </button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {timelineRowsForDisplay.length === 0
                    ? stageProgressCards.map((stage, index) => {
                        const isCurrent = index === stageProgressCards.length - 1;
                        const stageIsInterview =
                          normalizeStage(stage) === 'interview' && Boolean(effectiveInterviewDetails);
                        return (
                          <div
                            key={`${stage}-${index}`}
                            className={`rounded-xl border p-4 ${
                              isCurrent ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="text-base font-semibold text-gray-900">{stage}</h3>
                                <p className="text-sm text-gray-500 mt-1">
                                  {stageUpdatedAt ? `${stageUpdatedAt.date}, ${stageUpdatedAt.time}` : '-'}
                                </p>
                                <p className="text-sm text-gray-700 mt-2">
                                  {isCurrent
                                    ? `You are currently in the ${stage} stage.`
                                    : `Your application moved to ${stage}.`}
                                </p>
                              </div>
                              {stageIsInterview ? (
                                <button
                                  type="button"
                                  onClick={() => router.push(`/interviews/${encodeURIComponent(applicationId)}`)}
                                  className="shrink-0 rounded-lg border border-emerald-600/30 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-50"
                                >
                                  Interview details
                                </button>
                              ) : null}
                            </div>
                          </div>
                        );
                      })
                    : null}

                  {timelineRowsForDisplay.length === 0 && stageProgressCards.length === 0 ? (
                    <p className="text-sm text-gray-500">No timeline events available yet.</p>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Job Snapshot</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Job Title</p>
                    <p className="text-sm font-medium text-gray-900">{application.job.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Work Mode</p>
                    <p className="text-sm font-medium text-gray-900">{application.job.workMode}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Experience</p>
                    <p className="text-sm font-medium text-gray-900">{application.job.experience}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Employment</p>
                    <p className="text-sm font-medium text-gray-900">{application.job.employmentType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Salary</p>
                    <p className="text-sm font-medium text-gray-900">{application.job.salary}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-1">Applied On</p>
                    <p className="text-sm font-medium text-gray-900">{defaultAppliedAt}</p>
                  </div>
                </div>

                {canWithdraw ? (
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-3">
                      Change your mind? Withdrawing removes this role from My Applications. You can apply again from Explore Jobs.
                    </p>
                    <button
                      type="button"
                      onClick={() => setWithdrawConfirmOpen(true)}
                      disabled={withdrawing}
                      className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-sm font-semibold text-rose-800 shadow-sm transition hover:bg-rose-100 disabled:opacity-60"
                    >
                      Withdraw application
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Communication Updates</h3>

                <div className="mb-4 flex items-center gap-4 text-sm">
                  <span className={`font-medium ${application.emailUpdates ? 'text-emerald-700' : 'text-gray-500'}`}>Email Updates</span>
                  <span className={`font-medium ${application.whatsappUpdates ? 'text-emerald-700' : 'text-gray-500'}`}>WhatsApp Updates</span>
                </div>

                <div className="space-y-4">
                  {(emailUpdates.length || whatsappUpdates.length) ? (
                    [...emailUpdates, ...whatsappUpdates].map((item) => (
                      <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="mb-1 flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{item.title}</p>
                          <span className="text-xs uppercase tracking-wide text-gray-500">{item.channel}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-1">
                          {item.date}, {item.time}
                        </p>
                        <p className="text-sm text-gray-700 line-clamp-3">{item.preview}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-gray-500">No communication updates yet.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </main>

      {interviewModalOpen && interviewModalPayload ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="interview-details-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={closeInterviewModal}
          />
          <div className="relative z-101 w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="interview-details-title" className="text-xl font-semibold text-gray-900">
                  {interviewModalPayload.timelineTitle}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {application?.job.title} · {application?.job.company}
                </p>
              </div>
              <button
                type="button"
                onClick={closeInterviewModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>

            <dl className="space-y-4 text-sm">
              <div>
                <dt className="font-medium text-gray-500">Scheduled</dt>
                <dd className="mt-1 text-gray-900">
                  {(() => {
                    const d = new Date(interviewModalPayload.scheduledAt);
                    if (Number.isNaN(d.getTime())) return '—';
                    const { date, time } = formatDateTime(d);
                    return `${date} · ${time}`;
                  })()}
                </dd>
              </div>
              {interviewModalPayload.roundLabel ? (
                <div>
                  <dt className="font-medium text-gray-500">Round / type</dt>
                  <dd className="mt-1 text-gray-900">{interviewModalPayload.roundLabel}</dd>
                </div>
              ) : null}
              {interviewModalPayload.format ? (
                <div>
                  <dt className="font-medium text-gray-500">Format</dt>
                  <dd className="mt-1 text-gray-900 capitalize">{interviewModalPayload.format}</dd>
                </div>
              ) : null}
              {interviewModalPayload.meetingLink ? (
                <div>
                  <dt className="font-medium text-gray-500">Meeting link</dt>
                  <dd className="mt-2">
                    <a
                      href={interviewModalPayload.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex break-all text-[#28A8E1] font-medium underline decoration-[#28A8E1]/40 underline-offset-2 hover:opacity-90"
                    >
                      Join interview
                    </a>
                  </dd>
                </div>
              ) : null}
              {interviewModalPayload.location ? (
                <div>
                  <dt className="font-medium text-gray-500">Location</dt>
                  <dd className="mt-1 text-gray-900">{interviewModalPayload.location}</dd>
                </div>
              ) : null}
              {Array.isArray(interviewModalPayload.interviewerNames) && interviewModalPayload.interviewerNames.length > 0 ? (
                <div>
                  <dt className="font-medium text-gray-500">
                    Interviewer{interviewModalPayload.interviewerNames.length > 1 ? 's' : ''}
                  </dt>
                  <dd className="mt-1 text-gray-900">
                    {interviewModalPayload.interviewerNames.join(', ')}
                  </dd>
                </div>
              ) : null}
              {interviewModalPayload.recruiterName ? (
                <div>
                  <dt className="font-medium text-gray-500">Recruiter</dt>
                  <dd className="mt-1 text-gray-900">{interviewModalPayload.recruiterName}</dd>
                </div>
              ) : null}
              {interviewModalPayload.notes?.trim() ? (
                <div>
                  <dt className="font-medium text-gray-500">Full details</dt>
                  <dd className="mt-1 whitespace-pre-wrap text-gray-800">{interviewModalPayload.notes}</dd>
                </div>
              ) : null}
            </dl>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={closeInterviewModal}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {interviewModalPayload.meetingLink ? (
                <a
                  href={interviewModalPayload.meetingLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#28A8E1] px-4 py-2 text-sm font-semibold text-white hover:opacity-95"
                >
                  Open link
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {withdrawConfirmOpen ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="withdraw-confirm-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={closeWithdrawConfirm}
          />
          <div className="relative z-101 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl">
            <h2 id="withdraw-confirm-title" className="text-lg font-semibold text-gray-900">
              Withdraw application?
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              This removes the role from My Applications. You can apply again anytime from Explore Jobs.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeWithdrawConfirm}
                disabled={withdrawing}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmWithdrawApplication}
                disabled={withdrawing}
                className="rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
              >
                {withdrawing ? 'Withdrawing…' : 'Yes, withdraw'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectionModalOpen && rejectionModalPayload ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="rejection-feedback-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={closeRejectionModal}
          />
          <div className="relative z-101 w-full max-w-lg rounded-2xl border border-rose-100 bg-white p-6 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="rejection-feedback-title" className="text-xl font-semibold text-gray-900">
                  {rejectionModalPayload.title}
                </h2>
                <p className="mt-1 text-sm text-gray-600">
                  {application?.job.title} · {application?.job.company}
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  {(() => {
                    const d = new Date(rejectionModalPayload.occurredAt);
                    if (Number.isNaN(d.getTime())) return '—';
                    const { date, time } = formatDateTime(d);
                    return `${date} · ${time}`;
                  })()}
                </p>
              </div>
              <button
                type="button"
                onClick={closeRejectionModal}
                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">Feedback</p>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-900">{rejectionModalPayload.feedback}</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeRejectionModal}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
