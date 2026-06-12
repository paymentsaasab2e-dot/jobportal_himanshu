'use client';

import { useRouter } from 'next/navigation';

interface ApplicationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobTitle: string;
  company: string;
  appliedDate: string;
  jobId?: number | string;
  applicationId?: string;
  assessmentRedirectPath?: string | null;
  pendingAssessmentTitle?: string | null;
}

export default function ApplicationSuccessModal({
  isOpen,
  onClose,
  jobTitle,
  company,
  appliedDate,
  applicationId,
  assessmentRedirectPath,
  pendingAssessmentTitle,
}: ApplicationSuccessModalProps) {
  const router = useRouter();

  const handleStartAssessment = () => {
    onClose();
    if (assessmentRedirectPath) {
      router.push(assessmentRedirectPath);
    }
  };

  const handleTrackApplication = () => {
    onClose();
    if (applicationId) {
      router.push(`/applications/${applicationId}`);
    } else {
      router.push('/applications');
    }
  };

  const handleBrowseMoreJobs = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[10050] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/20 backdrop-blur-md"
        onClick={onClose}
        aria-hidden
      />

      <div
        className="profile-page-typography candidate-dashboard-page relative z-10 w-full max-w-[400px] rounded-2xl border border-white/80 bg-white shadow-[0_20px_48px_rgba(15,23,42,0.14)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="application-success-title"
      >
        <div className="px-5 py-5 sm:px-6 sm:py-6">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 shadow-sm">
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          </div>

          <div className="mb-4 text-center">
            <h2
              id="application-success-title"
              className="application-detail-title text-[#111827]"
            >
              Application submitted successfully
            </h2>
            <p className="application-detail-helper mt-2">
              {assessmentRedirectPath
                ? 'Complete the pre-screen assessment to continue your application.'
                : 'You will receive updates via email and WhatsApp.'}
            </p>
          </div>

          {assessmentRedirectPath ? (
            <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-left">
              <p className="text-[0.8125rem] font-medium text-violet-900">Pre-screen assessment required</p>
              <p className="mt-1 text-[0.75rem] text-violet-800">
                {pendingAssessmentTitle || 'Timed assessment'} · Monitored attempt (tab switches are logged)
              </p>
            </div>
          ) : null}

          <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/90 px-4 py-3">
            <h3 className="profile-page-section-title mb-2 text-[#111827]">Job summary</h3>
            <div className="space-y-1.5">
              <p className="text-[0.8125rem] text-[#111827]">
                <span className="font-medium text-[#64748b]">Title: </span>
                {jobTitle}
              </p>
              <p className="text-[0.8125rem] text-[#111827]">
                <span className="font-medium text-[#64748b]">Company: </span>
                {company}
              </p>
              <p className="text-[0.8125rem] text-[#111827]">
                <span className="font-medium text-[#64748b]">Applied on: </span>
                {appliedDate}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {assessmentRedirectPath ? (
              <button
                type="button"
                onClick={handleStartAssessment}
                className="profile-modal-btn flex-1 rounded-lg bg-violet-600 px-4 py-2.5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-violet-700"
              >
                Start assessment
              </button>
            ) : (
              <button
                type="button"
                onClick={handleTrackApplication}
                className="profile-modal-btn flex-1 rounded-lg bg-[#28A8E1] px-4 py-2.5 text-[0.8125rem] font-medium text-white transition-colors hover:bg-[#1e96cc]"
              >
                Track application
              </button>
            )}
            <button
              type="button"
              onClick={handleBrowseMoreJobs}
              className="profile-modal-btn flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-[0.8125rem] font-medium text-[#111827] transition-colors hover:bg-slate-50"
            >
              Browse more jobs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
