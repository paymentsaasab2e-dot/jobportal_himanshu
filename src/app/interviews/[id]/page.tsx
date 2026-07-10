'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-base';

const PAGE_BG =
  'linear-gradient(135deg, #e0f2fe 0%, #ecf7fd 12%, #fafbfb 30%, #fdf6f0 55%, #fef5ed 85%, #fef5ed 100%)';

type InterviewDetailsPayload = {
  timelineTitle: string;
  scheduledAt: string;
  roundLabel: string | null;
  format: string | null;
  meetingLink: string | null;
  location: string | null;
  notes: string | null;
  interviewerNames?: string[];
  recruiterName?: string | null;
  isCompleted?: boolean;
  outcome?: string | null;
  remark?: string | null;
  overallRating?: number | null;
  completedAt?: string | null;
  recommendationLabel?: string | null;
  comments?: string | null;
  companyName?: string | null;
  technicalScore?: number | null;
  communicationScore?: number | null;
  problemSolvingScore?: number | null;
  cultureFitScore?: number | null;
  experienceMatchScore?: number | null;
  strengths?: string | null;
  weaknesses?: string | null;
};

type InterviewRoundPayload = InterviewDetailsPayload & { timelineId?: string | null };

interface ApplicationDetail {
  id: string;
  candidateId?: string;
  status: string;
  statusCode?: string;
  interviewDetails?: InterviewDetailsPayload | null;
  interviewRounds?: InterviewRoundPayload[];
  job: {
    title: string;
    company: string;
    location: string;
  };
  timeline: Array<{
    id: string;
    status: string;
    title: string;
    description: string | null;
    occurredAt: string;
  }>;
}

function formatDateTime(value: string | Date) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { date: '—', time: '—', weekday: '' };
  }
  return {
    date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    weekday: date.toLocaleDateString('en-US', { weekday: 'long' }),
  };
}

function parseInterviewDescriptionClient(description: string | null | undefined) {
  if (!description || typeof description !== 'string') {
    return {
      roundLabel: null as string | null,
      typeFromLine: null as string | null,
      format: null as string | null,
      meetingLink: null as string | null,
      location: null as string | null,
      mode: null as string | null,
      whenRaw: null as string | null,
      interviewerNames: [] as string[],
      recruiterName: null as string | null,
    };
  }
  const roundMatch = description.match(/Recruiter scheduled\s+([^.]+)\./i);
  const typeLineMatch = description.match(/^\s*type\s*:\s*(.+)$/im);
  const formatMatch = description.match(/Format:\s*([^.]+)\./i);
  const linkMatch = description.match(/(?:Meeting link|Link):\s*(https?:\/\/\S+)/i);
  const locationMatch = description.match(/Location:\s*(.+?)(?:\.(?:\s|$)|$)/im);
  const modeMatch = description.match(/^\s*mode\s*:\s*(.+)$/im);
  const whenMatch = description.match(/^\s*when\s*:\s*(.+)$/im);
  const interviewerLineMatch = description.match(/^\s*interviewer(?:s)?\s*:\s*(.+)$/im);
  const recruiterLineMatch = description.match(/^\s*recruiter\s*:\s*(.+)$/im);
  return {
    roundLabel: roundMatch ? roundMatch[1].trim() : null,
    typeFromLine: typeLineMatch ? typeLineMatch[1].trim() : null,
    format: formatMatch ? formatMatch[1].trim() : null,
    meetingLink: linkMatch ? linkMatch[1] : null,
    location: locationMatch ? locationMatch[1].trim() : null,
    mode: modeMatch ? modeMatch[1].trim() : null,
    whenRaw: whenMatch ? whenMatch[1].trim() : null,
    interviewerNames: interviewerLineMatch
      ? interviewerLineMatch[1]
          .split(/[,;|]/)
          .map((n) => n.trim())
          .filter(Boolean)
      : [],
    recruiterName: recruiterLineMatch ? recruiterLineMatch[1].trim() || null : null,
  };
}

function isInterviewTimelineRow(row: { status: string; title: string }) {
  const blob = `${row.status} ${row.title}`.toLowerCase();
  return blob.includes('interview');
}

