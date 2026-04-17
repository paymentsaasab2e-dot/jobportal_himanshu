'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '../../../components/common/Header';
import { API_BASE_URL } from '@/lib/api-base';

type TimelineIcon = 'document' | 'review' | 'star' | 'check' | 'x' | 'calendar';

interface TimelineEvent {
  id: string;
  status: string;
  title: string;
  description: string;
  date: string;
  time: string;
  icon: TimelineIcon;
}

interface CommunicationUpdate {
  id: string;
  channel: 'email' | 'whatsapp';
  title: string;
  preview: string;
  date: string;
  time: string;
}

interface ApplicationDetail {
  id: string;
  status: string;
  pipelineStage?: string | null;
  pipelineStages?: string[];
  appliedAt: string;
  updatedAt?: string;
  emailUpdates: boolean;
  whatsappUpdates: boolean;
  offerDetails: string | null;
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

function getStatusIcon(iconType: TimelineIcon) {
  switch (iconType) {
    case 'document':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
        </svg>
      );
    case 'review':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      );
    case 'star':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      );
    case 'check':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      );
    case 'x':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      );
    case 'calendar':
      return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M3 10h18" />
        </svg>
      );
    default:
      return null;
  }
}

function getStatusIconType(status: string): TimelineIcon {
  const value = (status || '').toLowerCase();
  if (value.includes('submit')) return 'document';
  if (value.includes('review')) return 'review';
  if (value.includes('shortlist')) return 'star';
  if (value.includes('interview')) return 'calendar';
  if (value.includes('reject')) return 'x';
  if (value.includes('select')) return 'check';
  return 'document';
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
  if (value.includes('review')) return 'Your application is being reviewed';
  if (value.includes('rejected')) return 'Application not selected';
  return 'Application submitted';
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

export default function ApplicationStatusPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const applicationId = String(params?.id || '');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [application, setApplication] = useState<ApplicationDetail | null>(null);

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

  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    if (!application) return [];
    return (application.timeline || []).map((item) => {
      const { date, time } = formatDateTime(item.occurredAt);
      return {
        id: item.id,
        status: item.status,
        title: item.title || item.status,
        description: item.description || `${item.status} update for your application.`,
        date,
        time,
        icon: getStatusIconType(item.status),
      };
    });
  }, [application]);

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
    const currentStage = String(application.pipelineStage || application.status || '').trim();
    const normalizedCurrent = normalizeStage(currentStage);
    if (currentStage && normalizedCurrent && !normalized.has(normalizedCurrent)) {
      sequence.push(currentStage);
    }
    return sequence;
  }, [application]);
  const currentPipelineIndex = useMemo(() => {
    if (!application || pipelineStageFlow.length === 0) return -1;
    const current = normalizeStage(application.pipelineStage || application.status || '');
    if (!current) return -1;
    return pipelineStageFlow.findIndex((stage) => normalizeStage(stage) === current);
  }, [application, pipelineStageFlow]);
  const stageProgressCards = useMemo(() => {
    if (!application || pipelineStageFlow.length === 0 || currentPipelineIndex < 0) return [] as string[];
    return pipelineStageFlow.filter((stage, index) => {
      const normalized = normalizeStage(stage);
      return index <= currentPipelineIndex && normalized && normalized !== 'applied';
    });
  }, [application, pipelineStageFlow, currentPipelineIndex]);
  const stageUpdatedAt = application?.updatedAt ? formatDateTime(application.updatedAt) : null;

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(135deg, #e0f2fe 0%, #ecf7fd 12%, #fafbfb 30%, #fdf6f0 55%, #fef5ed 85%, #fef5ed 100%)',
      }}
    >
      <Header />

      <main className="mx-auto max-w-[1320px] px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
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
                <div>
                  <p className={`text-lg font-semibold ${getStatusColor(application.status)} mb-1`}>{application.status}</p>
                  <p className="text-sm text-gray-600">{getStatusMessage(application.status)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pipeline Stage</h2>
                {pipelineStageFlow.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Current stage:{' '}
                      <span className="font-semibold text-gray-900">
                        {application.pipelineStage || application.status}
                      </span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {pipelineStageFlow.map((stage, index) => {
                        const isCompleted = currentPipelineIndex >= 0 && index <= currentPipelineIndex;
                        const isCurrent = currentPipelineIndex === index;
                        return (
                          <div key={`${stage}-${index}`} className="flex items-center gap-2">
                            <span
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                isCurrent
                                  ? 'bg-blue-100 text-blue-700 border-blue-200'
                                  : isCompleted
                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200'
                                    : 'bg-gray-50 text-gray-500 border-gray-200'
                              }`}
                            >
                              {stage}
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

                  {stageProgressCards.map((stage, index) => {
                    const isCurrent = index === stageProgressCards.length - 1;
                    return (
                      <div
                        key={`${stage}-${index}`}
                        className={`rounded-xl border p-4 ${
                          isCurrent ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                        }`}
                      >
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
                    );
                  })}

                  {!stageProgressCards.length && timelineEvents.length > 0 ? (
                    timelineEvents.map((event) => (
                      <div key={event.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                        <h3 className="text-base font-semibold text-gray-900">{event.title}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {event.date}, {event.time}
                        </p>
                        <p className="text-sm text-gray-700 mt-2">{event.description}</p>
                      </div>
                    ))
                  ) : null}

                  {!stageProgressCards.length && !timelineEvents.length ? (
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
    </div>
  );
}
