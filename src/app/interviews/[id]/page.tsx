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
};

type InterviewRoundPayload = InterviewDetailsPayload & { timelineId?: string };

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
  return {
    date: date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
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

function interviewRoundsFromApplication(app: ApplicationDetail): InterviewRoundPayload[] {
  if (Array.isArray(app.interviewRounds) && app.interviewRounds.length > 0) {
    return app.interviewRounds;
  }
  const rows = [...(app.timeline || [])].sort(
    (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
  );
  return rows
    .filter((row) => isInterviewTimelineRow(row))
    .map((row) => ({
      timelineId: row.id,
      ...buildInterviewDetailsFromTimelineRow(row),
    }));
}

function effectiveLatestInterview(app: ApplicationDetail | null): InterviewDetailsPayload | null {
  if (!app) return null;
  if (app.interviewDetails) return app.interviewDetails;
  const stack = interviewRoundsFromApplication(app);
  if (stack.length > 0) return stack[stack.length - 1];
  const rows = app.timeline || [];
  const interviewRow = [...rows]
    .filter((t) => {
      const st = String(t.status || '').toLowerCase();
      const title = String(t.title || '').toLowerCase();
      return st.includes('interview') || title.includes('interview');
    })
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];
  if (!interviewRow) return null;
  return buildInterviewDetailsFromTimelineRow(interviewRow);
}

function formatModeFromInterview(iv: InterviewDetailsPayload): string {
  const fmt = (iv.format || '').toLowerCase();
  if (fmt.includes('in person') || fmt.includes('in-person') || fmt.includes('walk')) return 'In person / walk-in';
  if (fmt.includes('phone')) return 'Phone';
  if (fmt.includes('video') || iv.meetingLink) return 'Online / video';
  if (iv.location && !iv.meetingLink) return 'In person';
  if (iv.meetingLink) return 'Online';
  return iv.format || '—';
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

  const latest = useMemo(() => (application ? effectiveLatestInterview(application) : null), [application]);

  const joinUrl = latest?.meetingLink?.trim() || '';

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

  const { date: dateLabel, time: timeLabel } = latest?.scheduledAt
    ? formatDateTime(latest.scheduledAt)
    : { date: '—', time: '—' };

  const statusDisplay = application.status || 'Interview';

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
      <main className="w-full grow overflow-x-hidden">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-8 pb-6 sm:pb-8 lg:py-10 pt-2 sm:pt-4 lg:pt-6 space-y-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
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
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  {application.job?.title || 'Role'}
                </h1>
                <p className="text-gray-500 font-medium mt-1">{application.job?.company || ''}</p>
                {application.job?.location ? (
                  <p className="text-sm text-gray-500 mt-1">{application.job.location}</p>
                ) : null}
              </div>
              <span className="inline-block px-3 py-1.5 rounded-full text-sm font-medium bg-sky-100 text-sky-800">
                {statusDisplay}
              </span>
            </div>
          </div>

          {!latest ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center text-gray-600">
              <p>No interview has been scheduled for this application yet.</p>
              <button
                type="button"
                onClick={() => router.push(`/applications/${applicationId}`)}
                className="mt-4 rounded-xl bg-[#28A8E1] px-6 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
              >
                View application
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Round</p>
                      <p className="font-medium text-gray-900">
                        {latest.roundLabel || latest.timelineTitle || 'Interview'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">Format</p>
                      <p className="font-medium text-gray-900">{latest.format || '—'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{dateLabel}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">{timeLabel}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Mode</p>
                      <p className="font-medium text-gray-900">{formatModeFromInterview(latest)}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Location</p>
                      <p className="font-medium text-gray-900">{latest.location || '—'}</p>
                    </div>
                  </div>
                  {joinUrl ? (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <p className="text-gray-500 text-sm mb-2">Meeting link</p>
                      <a
                        href={joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-[#28A8E1] break-all hover:underline"
                      >
                        {joinUrl}
                      </a>
                    </div>
                  ) : null}
                </div>

                {(latest.interviewerNames?.length || latest.recruiterName) ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">People</h3>
                    <div className="space-y-3 text-sm">
                      {latest.recruiterName ? (
                        <div>
                          <p className="text-gray-500">Recruiter</p>
                          <p className="font-medium text-gray-900">{latest.recruiterName}</p>
                        </div>
                      ) : null}
                      {latest.interviewerNames && latest.interviewerNames.length > 0 ? (
                        <div>
                          <p className="text-gray-500">Interviewers</p>
                          <ul className="list-disc pl-5 text-gray-900">
                            {latest.interviewerNames.map((name) => (
                              <li key={name}>{name}</li>
                            ))}
                          </ul>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {latest.notes ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes from the employer</h3>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{latest.notes}</p>
                  </div>
                ) : null}

                {rounds.length > 1 ? (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">All scheduled rounds</h3>
                    <ol className="space-y-4 list-decimal pl-5 text-sm">
                      {rounds.map((r, idx) => {
                        const dt = formatDateTime(r.scheduledAt);
                        return (
                          <li key={r.timelineId || idx} className="text-gray-800 pl-1">
                            <span className="font-medium">
                              {r.roundLabel || r.timelineTitle || `Round ${idx + 1}`}
                            </span>
                            <span className="text-gray-500">
                              {' '}
                              — {dt.date} at {dt.time}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                  </div>
                ) : null}
              </div>

              <div className="lg:col-span-3">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
                  <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                    <p className="text-sm font-semibold text-blue-800">Ready for your interview</p>
                    <p className="text-xs text-blue-700 mt-1">Join on time and keep your documents ready.</p>
                  </div>

                  <div className="mt-4 space-y-3">
                    {joinUrl ? (
                      <a
                        href={joinUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full text-center rounded-xl bg-[#28A8E1] px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
                      >
                        Join interview
                      </a>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => router.push(`/applications/${applicationId}`)}
                      className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
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