function buildInterviewDetailsFromTimelineRow(
  row: ApplicationDetail['timeline'][number]
): InterviewDetailsPayload {
  const parsed = parseInterviewDescriptionClient(row.description);
  const at = new Date(row.occurredAt);
  const titleTrim = String(row.title || '').trim();
  const titleIsGeneric = /^interview$/i.test(titleTrim);
  let scheduledAt = Number.isNaN(at.getTime()) ? row.occurredAt : at.toISOString();
  if (parsed.whenRaw) {
    const whenDate = new Date(parsed.whenRaw);
    if (!Number.isNaN(whenDate.getTime())) scheduledAt = whenDate.toISOString();
  }
  return {
    timelineTitle: row.title || 'Interview',
    scheduledAt,
    roundLabel: parsed.roundLabel || parsed.typeFromLine || (!titleIsGeneric ? titleTrim : null),
    format: parsed.format || parsed.mode,
    meetingLink: parsed.meetingLink,
    location: parsed.location,
    notes: row.description || null,
    interviewerNames: parsed.interviewerNames,
    recruiterName: parsed.recruiterName,
  };
}

function isGenericPipelineStageRound(round: InterviewRoundPayload): boolean {
  const title = String(round.timelineTitle || round.roundLabel || '').trim().toLowerCase();
  const notes = String(round.notes || '').trim().toLowerCase();
  if (notes === 'interviewing stage' || notes === 'interview stage') return true;
  if (
    (title === 'interviewing' || title === 'interview') &&
    !notes.includes('when:') &&
    !notes.includes('type:') &&
    !notes.includes('interviewer:') &&
    !notes.includes('meeting link:') &&
    !/recruiter scheduled/i.test(notes)
  ) {
    return true;
  }
  return false;
}

