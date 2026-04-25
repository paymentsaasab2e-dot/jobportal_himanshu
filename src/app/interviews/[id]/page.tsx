'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Header from '@/components/common/Header';

interface InterviewItem {
  id: string;
  jobTitle: string;
  company: string;
  interviewDateTime: string;
  interviewType: 'online' | 'walk-in';
  status: 'Scheduled' | 'Rescheduled' | 'Completed' | 'Cancelled';
  joinUrl?: string;
}

const PAGE_BG =
  'linear-gradient(135deg, #e0f2fe 0%, #ecf7fd 12%, #fafbfb 30%, #fdf6f0 55%, #fef5ed 85%, #fef5ed 100%)';

const mockInterviews: InterviewItem[] = [
  {
    id: 'int-1',
    jobTitle: 'Frontend Developer',
    company: 'NovaTech Systems',
    interviewDateTime: '2026-03-28T10:00:00',
    interviewType: 'online',
    status: 'Scheduled',
    joinUrl: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: 'int-2',
    jobTitle: 'UI Engineer',
    company: 'BlueOrbit Labs',
    interviewDateTime: '2026-03-30T14:30:00',
    interviewType: 'walk-in',
    status: 'Rescheduled',
  },
];

const getInterviewStatusColor = (status: InterviewItem['status']) => {
  switch (status) {
    case 'Scheduled':
      return 'bg-blue-100 text-blue-700';
    case 'Rescheduled':
      return 'bg-amber-100 text-amber-700';
    case 'Completed':
      return 'bg-green-100 text-green-700';
    case 'Cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export default function InterviewDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params.id || '');

  const interview = useMemo(
    () => mockInterviews.find((item) => item.id === id),
    [id]
  );

  if (!interview) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
        <main className="w-full grow overflow-x-hidden">
          <div className="mx-auto max-w-[1320px] px-6 lg:px-8 py-16 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Interview not found</h1>
            <p className="mt-2 text-gray-600">This interview could not be located.</p>
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

  const dateTime = new Date(interview.interviewDateTime);
  const dateLabel = dateTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const timeLabel = dateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="min-h-screen flex flex-col" style={{ background: PAGE_BG }}>
      <main className="w-full grow overflow-x-hidden">
        <div className="mx-auto max-w-[1320px] px-6 lg:px-8 pb-6 sm:pb-8 lg:py-10 pt-2 sm:pt-4 lg:pt-6 space-y-6">
          <button
            type="button"
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
            Back
          </button>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                  {interview.jobTitle}
                </h1>
                <p className="text-gray-500 font-medium mt-1">{interview.company}</p>
              </div>
              <span className={`inline-block px-3 py-1.5 rounded-full text-sm font-medium ${getInterviewStatusColor(interview.status)}`}>
                {interview.status}
              </span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">Interview Progress</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { label: 'Shortlisted', done: true },
                { label: interview.status === 'Rescheduled' ? 'Interview Rescheduled' : 'Interview Scheduled', done: true },
                { label: 'Final Decision', done: false },
              ].map((step, index) => (
                <div key={step.label} className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold ${step.done ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                    {index + 1}
                  </div>
                  <span className={`text-sm font-medium ${step.done ? 'text-gray-900' : 'text-gray-500'}`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Information</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div><p className="text-gray-500">Round</p><p className="font-medium text-gray-900">Technical Round</p></div>
                  <div><p className="text-gray-500">Date</p><p className="font-medium text-gray-900">{dateLabel}</p></div>
                  <div><p className="text-gray-500">Time</p><p className="font-medium text-gray-900">{timeLabel}</p></div>
                  <div><p className="text-gray-500">Duration</p><p className="font-medium text-gray-900">45 minutes</p></div>
                  <div><p className="text-gray-500">Mode</p><p className="font-medium text-gray-900">{interview.interviewType === 'online' ? 'Online' : 'Walk-in'}</p></div>
                  <div><p className="text-gray-500">Timezone</p><p className="font-medium text-gray-900">UTC +05:30</p></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Panel</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold">PS</div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">Priya Sharma</p>
                      <p className="text-xs text-gray-500">Senior Engineering Manager</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Interview Instructions</h3>
                <ul className="list-disc pl-5 text-sm text-gray-600 space-y-2">
                  <li>Join the session at least 10 minutes before start time.</li>
                  <li>Keep your resume and portfolio handy during the interview.</li>
                  <li>Ensure your camera and microphone are functioning properly.</li>
                </ul>
              </div>

              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Interview Preparation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    'Review the job description thoroughly',
                    'Prepare 2-3 project walkthroughs',
                    'Practice data structures fundamentals',
                    'Prepare thoughtful questions for interviewer',
                  ].map((item) => (
                    <div key={item} className="rounded-xl border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24">
                <div className="rounded-xl bg-blue-50 border border-blue-100 p-4">
                  <p className="text-sm font-semibold text-blue-800">Ready for your interview</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Join on time and keep your documents ready.
                  </p>
                </div>

                <div className="mt-4 space-y-3">
                  {interview.interviewType === 'online' ? (
                    <button
                      type="button"
                      onClick={() => {
                        if (interview.joinUrl) {
                          window.open(interview.joinUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className="w-full rounded-xl bg-[#28A8E1] px-4 py-3 text-sm font-semibold text-white hover:opacity-95 transition"
                    >
                      Join Interview
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition"
                  >
                    Test Audio
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

