'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { INTERVIEW_CATEGORIES } from '@/lib/interview-request-api';
import { RequestInterviewModal } from '../components/InterviewRequest/RequestInterviewModal';
import { InterviewRequestsList } from '../components/InterviewRequest/InterviewRequestsList';
import { ArrowLeft } from 'lucide-react';

export default function RequestInterviewPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshRequestsKey, setRefreshRequestsKey] = useState(0);
  const [requestFormOpen, setRequestFormOpen] = useState(false);
  const requestsSectionRef = useRef<HTMLDivElement | null>(null);

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
              Click below to open the guided request form in a popup.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRequestFormOpen(true)}
            className="rounded-lg bg-[#28A8E1] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1F8FC2]"
          >
            Request Interview
          </button>
        </div>
      </section>

      <RequestInterviewModal
        open={requestFormOpen}
        candidateId={user?.id || null}
        onOpenChange={setRequestFormOpen}
        onSubmitted={() => {
          setRefreshRequestsKey((prev) => prev + 1);
          setRequestFormOpen(false);
          window.setTimeout(() => {
            requestsSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 120);
        }}
        initialCategory={INTERVIEW_CATEGORIES[0]}
        renderMode="modal"
        showCloseButton
      />

      <div ref={requestsSectionRef} className="pt-2">
        <InterviewRequestsList
          refreshKey={refreshRequestsKey}
          title="Your Interview Requests"
          subtitle="All requests you submit appear here with live status."
        />
      </div>
    </div>
  );
}