function interviewRoundsFromApplication(app: ApplicationDetail): InterviewRoundPayload[] {
  const raw =
    Array.isArray(app.interviewRounds) && app.interviewRounds.length > 0
      ? app.interviewRounds
      : (() => {
          const rows = [...(app.timeline || [])].sort(
            (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
          );
          return rows
            .filter((row) => isInterviewTimelineRow(row))
            .map((row) => ({
              timelineId: row.id,
              ...buildInterviewDetailsFromTimelineRow(row),
            }));
        })();

  return raw.filter((round) => !isGenericPipelineStageRound(round));
}

function getRoundLabel(round: InterviewRoundPayload, index: number): string {
  return (
    round.roundLabel ||
    round.timelineTitle ||
    `Round ${index + 1}`
  ).replace(/^interview completed\s*[—-]\s*/i, '').trim();
}

function formatModeFromInterview(iv: InterviewDetailsPayload): string {
  const fmt = (iv.format || '').toLowerCase();
  if (fmt.includes('in person') || fmt.includes('in-person') || fmt.includes('walk')) {
    return 'In person';
  }
  if (fmt.includes('phone')) return 'Phone';
  if (fmt.includes('video') || iv.meetingLink) return 'Online / video';
  if (iv.location && !iv.meetingLink) return 'In person';
  if (iv.meetingLink) return 'Online';
  return iv.format || '—';
}

function outcomeBadgeClass(outcome: string | null | undefined): string {
  const value = String(outcome || '').trim().toLowerCase();
  if (value === 'pass') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (value === 'failed' || value === 'fail' || value === 'reject') {
    return 'bg-red-100 text-red-800 border-red-200';
  }
  if (value === 'on hold' || value === 'hold') return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-slate-100 text-slate-700 border-slate-200';
}

function formatOutcomeLabel(outcome: string | null | undefined): string {
  const value = String(outcome || '').trim();
  if (!value) return 'Awaiting feedback';
  if (value.toLowerCase() === 'failed') return 'Failed';
  return value;
}

function roundHasFeedback(round: InterviewRoundPayload): boolean {
  const hasScores =
    round.overallRating != null ||
    round.technicalScore != null ||
    round.communicationScore != null;
  const hasText = Boolean(
    String(round.remark || round.comments || '').trim() ||
      String(round.strengths || '').trim() ||
      String(round.weaknesses || '').trim()
  );
  return Boolean(round.isCompleted && round.outcome && (hasScores || hasText));
}

function isGenericStageNote(notes: string | null | undefined): boolean {
  const text = String(notes || '').trim().toLowerCase();
  return text === 'interviewing stage' || text === 'interview stage';
}

function ScoreBar({ label, value }: { label: string; value: number | null | undefined }) {
  if (value == null || Number.isNaN(Number(value))) return null;
  const score = Number(value);
  const pct = Math.min(100, Math.max(0, (score / 5) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-900">{score}/5</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-[#28A8E1] transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function RoundCard({
  round,
  index,
  total,
}: {
  round: InterviewRoundPayload;
  index: number;
  total: number;
}) {
  const label = getRoundLabel(round, index);
  const dt = round.scheduledAt ? formatDateTime(round.scheduledAt) : null;
  const completedDt = round.completedAt ? formatDateTime(round.completedAt) : null;
  const hasFeedback = roundHasFeedback(round);
  const isUpcoming = !round.isCompleted && !hasFeedback;
  const joinUrl = round.meetingLink?.trim() || '';
  const remark = round.remark || round.comments || '';
  const scores = [
    { label: 'Technical skills', value: round.technicalScore },
    { label: 'Communication', value: round.communicationScore },
    { label: 'Problem solving', value: round.problemSolvingScore },
    { label: 'Culture fit', value: round.cultureFitScore },
    { label: 'Experience match', value: round.experienceMatchScore },
  ].filter((s) => s.value != null);

  return (
    <article className="relative pl-10 sm:pl-12">
      <div
        className={`absolute left-3 top-6 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold sm:left-4 ${
          hasFeedback
            ? 'border-emerald-400 bg-emerald-50 text-emerald-800'
            : isUpcoming
              ? 'border-sky-400 bg-sky-50 text-sky-800'
              : 'border-gray-300 bg-white text-gray-600'
        }`}
      >
        {index + 1}
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                Round {index + 1} of {total}
              </p>
              <h3 className="mt-1 text-lg font-bold text-gray-900">{label}</h3>
              {round.companyName ? (
                <p className="mt-0.5 text-sm text-gray-500">{round.companyName}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {hasFeedback ? (
                <span
                  className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${outcomeBadgeClass(
                    round.outcome
                  )}`}
                >
                  {formatOutcomeLabel(round.outcome)}
                </span>
              ) : isUpcoming ? (
                <span className="inline-flex rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-800">
                  Scheduled
                </span>
              ) : (
                <span className="inline-flex rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-600">
                  In progress
                </span>
              )}
              {round.recommendationLabel ? (
                <span className="inline-flex rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-800">
                  {round.recommendationLabel}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5 sm:px-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
              <p className="text-xs font-medium text-gray-500">Date & time</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {dt ? `${dt.weekday}, ${dt.date}` : '—'}
              </p>
              <p className="text-sm text-gray-600">{dt?.time || '—'}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
              <p className="text-xs font-medium text-gray-500">Mode</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{formatModeFromInterview(round)}</p>
            </div>
            <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3">
              <p className="text-xs font-medium text-gray-500">Location</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{round.location || '—'}</p>
            </div>
          </div>

          {(round.recruiterName || (round.interviewerNames?.length ?? 0) > 0) ? (
            <div className="rounded-xl border border-gray-100 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">People</p>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {round.recruiterName ? (
                  <div>
                    <p className="text-xs text-gray-500">Recruiter</p>
                    <p className="text-sm font-medium text-gray-900">{round.recruiterName}</p>
                  </div>
                ) : null}
                {(round.interviewerNames?.length ?? 0) > 0 ? (
                  <div>
                    <p className="text-xs text-gray-500">Interviewers</p>
                    <ul className="mt-1 space-y-0.5 text-sm font-medium text-gray-900">
                      {round.interviewerNames!.map((name) => (
                        <li key={name}>{name}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}

          {isUpcoming && joinUrl ? (
            <div className="rounded-xl border border-sky-100 bg-sky-50/60 p-4">
              <p className="text-sm font-semibold text-sky-900">Meeting link</p>
              <a
                href={joinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block break-all text-sm font-medium text-[#28A8E1] hover:underline"
              >
                {joinUrl}
              </a>
            </div>
          ) : null}

          {round.notes && !isGenericStageNote(round.notes) && !hasFeedback ? (
            <div className="rounded-xl border border-gray-100 bg-gray-50/50 p-4">
              <p className="text-sm font-semibold text-gray-900">Notes from employer</p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{round.notes}</p>
            </div>
          ) : null}

          {hasFeedback ? (
            <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-gray-900">Interview result & feedback</p>
                  {completedDt ? (
                    <p className="mt-1 text-xs text-gray-500">
                      Shared on {completedDt.date} at {completedDt.time}
                    </p>
                  ) : null}
                </div>
                {round.overallRating != null ? (
                  <div className="rounded-xl border border-white bg-white px-4 py-2 text-center shadow-sm">
                    <p className="text-xs text-gray-500">Overall</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {round.overallRating}
                      <span className="text-sm font-medium text-gray-400">/5</span>
                    </p>
                  </div>
                ) : null}
              </div>

              {scores.length > 0 ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {scores.map((s) => (
                    <ScoreBar key={s.label} label={s.label} value={s.value} />
                  ))}
                </div>
              ) : null}

              {remark ? (
                <div className="mt-4 rounded-xl border border-white/80 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    Recruiter remark
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-gray-700">{remark}</p>
                </div>
              ) : null}

              {(round.strengths || round.weaknesses) ? (
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {round.strengths ? (
                    <div className="rounded-xl border border-emerald-100 bg-white p-4">
                      <p className="text-xs font-semibold text-emerald-800">Strengths</p>
                      <p className="mt-2 text-sm text-gray-700">{round.strengths}</p>
                    </div>
                  ) : null}
                  {round.weaknesses ? (
                    <div className="rounded-xl border border-rose-100 bg-white p-4">
                      <p className="text-xs font-semibold text-rose-800">Areas to improve</p>
                      <p className="mt-2 text-sm text-gray-700">{round.weaknesses}</p>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

export default function InterviewDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const applicationId = String(params.id || '');

  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const id =
      sessionStorage.getItem('candidateId')?.trim() ||
      localStorage.getItem('candidateId')?.trim() ||
      null;
    setCandidateId(id);
  }, []);

  useEffect(() => {
    async function load() {
      if (!applicationId) return;
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/applications/detail/${encodeURIComponent(applicationId)}`
        );
        const result = await response.json();
        if (!response.ok || !result?.success || !result?.data) {
          throw new Error(result?.message || 'Failed to load interview details');
        }
        setApplication(result.data as ApplicationDetail);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load interview details');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [applicationId]);

  const accessDenied = useMemo(() => {
    if (!application || !candidateId) return false;
    if (!application.candidateId) return false;
    return application.candidateId !== candidateId;
  }, [application, candidateId]);

  const rounds = useMemo(
    () => (application ? interviewRoundsFromApplication(application) : []),
    [application]
  );

  const stats = useMemo(() => {
    const withFeedback = rounds.filter(roundHasFeedback).length;
    const upcoming = rounds.filter((r) => !r.isCompleted && !roundHasFeedback(r)).length;
    const latestWithOutcome = [...rounds].reverse().find((r) => r.outcome);
    return { total: rounds.length, withFeedback, upcoming, latestWithOutcome };
  }, [rounds]);

  const nextJoinRound = useMemo(() => {
    return (
      [...rounds].reverse().find((r) => !roundHasFeedback(r) && r.meetingLink?.trim()) ||
      [...rounds].reverse().find((r) => !roundHasFeedback(r)) ||
      null
    );
  }, [rounds]);

  const joinUrl = nextJoinRound?.meetingLink?.trim() || '';

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
        <main className="w-full grow overflow-x-hidden">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-8 py-16 text-center text-gray-600">
            Loading interview details…
          </div>
        </main>
      </div>
    );
  }

  if (error || !application || accessDenied) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
        <main className="w-full grow overflow-x-hidden">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-8 py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Interview not found</h1>
            <p className="mt-2 text-gray-600">
              {accessDenied
                ? 'You do not have access to this interview.'
                : error || 'This interview could not be located.'}
            </p>
            <button
              type="button"
              onClick={() => router.push('/applications')}
              className="mt-6 rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
            >
              Back to Applications
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
      <main className="w-full grow overflow-x-hidden">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-8 pb-8 pt-4 sm:pt-6 lg:py-10 space-y-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back
          </button>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-[#28A8E1]/10 via-white to-orange-50 px-6 py-6 sm:px-8">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-[#28A8E1]">
                    Interview journey
                  </p>
                  <h1 className="mt-1 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
                    {application.job?.title || 'Role'}
                  </h1>
                  <p className="mt-1 font-medium text-gray-600">{application.job?.company || ''}</p>
                  {application.job?.location ? (
                    <p className="mt-1 text-sm text-gray-500">{application.job.location}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-sky-100 px-3 py-1.5 text-sm font-semibold text-sky-800">
                    {stats.total} round{stats.total === 1 ? '' : 's'}
                  </span>
                  {stats.withFeedback > 0 ? (
                    <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-sm font-semibold text-emerald-800">
                      {stats.withFeedback} with feedback
                    </span>
                  ) : null}
                  {stats.upcoming > 0 ? (
                    <span className="rounded-full bg-amber-100 px-3 py-1.5 text-sm font-semibold text-amber-800">
                      {stats.upcoming} upcoming
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {rounds.length === 0 ? (
            <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
              <p className="text-gray-600">No interview has been scheduled for this application yet.</p>
              <button
                type="button"
                onClick={() => router.push(`/applications/${applicationId}`)}
                className="mt-4 rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
              >
                View application
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
              <div className="lg:col-span-8">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-gray-900">All interview rounds</h2>
                  <p className="mt-1 text-sm text-gray-500">
                    Each round below shows schedule details, people involved, and recruiter feedback when available.
                  </p>
                </div>

                <div className="relative space-y-8">
                  <div className="absolute bottom-4 left-[1.35rem] top-4 w-0.5 bg-gradient-to-b from-sky-200 via-gray-200 to-transparent sm:left-[1.6rem]" />
                  {rounds.map((round, idx) => (
                    <RoundCard
                      key={round.timelineId || `round-${idx}`}
                      round={round}
                      index={idx}
                      total={rounds.length}
                    />
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="sticky top-24 space-y-4">
                  {stats.latestWithOutcome ? (
                    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                        Latest result
                      </p>
                      <p className="mt-2 text-lg font-bold text-gray-900">
                        {getRoundLabel(stats.latestWithOutcome, rounds.indexOf(stats.latestWithOutcome))}
                      </p>
                      <span
                        className={`mt-3 inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${outcomeBadgeClass(
                          stats.latestWithOutcome.outcome
                        )}`}
                      >
                        {formatOutcomeLabel(stats.latestWithOutcome.outcome)}
                      </span>
                      {stats.latestWithOutcome.overallRating != null ? (
                        <p className="mt-3 text-sm text-gray-600">
                          Overall rating:{' '}
                          <span className="font-semibold text-gray-900">
                            {stats.latestWithOutcome.overallRating}/5
                          </span>
                        </p>
                      ) : null}
                    </div>
                  ) : null}

                  <div
                    className={`rounded-2xl border p-5 shadow-sm ${
                      joinUrl ? 'border-sky-100 bg-sky-50/50' : 'border-gray-100 bg-white'
                    }`}
                  >
                    <p className="text-sm font-bold text-gray-900">
                      {joinUrl ? 'Next interview' : 'Application'}
                    </p>
                    <p className="mt-1 text-xs text-gray-600">
                      {joinUrl
                        ? 'Use the meeting link when your next round begins.'
                        : 'Track your full hiring progress on the application page.'}
                    </p>
                    {joinUrl ? (
                      <a
                        href={joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-4 block w-full rounded-xl bg-[#28A8E1] px-4 py-3 text-center text-sm font-semibold text-white hover:opacity-95 transition"
                      >
                        Join interview
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => router.push(`/applications/${applicationId}`)}
                      className={`w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition ${
                        joinUrl ? 'mt-3' : 'mt-4'
                      }`}
                    >
                      Full application status
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
