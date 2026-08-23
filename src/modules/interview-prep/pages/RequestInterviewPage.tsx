'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { INTERVIEW_CATEGORIES, getMyInterviewRequests } from '@/lib/interview-request-api';
import { listMarketplaceInterviewers } from '@/lib/interviewer-api';
import { resolveProfilePhotoUrl } from '@/lib/profile-photo';
import { RequestInterviewModal } from '../components/InterviewRequest/RequestInterviewModal';
import { InterviewRequestsList } from '../components/InterviewRequest/InterviewRequestsList';
import { InterviewSimpleTabs } from '../components/InterviewSimpleTabs';
import { ArrowLeft } from 'lucide-react';
import { KycVerifiedTag } from '@/components/interview/KycVerifiedTag';

export default function RequestInterviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshRequestsKey, setRefreshRequestsKey] = useState(0);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const [preselectedInterviewerId, setPreselectedInterviewerId] = useState('');
  const [viewProfileId, setViewProfileId] = useState('');
  const [pageTab, setPageTab] = useState<'inbox' | 'scheduled' | 'completed' | 'interviewers'>('inbox');
  const searchParams = useSearchParams();
  const requestsSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const tab = String(searchParams.get('tab') || '');
    if (tab === 'completed' || tab === 'scheduled' || tab === 'inbox' || tab === 'interviewers') {
      setPageTab(tab);
    }
  }, [searchParams]);

  const requestsQuery = useQuery({
    queryKey: ['my-interview-requests', refreshRequestsKey],
    queryFn: () => getMyInterviewRequests(),
    staleTime: 20_000,
    retry: 0,
  });

  const requests = requestsQuery.data ?? [];
  const inboxCount = requests.filter((row) =>
    [
      'PENDING_MATCHING',
      'MATCHING',
      'MATCHED',
      'FINDING_INTERVIEWER',
      'WAITING_FOR_ACCEPTANCE',
      'ACCEPTED',
    ].includes(row.status)
  ).length;
  const scheduledCount = requests.filter((row) =>
    ['SCHEDULED', 'IN_PROGRESS'].includes(row.status)
  ).length;
  const completedCount = requests.filter((row) => row.status === 'COMPLETED').length;

  const interviewersQuery = useQuery({
    queryKey: ['candidate-marketplace-interviewers'],
    queryFn: () => listMarketplaceInterviewers({}),
    enabled: pageTab === 'interviewers',
    staleTime: 20_000,
    retry: 0,
  });

  const openRequestForm = (interviewerId?: string) => {
    setPreselectedInterviewerId(String(interviewerId || '').trim());
    setRequestFormOpen(true);
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => router.push('/lms/interview-prep')}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interview Prep
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900">Create New Interview Request</h2>
            <p className="text-sm text-slate-600">
              Submit a request without picking an interviewer, or choose someone from the Interviewers tab.
            </p>
          </div>
          <button
            type="button"
            onClick={() => openRequestForm()}
            className="rounded-lg bg-[#28A8E1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1F8FC2]"
          >
            Request Interview
          </button>
        </div>
      </section>

      <InterviewSimpleTabs
        active={pageTab}
        onChange={(id) => setPageTab(id as typeof pageTab)}
        tabs={[
          { id: 'inbox', label: 'Inbox', count: inboxCount },
          { id: 'scheduled', label: 'Scheduled', count: scheduledCount },
          { id: 'completed', label: 'Completed', count: completedCount },
          { id: 'interviewers', label: 'Interviewers' },
        ]}
      />

      <RequestInterviewModal
        open={requestFormOpen}
        candidateId={user?.id || null}
        initialInterviewerId={preselectedInterviewerId}
        onOpenChange={(open) => {
          setRequestFormOpen(open);
          if (!open) setPreselectedInterviewerId('');
        }}
        onSubmitted={() => {
          setRefreshRequestsKey((prev) => prev + 1);
          setRequestFormOpen(false);
          setPreselectedInterviewerId('');
          setPageTab('inbox');
          window.setTimeout(() => {
            requestsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }}
        initialCategory={INTERVIEW_CATEGORIES[0]}
        renderMode="modal"
        showCloseButton
      />

      {pageTab === 'inbox' ? (
        <div ref={requestsSectionRef} className="pt-2">
          <InterviewRequestsList
            refreshKey={refreshRequestsKey}
            mode="inbox"
            title="Inbox"
            subtitle="Requests waiting to be matched or confirmed."
          />
        </div>
      ) : null}

      {pageTab === 'scheduled' ? (
        <div className="pt-2">
          <InterviewRequestsList
            refreshKey={refreshRequestsKey}
            mode="scheduled"
            title="Scheduled"
            subtitle="Upcoming interviews you have confirmed."
          />
        </div>
      ) : null}

      {pageTab === 'completed' ? (
        <div className="pt-2">
          <InterviewRequestsList
            refreshKey={refreshRequestsKey}
            mode="completed"
            title="Completed interviews"
            subtitle="Reviews from you and the interviewer appear here after the meeting ends."
          />
        </div>
      ) : null}

      {pageTab === 'interviewers' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Interviewers</h3>
          <p className="mt-1 text-sm text-slate-600">
            Browse interviewers and send a request. Choosing one here is optional — you can also submit from the popup without selecting anyone.
          </p>
          {interviewersQuery.isLoading ? (
            <p className="mt-3 text-sm text-slate-500">Loading interviewers...</p>
          ) : interviewersQuery.isError ? (
            <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
              <p>Unable to load interviewers right now.</p>
              <button
                type="button"
                onClick={() => interviewersQuery.refetch()}
                className="mt-2 rounded-md border border-rose-300 bg-white px-2.5 py-1 text-xs font-semibold text-rose-700"
              >
                Retry
              </button>
            </div>
          ) : (interviewersQuery.data || []).length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              No interviewers are available yet. You can still submit a request from Request Interview.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {(interviewersQuery.data || []).map((person) => {
                const photo = resolveProfilePhotoUrl(person.profilePhotoUrl);
                const expanded = viewProfileId === person.candidateId;
                return (
                  <div key={person.candidateId} className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-white p-3">
                    <div className="flex gap-3">
                      {photo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={photo} alt="" className="h-12 w-12 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-sm font-bold text-slate-600">
                          {String(person.fullName || 'I').slice(0, 1)}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="text-sm font-bold text-slate-900">{person.fullName}</p>
                          <KycVerifiedTag verified={person.kycVerified} />
                        </div>
                        <p className="text-xs text-slate-600">
                          {person.currentRole || 'Interviewer'} · {person.yearsOfExperience} Years Experience
                        </p>
                        <p className="mt-1 text-xs text-slate-600">
                          {(person.expertiseAreas || []).slice(0, 4).join(' • ') || 'General'}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-800">
                          ⭐ {Number(person.ratingAverage || 0).toFixed(1)} · {person.interviewPrice} Tokens / Interview
                        </p>
                      </div>
                    </div>
                    {expanded ? (
                      <div className="mt-2 space-y-1 rounded-lg bg-slate-50 px-2 py-2 text-xs text-slate-600">
                        <p>Languages: {(person.languages || []).join(', ') || 'N/A'}</p>
                        <p>Types: {(person.interviewTypes || []).join(', ') || 'N/A'}</p>
                        <p>Availability: {person.weeklyAvailability || 'N/A'}</p>
                        <p>About: {person.aboutYourself || 'N/A'}</p>
                        <p>Feedback: {person.feedbackStyle || 'N/A'}</p>
                      </div>
                    ) : null}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => openRequestForm(person.candidateId)}
                        className="rounded-md bg-[#28A8E1] px-2.5 py-1 text-xs font-semibold text-white"
                      >
                        Send Request
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setViewProfileId((prev) => (prev === person.candidateId ? '' : person.candidateId))
                        }
                        className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700"
                      >
                        {expanded ? 'Hide Profile' : 'View Profile'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}
