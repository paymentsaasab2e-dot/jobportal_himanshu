'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { API_BASE_URL } from '@/lib/api-base';
import { showErrorToast, showSuccessToast } from '@/components/common/toast/toast';
import { ProfilePageShell } from '@/components/profile/layout';
import { ApplicationDetailSectionCard } from '@/components/applications/ApplicationDetailSectionCard';

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
  isCompleted?: boolean;
  outcome?: string | null;
  recommendationLabel?: string | null;
  remark?: string | null;
  comments?: string | null;
  companyName?: string | null;
  technicalScore?: number | null;
  communicationScore?: number | null;
  problemSolvingScore?: number | null;
  cultureFitScore?: number | null;
  experienceMatchScore?: number | null;
  strengths?: string | null;
  weaknesses?: string | null;
  overallRating?: number | null;
  completedAt?: string | null;
};

type InterviewRoundPayload = InterviewDetailsPayload & { timelineId?: string };

type InterviewFeedbackModalPayload = {
  companyName: string;
  roundLabel: string;
  submittedAt: string;
  recommendationLabel: string;
  technicalScore?: number | null;
  communicationScore?: number | null;
  problemSolvingScore?: number | null;
  cultureFitScore?: number | null;
  experienceMatchScore?: number | null;
  overallRating?: number | null;
  strengths?: string | null;
  weaknesses?: string | null;
  comments?: string | null;
};

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
  placementId?: string | null;
  placementStatus?: string | null;
  offerResponse?: string | null;
  offerRespondedAt?: string | null;
  offerRejectionRemark?: string | null;
  offerResentAt?: string | null;
  joiningDate?: string | null;
  reportingToName?: string | null;
  reportingToTitle?: string | null;
  reportingToEmail?: string | null;
  joiningNotes?: string | null;
  rejectionDetails?: {
    reason: string | null;
    feedback: string | null;
    sharedAt: string | null;
    title?: string | null;
  } | null;
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

function resolveOfferResponseState(application: ApplicationDetail): 'ACCEPTED' | 'REJECTED' | null {
  const response = String(application.offerResponse || '').trim().toUpperCase();
  if (response === 'ACCEPTED' || response === 'REJECTED') return response;
  if (response === 'PENDING') return null;

  const placement = String(application.placementStatus || '').trim().toUpperCase();
  if (placement === 'OFFER_ACCEPTED') return 'ACCEPTED';
  if (placement === 'OFFER_REJECTED') return 'REJECTED';
  return null;
}

function isOfferResentPending(application: ApplicationDetail): boolean {
  if (!isInPlacementOfferFlow(application)) return false;
  const response = String(application.offerResponse || '').trim().toUpperCase();
  return Boolean(application.offerResentAt) && (response === 'PENDING' || !response);
}

function hasOfferBeenResent(application: ApplicationDetail): boolean {
  return isInPlacementOfferFlow(application) && Boolean(application.offerResentAt);
}

function isInPlacementOfferFlow(application: ApplicationDetail): boolean {
  const placementStatus = String(application.placementStatus || '').trim().toUpperCase();
  return Boolean(
    application.offerLetterUrl ||
    ['OFFER_SENT', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'JOINING_SCHEDULED', 'JOINED'].includes(
      placementStatus
    ) ||
    application.offerResponse === 'ACCEPTED' ||
    application.offerResponse === 'REJECTED' ||
    application.offerResponse === 'PENDING'
  );
}

function resolvePreOfferReachStage(
  application: ApplicationDetail
): (typeof PRE_OFFER_BASE_PIPELINE)[number] {
  if (isInPlacementOfferFlow(application)) return 'Interview';

  const code = String(application.statusCode || '').trim().toUpperCase();
  if (code === 'INTERVIEW' || code === 'SHORTLISTED' || code === 'ASSESSMENT') return 'Interview';
  if (hasInterviewEvidence(application) && ['SELECTED', 'FINAL_DECISION'].includes(code)) {
    return 'Interview';
  }
  if (code === 'UNDER_REVIEW') return 'Screening';

  const label = String(application.pipelineStage || application.status || '').trim();
  const n = normalizeStage(label);
  if (n.includes('interview')) return 'Interview';
  if (n.includes('screen') || n.includes('review') || n.includes('shortlist')) return 'Screening';

  return 'Applied';
}

function appendPostOfferSuccessStages(flow: string[], application: ApplicationDetail) {
  const placementStatus = String(application.placementStatus || '').trim().toUpperCase();
  flow.push('Offer Accepted');
  if (placementStatus === 'JOINING_SCHEDULED' || application.joiningDate) {
    flow.push('Joining Scheduled');
  }
  if (placementStatus === 'JOINED') {
    flow.push('Joined');
  }
}

/**
 * Build the visible pipeline for the four documented flows:
 * 1) Offer accepted  2) Offer rejected  3) Joined  4) Re-offer sent (accept or reject again)
 */
function buildApplicationPipelineFlow(application: ApplicationDetail): string[] {
  if (isApplicationRejectedOutcome(application) && !isInPlacementOfferFlow(application)) {
    const preOfferIdx = PRE_OFFER_BASE_PIPELINE.indexOf(resolvePreOfferReachStage(application));
    return [...PRE_OFFER_BASE_PIPELINE.slice(0, preOfferIdx + 1), 'Rejected'];
  }

  if (!isInPlacementOfferFlow(application)) {
    const preOfferIdx = PRE_OFFER_BASE_PIPELINE.indexOf(resolvePreOfferReachStage(application));
    return [...PRE_OFFER_BASE_PIPELINE.slice(0, preOfferIdx + 1)];
  }

  const flow: string[] = [...PRE_OFFER_BASE_PIPELINE];
  const placementStatus = String(application.placementStatus || '').trim().toUpperCase();
  const offerResponse = String(application.offerResponse || '').trim().toUpperCase();
  const resentPending = isOfferResentPending(application);
  const hasResent = hasOfferBeenResent(application);
  const accepted =
    offerResponse === 'ACCEPTED' || placementStatus === 'OFFER_ACCEPTED';
  const rejected =
    !resentPending &&
    (offerResponse === 'REJECTED' || placementStatus === 'OFFER_REJECTED');

  flow.push('Offer Sent');

  if (hasResent) {
    flow.push('Offer Rejected');
    flow.push('Offer Re-Sent');
    if (accepted) {
      appendPostOfferSuccessStages(flow, application);
    } else if (rejected) {
      flow.push('Offer Rejected');
    }
    return flow;
  }

  if (accepted) {
    appendPostOfferSuccessStages(flow, application);
    return flow;
  }

  if (rejected) {
    flow.push('Offer Rejected');
  }

  return flow;
}

function hasRespondedToOffer(application: ApplicationDetail): boolean {
  return resolveOfferResponseState(application) !== null;
}

function getStatusColor(status: string) {
  const value = (status || '').toLowerCase();
  if (value.includes('joined')) return 'text-green-700';
  if (value.includes('joining scheduled')) return 'text-amber-700';
  if (value.includes('offer accepted')) return 'text-blue-700';
  if (value.includes('offer re sent') || value.includes('offer resent')) return 'text-indigo-700';
  if (value.includes('offer sent')) return 'text-indigo-700';
  if (value.includes('offer rejected')) return 'text-red-600';
  if (value === 'offer' || (value.includes('offer') && !value.includes('offer '))) return 'text-violet-700';
  if (value.includes('selected')) return 'text-green-600';
  if (value.includes('shortlisted')) return 'text-purple-600';
  if (value.includes('screen') || value.includes('review')) return 'text-blue-600';
  if (value.includes('rejected')) return 'text-red-600';
  return 'text-gray-600';
}

function getStatusMessage(status: string) {
  const value = (status || '').toLowerCase();
  if (value.includes('joined')) return 'Congratulations! You have joined the organization.';
  if (value.includes('joining scheduled')) return 'Your joining date and reporting contact are listed below.';
  if (value.includes('offer accepted')) return 'You accepted the offer. Joining details will appear once scheduled.';
  if (value.includes('offer re sent') || value.includes('offer resent')) {
    return 'A revised offer letter is ready. Review and respond below.';
  }
  if (value.includes('offer sent')) return 'Your offer letter is ready. Review and respond below.';
  if (value.includes('offer rejected')) return 'You declined this offer.';
  if (value === 'offer' || (value.includes('offer') && !value.includes('offer '))) {
    return 'You have been selected. An offer is being prepared.';
  }
  if (value.includes('selected')) return 'Congratulations! Offer inbound';
  if (value.includes('shortlisted')) return 'Great progress! Interview stage';
  if (value.includes('interview')) return 'Use Interview details for time, format, and meeting link.';
  if (value.includes('screen')) return 'Your application is in the screening stage.';
  if (value.includes('review')) return 'Your application is being reviewed';
  if (value.includes('applied') || value.includes('submit')) return 'Your application has been received.';
  if (value.includes('rejected')) return 'Application not selected';
  return 'Application submitted';
}

const PRE_OFFER_BASE_PIPELINE = ['Applied', 'Screening', 'Interview'] as const;

const PLACEMENT_STATUS_LABELS: Record<string, string> = {
  OFFER_SENT: 'Offer Sent',
  OFFER_ACCEPTED: 'Offer Accepted',
  OFFER_REJECTED: 'Offer Rejected',
  JOINING_SCHEDULED: 'Joining Scheduled',
  JOINED: 'Joined',
};

const CANONICAL_STAGE_CARD: Record<
  string,
  { title: string; message: string; colorClass: string }
> = {
  Applied: {
    title: 'Applied',
    message: 'Your application has been received.',
    colorClass: 'text-gray-600',
  },
  Screening: {
    title: 'Screening',
    message: 'Your application is in the screening stage with the hiring team.',
    colorClass: 'text-blue-600',
  },
  Interview: {
    title: 'Interview',
    message: 'Use Interview details for time, format, and meeting link.',
    colorClass: 'text-sky-700',
  },
  Interviewing: {
    title: 'Interview',
    message: 'Use Interview details for time, format, and meeting link.',
    colorClass: 'text-sky-700',
  },
  'Offer Sent': {
    title: 'Offer Sent',
    message: 'Your offer letter is ready. Review and respond below.',
    colorClass: 'text-indigo-700',
  },
  'Offer Re-Sent': {
    title: 'Offer Re-Sent',
    message: 'A revised offer letter is ready. Review and respond below.',
    colorClass: 'text-indigo-700',
  },
  'Offer Accepted': {
    title: 'Offer Accepted',
    message: 'You accepted the offer. Joining details will appear once scheduled.',
    colorClass: 'text-blue-700',
  },
  'Offer Rejected': {
    title: 'Offer Rejected',
    message: 'You declined this offer.',
    colorClass: 'text-red-600',
  },
  'Joining Scheduled': {
    title: 'Joining Scheduled',
    message: 'Your joining date and reporting contact are listed below.',
    colorClass: 'text-amber-700',
  },
  Joined: {
    title: 'Joined',
    message: 'Congratulations! You have joined the organization.',
    colorClass: 'text-green-700',
  },
  Rejected: {
    title: 'Rejected',
    message: 'This application was not selected to move forward.',
    colorClass: 'text-red-600',
  },
};

/** @deprecated Use CANONICAL_STAGE_CARD */
const PLACEMENT_STAGE_CARD = CANONICAL_STAGE_CARD;

function isOfferRejectedApplication(application: ApplicationDetail): boolean {
  if (isOfferResentPending(application)) return false;
  return (
    application.offerResponse === 'REJECTED' ||
    String(application.placementStatus || '').toUpperCase() === 'OFFER_REJECTED'
  );
}

function isApplicationRejectedOutcome(application: ApplicationDetail): boolean {
  if (isInPlacementOfferFlow(application)) return false;

  const code = String(application.statusCode || '').trim().toUpperCase();
  if (['INTERVIEW', 'SHORTLISTED', 'ASSESSMENT', 'UNDER_REVIEW', 'SUBMITTED'].includes(code)) {
    return false;
  }

  const status = normalizeStage(application.status);
  return code === 'REJECTED' || (status.includes('reject') && !status.includes('offer'));
}

function resolveCanonicalCurrentStage(application: ApplicationDetail): string {
  const placementLabel = resolvePlacementStageLabel(application);
  if (placementLabel) return placementLabel;

  const placementStatus = String(application.placementStatus || '').trim().toUpperCase();
  if (placementStatus === 'JOINED') return 'Joined';
  if (placementStatus === 'JOINING_SCHEDULED' || application.joiningDate) {
    return 'Joining Scheduled';
  }

  if (isApplicationRejectedOutcome(application) && !isInPlacementOfferFlow(application)) {
    return 'Rejected';
  }

  return resolvePreOfferReachStage(application);
}

function resolveCanonicalPipelineIndex(
  flow: string[],
  application: ApplicationDetail,
): number {
  if (!flow.length || !application) return -1;

  const current = resolveCanonicalCurrentStage(application);
  let lastExact = -1;
  let lastFuzzy = -1;

  for (let i = 0; i < flow.length; i++) {
    if (normalizeStage(flow[i]) === normalizeStage(current)) lastExact = i;
    if (pipelineStagesEquivalent(flow[i], current)) lastFuzzy = i;
  }

  if (lastExact >= 0) return lastExact;
  if (lastFuzzy >= 0) return lastFuzzy;

  const preOfferStage = resolvePreOfferReachStage(application);
  const preOfferIdx = flow.findIndex((stage) => pipelineStagesEquivalent(stage, preOfferStage));
  if (preOfferIdx >= 0) return preOfferIdx;

  return 0;
}

function formatInterviewPillLabel(
  pillIndex: number,
  flow: string[],
  rounds: InterviewRoundPayload[]
): string {
  const stepIdx = interviewPipelineStepIndex(flow, pillIndex);
  const round = rounds[stepIdx] ?? rounds[rounds.length - 1];
  const typeLabel = resolveInterviewTypeLabel(round ?? null);
  const roundLabel =
    typeLabel ||
    (stepIdx === 0 ? 'round one' : `round ${stepIdx + 1}`);
  return `Interview — ${roundLabel}`;
}

function roundHasFeedbackDetails(round: InterviewRoundPayload | null | undefined): boolean {
  if (!round) return false;
  if (round.isCompleted && (round.recommendationLabel || round.outcome)) return true;
  if (round.recommendationLabel) return true;
  if (
    round.technicalScore != null ||
    round.communicationScore != null ||
    round.problemSolvingScore != null ||
    round.cultureFitScore != null ||
    round.experienceMatchScore != null ||
    round.overallRating != null
  ) {
    return true;
  }
  return Boolean(round.strengths?.trim() || round.weaknesses?.trim());
}

function mergeInterviewRoundWithFeedback(
  base: InterviewRoundPayload,
  feedback: InterviewRoundPayload
): InterviewRoundPayload {
  return {
    ...base,
    isCompleted: feedback.isCompleted ?? base.isCompleted ?? true,
    outcome: feedback.outcome ?? base.outcome ?? null,
    recommendationLabel: feedback.recommendationLabel ?? base.recommendationLabel ?? null,
    remark: feedback.remark ?? base.remark ?? null,
    comments: feedback.comments ?? feedback.remark ?? base.comments ?? base.remark ?? null,
    companyName: feedback.companyName ?? base.companyName ?? null,
    technicalScore: feedback.technicalScore ?? base.technicalScore ?? null,
    communicationScore: feedback.communicationScore ?? base.communicationScore ?? null,
    problemSolvingScore: feedback.problemSolvingScore ?? base.problemSolvingScore ?? null,
    cultureFitScore: feedback.cultureFitScore ?? base.cultureFitScore ?? null,
    experienceMatchScore: feedback.experienceMatchScore ?? base.experienceMatchScore ?? null,
    overallRating: feedback.overallRating ?? base.overallRating ?? null,
    strengths: feedback.strengths ?? base.strengths ?? null,
    weaknesses: feedback.weaknesses ?? base.weaknesses ?? null,
    completedAt: feedback.completedAt ?? base.completedAt ?? null,
  };
}

function resolveInterviewRoundForPipelinePill(
  stepIdx: number,
  rounds: InterviewRoundPayload[]
): InterviewRoundPayload | null {
  if (!rounds.length) return null;

  const direct = rounds[stepIdx] ?? rounds[rounds.length - 1];
  if (roundHasFeedbackDetails(direct)) return direct;

  const completedRounds = rounds.filter((round) => roundHasFeedbackDetails(round));
  if (!completedRounds.length) return direct;

  const byIndex = completedRounds[stepIdx] ?? completedRounds[completedRounds.length - 1];
  if (direct && !direct.isCompleted) {
    return mergeInterviewRoundWithFeedback(direct, byIndex);
  }
  return byIndex;
}

function reconcileInterviewRoundsClient(rounds: InterviewRoundPayload[]): InterviewRoundPayload[] {
  if (rounds.length <= 1) return rounds;

  const scheduled = rounds.filter((round) => !round.isCompleted);
  const completed = rounds.filter((round) => roundHasFeedbackDetails(round));
  if (!completed.length) return rounds;

  if (!scheduled.length) {
    const sorted = [...completed].sort(
      (a, b) => interviewRoundFeedbackRichness(b) - interviewRoundFeedbackRichness(a)
    );
    let merged = { ...sorted[0] };
    for (let index = 1; index < sorted.length; index += 1) {
      merged = mergeInterviewRoundWithFeedback(merged, sorted[index]);
    }
    return [merged];
  }

  const merged = scheduled.map((sched, index) => {
    const labelMatch = completed.find((comp) =>
      interviewRoundLabelsEquivalent(sched.roundLabel, comp.roundLabel)
    );
    const source = pickRichestInterviewRound([labelMatch, completed[index], ...completed]);
    return source && !roundHasFeedbackDetails(sched)
      ? mergeInterviewRoundWithFeedback(sched, source)
      : sched;
  });

  completed.forEach((comp, index) => {
    if (index >= scheduled.length) merged.push(comp);
  });

  return merged.sort(
    (a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
  );
}

function interviewRoundFeedbackRichness(round: InterviewRoundPayload = {} as InterviewRoundPayload): number {
  let score = 0;
  if (round.technicalScore != null) score += 12;
  if (round.communicationScore != null) score += 8;
  if (round.problemSolvingScore != null) score += 8;
  if (round.cultureFitScore != null) score += 8;
  if (round.experienceMatchScore != null) score += 8;
  if (round.overallRating != null) score += 6;
  if (round.strengths) score += 5;
  if (round.weaknesses) score += 5;
  if (round.recommendationLabel || round.outcome) score += 3;
  if (round.comments || round.remark) score += 2;
  return score;
}

function pickRichestInterviewRound(
  candidates: Array<InterviewRoundPayload | null | undefined>
): InterviewRoundPayload | null {
  const list = candidates.filter(Boolean) as InterviewRoundPayload[];
  if (!list.length) return null;
  return [...list].sort(
    (a, b) => interviewRoundFeedbackRichness(b) - interviewRoundFeedbackRichness(a)
  )[0];
}

function interviewRoundLabelsEquivalent(a: string | null | undefined, b: string | null | undefined): boolean {
  const left = String(a || '').trim().toLowerCase();
  const right = String(b || '').trim().toLowerCase();
  if (!left || !right) return false;
  return left === right || left.includes(right) || right.includes(left);
}

function isInterviewRoundCompleted(round: InterviewRoundPayload): boolean {
  return Boolean(round.isCompleted || roundHasFeedbackDetails(round));
}

function resolveInterviewRoundTypeLabel(
  round: InterviewRoundPayload,
  index: number,
  total: number
): string {
  const fromRound = round.roundLabel?.trim();
  const fromTitle = round.timelineTitle?.trim();
  const titleIsGeneric =
    !fromTitle || /^interview(ing)?$/i.test(fromTitle) || /^interview completed/i.test(fromTitle);

  if (fromRound) return fromRound;
  if (fromTitle && !titleIsGeneric) return fromTitle;
  return total > 1 ? `Round ${index + 1}` : 'round one';
}

function formatInterviewOutcomeDisplay(round: InterviewRoundPayload): string | null {
  if (round.recommendationLabel?.trim()) return round.recommendationLabel.trim();
  const outcome = String(round.outcome || '').trim();
  if (!outcome) return null;
  const key = outcome.toLowerCase();
  if (key === 'failed' || key === 'fail' || key === 'reject') return 'Reject';
  if (key === 'pass') return 'Pass';
  if (key === 'on hold' || key === 'hold') return 'Hold';
  return outcome;
}

function interviewOutcomeBadgeClass(label: string | null | undefined): string {
  const value = String(label || '').trim().toLowerCase();
  if (value === 'pass') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (value === 'reject' || value === 'failed' || value === 'fail') {
    return 'border-red-200 bg-red-50 text-red-800';
  }
  return 'border-amber-200 bg-amber-50 text-amber-800';
}

function buildInterviewFeedbackModalPayload(
  round: InterviewRoundPayload,
  application: ApplicationDetail
): InterviewFeedbackModalPayload {
  return {
    companyName: round.companyName || application.job.company || 'Recruiter',
    roundLabel: round.roundLabel || round.timelineTitle || 'Interview',
    submittedAt: round.completedAt || round.scheduledAt || new Date().toISOString(),
    recommendationLabel:
      round.recommendationLabel ||
      (String(round.outcome || '').toLowerCase() === 'failed' ? 'Reject' : round.outcome || 'Hold'),
    technicalScore: round.technicalScore ?? null,
    communicationScore: round.communicationScore ?? null,
    problemSolvingScore: round.problemSolvingScore ?? null,
    cultureFitScore: round.cultureFitScore ?? null,
    experienceMatchScore: round.experienceMatchScore ?? null,
    overallRating: round.overallRating ?? null,
    strengths: round.strengths ?? null,
    weaknesses: round.weaknesses ?? null,
    comments: round.comments || round.remark || null,
  };
}

function recommendationBadgeClass(label: string): string {
  const value = String(label || '').trim().toLowerCase();
  if (value === 'pass') return 'bg-emerald-100 text-emerald-800 border-emerald-200';
  if (value === 'reject' || value === 'failed') return 'bg-red-100 text-red-800 border-red-200';
  return 'bg-amber-100 text-amber-800 border-amber-200';
}

function formatFeedbackSubmittedAt(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function FeedbackScoreStars({ score }: { score: number | null | undefined }) {
  const value =
    score != null && !Number.isNaN(Number(score))
      ? Math.max(0, Math.min(5, Math.round(Number(score))))
      : 0;
  return (
    <div className="flex items-center gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={index}
          className={`h-3.5 w-3.5 ${index < value ? 'text-amber-400' : 'text-gray-300'}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.967a1 1 0 00.95.69h4.178c.969 0 1.371 1.24.588 1.81l-3.385 2.46a1 1 0 00-.364 1.118l1.287 3.966c.3.922-.755 1.688-1.538 1.118l-3.385-2.46a1 1 0 00-1.176 0l-3.385 2.46c-.783.57-1.838-.196-1.538-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.047 9.394c-.783-.57-.38-1.81.588-1.81h4.178a1 1 0 00.95-.69l1.286-3.967z" />
        </svg>
      ))}
    </div>
  );
}

function formatCanonicalPipelinePillLabel(
  stage: string,
  pillIndex: number,
  flow: string[],
  rounds: InterviewRoundPayload[],
  application: ApplicationDetail
): string {
  if (normalizeStage(stage) === 'rejected') {
    return 'Rejected';
  }
  if (isInterviewPipelineStageName(stage)) {
    return formatInterviewPillLabel(pillIndex, flow, rounds);
  }
  return stage;
}

function resolveCanonicalStagePresentation(application: ApplicationDetail) {
  const current = resolveCanonicalCurrentStage(application);
  return CANONICAL_STAGE_CARD[current] || {
    title: current,
    message: getStatusMessage(current),
    colorClass: getStatusColor(current),
  };
}

function mapPlacementStatusToLabel(status: string | null | undefined): string | null {
  const key = String(status || '').trim().toUpperCase();
  return PLACEMENT_STATUS_LABELS[key] || null;
}

function resolvePlacementStageLabel(application: ApplicationDetail): string | null {
  if (!isInPlacementOfferFlow(application)) return null;
  if (isOfferResentPending(application)) return 'Offer Re-Sent';

  const fromStatus = mapPlacementStatusToLabel(application.placementStatus);
  if (fromStatus) return fromStatus;

  if (application.offerLetterUrl) {
    if (application.offerResponse === 'ACCEPTED') return 'Offer Accepted';
    if (application.offerResponse === 'REJECTED') return 'Offer Rejected';
    return 'Offer Sent';
  }
  return null;
}

/** Prefer raw portal enum from API so the hero card never shows a stale recruiter match label (e.g. Under Review). */
const PORTAL_STAGE_CARD: Record<
  string,
  { title: string; message: string; colorClass: string }
> = {
  SUBMITTED: {
    title: 'Applied',
    message: 'Your application has been received.',
    colorClass: 'text-gray-600',
  },
  UNDER_REVIEW: {
    title: 'Screening',
    message: 'Your application is in the screening stage with the hiring team.',
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

function parseRejectionDescriptionText(description: string | null | undefined) {
  const text = String(description || '').trim();
  if (!text) return { reason: null as string | null, feedback: null as string | null };

  const reasonLine = text.split(/\r?\n/).find((line) => /^reason\s*:/i.test(line.trim()));
  const feedbackLine = text.split(/\r?\n/).find((line) => /^feedback\s*:/i.test(line.trim()));

  if (reasonLine || feedbackLine) {
    return {
      reason: reasonLine ? reasonLine.replace(/^reason\s*:/i, '').trim() || null : null,
      feedback: feedbackLine ? feedbackLine.replace(/^feedback\s*:/i, '').trim() || null : null,
    };
  }

  const legacyParts = text.split(' — ').map((part) => part.trim()).filter(Boolean);
  if (legacyParts.length >= 2) {
    return {
      reason: legacyParts[0] || null,
      feedback: legacyParts.slice(1).join(' — ') || null,
    };
  }

  return { reason: null, feedback: text };
}

function resolveApplicationRejectionDetails(
  application: ApplicationDetail
): ApplicationDetail['rejectionDetails'] {
  if (application.rejectionDetails?.reason || application.rejectionDetails?.feedback) {
    return application.rejectionDetails;
  }

  const rejectedRow = [...(application.timeline || [])]
    .filter((row) => isRejectedTimelineRow(row))
    .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];

  if (!rejectedRow) return null;

  const parsed = parseRejectionDescriptionText(rejectedRow.description);
  if (!parsed.reason && !parsed.feedback) return null;

  return {
    reason: parsed.reason,
    feedback: parsed.feedback,
    sharedAt: rejectedRow.occurredAt,
    title: rejectedRow.title || 'Not selected',
  };
}

function buildRejectionStatusMessage(
  rejectionDetails: NonNullable<ApplicationDetail['rejectionDetails']>
): string {
  if (rejectionDetails.reason && rejectionDetails.feedback) {
    return `Reason: ${rejectionDetails.reason}. ${rejectionDetails.feedback}`;
  }
  if (rejectionDetails.reason) {
    return `Reason: ${rejectionDetails.reason}`;
  }
  if (rejectionDetails.feedback) {
    return rejectionDetails.feedback;
  }
  return 'This application was not selected to move forward.';
}

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

function isEarlyPipelineStageLabel(value: string) {
  const n = normalizeStage(value);
  return !n || n.includes('applied') || n.includes('submit');
}

/** Prefer CRM-synced status when portal pipeline entry is still on Applied/Submitted. */
function resolveEffectiveStageLabel(application: ApplicationDetail) {
  return resolveCanonicalCurrentStage(application);
}

function dedupePipelineStageFlow(stages: string[]) {
  const result: string[] = [];
  for (const stage of stages) {
    const trimmed = String(stage || '').trim();
    if (!trimmed) continue;
    if (result.some((existing) => pipelineStagesEquivalent(existing, trimmed))) continue;
    result.push(trimmed);
  }
  return result;
}

/** Match CRM pipeline pill names to portal status / pipelineStage labels. */
function pipelineStagesEquivalent(stageA: string, stageB: string) {
  const a = normalizeStage(stageA);
  const b = normalizeStage(stageB);
  if (!a || !b) return false;
  if (a === b) return true;
  if (
    (a.includes('applied') || a.includes('submit')) &&
    (b.includes('applied') || b.includes('submit'))
  ) {
    return true;
  }
  if (
    (a.includes('screen') || a.includes('review') || a.includes('assessment')) &&
    (b.includes('screen') || b.includes('review') || b.includes('assessment'))
  ) {
    return true;
  }
  if (a.includes('interview') && b.includes('interview')) return true;
  const aIsReSent = a.includes('offer re sent') || a.includes('offer resent');
  const bIsReSent = b.includes('offer re sent') || b.includes('offer resent');
  if (aIsReSent && bIsReSent) return true;
  const aIsOfferSent = a.includes('offer sent') && !aIsReSent;
  const bIsOfferSent = b.includes('offer sent') && !bIsReSent;
  if (aIsOfferSent && bIsOfferSent) return true;
  if (a.includes('offer accepted') && b.includes('offer accepted')) return true;
  if (a.includes('offer rejected') && b.includes('offer rejected')) return true;
  if (a.includes('joining scheduled') && b.includes('joining scheduled')) return true;
  if ((a === 'joined' || a.includes('joined')) && (b === 'joined' || b.includes('joined'))) return true;
  if (a.includes('hired/rejected') && b.includes('hired/rejected')) return true;
  if (
    (a === 'offer' || a.includes('selected') || a.includes('final decision')) &&
    (b === 'offer' || b.includes('selected') || b.includes('final decision')) &&
    !a.includes('offer sent') &&
    !a.includes('offer accepted') &&
    !a.includes('offer rejected') &&
    !b.includes('offer sent') &&
    !b.includes('offer accepted') &&
    !b.includes('offer rejected')
  ) {
    return true;
  }
  if (
    (a.includes('hire') || a.includes('placed')) &&
    (b.includes('hire') || b.includes('placed')) &&
    !a.includes('hired/rejected') &&
    !b.includes('hired/rejected')
  ) {
    return true;
  }
  if (
    a.includes('reject') &&
    b.includes('reject') &&
    !a.includes('offer') &&
    !b.includes('offer')
  ) {
    return true;
  }
  return false;
}

function resolveCurrentPipelineIndex(
  flow: string[],
  application: ApplicationDetail,
): number {
  return resolveCanonicalPipelineIndex(flow, application);
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
    n.includes('joining scheduled') ||
    n === 'joined' ||
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
  return blob.includes('reject') || blob.includes('not selected');
}

type RejectionModalPayload = {
  title: string;
  occurredAt: string;
  reason: string | null;
  feedback: string | null;
};

function buildRejectionPayloadFromRow(row: ApplicationDetail['timeline'][number]): RejectionModalPayload {
  const parsed = parseRejectionDescriptionText(row.description);
  return {
    title: row.title || 'Application update',
    occurredAt: row.occurredAt,
    reason: parsed.reason,
    feedback:
      parsed.feedback ||
      (!parsed.reason ? String(row.description || '').trim() || null : null),
  };
}

function buildRejectionPayloadFromDetails(
  details: NonNullable<ApplicationDetail['rejectionDetails']>
): RejectionModalPayload {
  return {
    title: details.title || 'Not selected',
    occurredAt: details.sharedAt || new Date().toISOString(),
    reason: details.reason,
    feedback: details.feedback,
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
  const [interviewFeedbackModalOpen, setInterviewFeedbackModalOpen] = useState(false);
  const [interviewFeedbackPayload, setInterviewFeedbackPayload] =
    useState<InterviewFeedbackModalPayload | null>(null);
  const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
  const [rejectionModalPayload, setRejectionModalPayload] = useState<RejectionModalPayload | null>(null);
  const [candidateId, setCandidateId] = useState<string | null>(null);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);
  const [offerResponding, setOfferResponding] = useState(false);
  const [offerRejectModalOpen, setOfferRejectModalOpen] = useState(false);
  const [offerRejectRemark, setOfferRejectRemark] = useState('');

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
    let rounds: InterviewRoundPayload[] = [];
    if (Array.isArray(application.interviewRounds) && application.interviewRounds.length > 0) {
      rounds = application.interviewRounds;
    } else {
      const rows = [...(application.timeline || [])].sort(
        (a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
      );
      rounds = rows
        .filter((row) => isInterviewTimelineRow(row))
        .map((row) => ({
          timelineId: row.id,
          ...buildInterviewDetailsFromTimelineRow(row),
        }));
    }

    return reconcileInterviewRoundsClient(rounds);
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
    return buildApplicationPipelineFlow(application);
  }, [application]);
  const currentPipelineIndex = useMemo(() => {
    if (!application || pipelineStageFlow.length === 0) return -1;
    return resolveCurrentPipelineIndex(pipelineStageFlow, application);
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

  const rejectionDetails = useMemo(
    () => (application ? resolveApplicationRejectionDetails(application) : null),
    [application]
  );

  const stagePresentation = useMemo(() => {
    if (!application) {
      return { title: '', message: '', colorClass: 'text-gray-600' };
    }

    const canonical = resolveCanonicalStagePresentation(application);
    if (canonical.title) {
      if (
        isApplicationRejectedOutcome(application) &&
        rejectionDetails &&
        (rejectionDetails.reason || rejectionDetails.feedback)
      ) {
        return {
          ...canonical,
          message: buildRejectionStatusMessage(rejectionDetails),
        };
      }
      return canonical;
    }

    const code = String(application.statusCode || '').trim().toUpperCase();
    const effectiveLabel = resolveEffectiveStageLabel(application);
    if (effectiveLabel) {
      const card = code && PORTAL_STAGE_CARD[code] ? PORTAL_STAGE_CARD[code] : null;
      return {
        title: effectiveLabel,
        message: card?.message || getStatusMessage(effectiveLabel),
        colorClass: card?.colorClass || getStatusColor(effectiveLabel),
      };
    }
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
  }, [application, showInterviewDetailsButton, rejectionDetails]);

  const currentPipelineStageLabel = useMemo(() => {
    if (!application) return '';

    const current = resolveCanonicalCurrentStage(application);
    if (current === 'Interview' && interviewRoundsStack.length > 0) {
      const activeRound =
        interviewRoundsStack[interviewRoundsStack.length - 1] ?? interviewRoundsStack[0];
      const typeLabel = resolveInterviewTypeLabel(activeRound);
      const roundLabel =
        typeLabel ||
        (interviewRoundsStack.length === 1 ? 'round one' : `round ${interviewRoundsStack.length}`);
      return `Interview — ${roundLabel}`;
    }
    return current;
  }, [application, interviewRoundsStack]);

  useEffect(() => {
    if (!interviewModalOpen && !interviewFeedbackModalOpen && !rejectionModalOpen && !withdrawConfirmOpen && !offerRejectModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setInterviewModalOpen(false);
      setInterviewModalPayload(null);
      setInterviewFeedbackModalOpen(false);
      setInterviewFeedbackPayload(null);
      setRejectionModalOpen(false);
      setRejectionModalPayload(null);
      setWithdrawConfirmOpen(false);
      setOfferRejectModalOpen(false);
      setOfferRejectRemark('');
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [interviewModalOpen, interviewFeedbackModalOpen, rejectionModalOpen, withdrawConfirmOpen, offerRejectModalOpen]);

  const closeInterviewModal = () => {
    setInterviewModalOpen(false);
    setInterviewModalPayload(null);
  };

  const closeInterviewFeedbackModal = () => {
    setInterviewFeedbackModalOpen(false);
    setInterviewFeedbackPayload(null);
  };

  const openInterviewFromPipelinePill = (pillIndex: number) => {
    if (!application) return;
    const stepIdx = interviewPipelineStepIndex(pipelineStageFlow, pillIndex);
    const linkedRound = resolveInterviewRoundForPipelinePill(stepIdx, interviewRoundsStack);
    if (!linkedRound) return;
    if (roundHasFeedbackDetails(linkedRound)) {
      setInterviewFeedbackPayload(buildInterviewFeedbackModalPayload(linkedRound, application));
      setInterviewFeedbackModalOpen(true);
      return;
    }
    setInterviewModalPayload(linkedRound);
    setInterviewModalOpen(true);
  };

  const closeRejectionModal = () => {
    setRejectionModalOpen(false);
    setRejectionModalPayload(null);
  };

  const openRejectionDetails = () => {
    if (!application) return;
    const details = resolveApplicationRejectionDetails(application);
    if (details) {
      setRejectionModalPayload(buildRejectionPayloadFromDetails(details));
      setRejectionModalOpen(true);
      return;
    }
    const rejectedRow = [...(application.timeline || [])]
      .filter((row) => isRejectedTimelineRow(row))
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime())[0];
    if (rejectedRow) {
      setRejectionModalPayload(buildRejectionPayloadFromRow(rejectedRow));
      setRejectionModalOpen(true);
    }
  };

  const closeWithdrawConfirm = () => {
    if (withdrawing) return;
    setWithdrawConfirmOpen(false);
  };

  const reloadApplication = async () => {
    if (!applicationId) return;
    const response = await fetch(`${API_BASE_URL}/applications/detail/${encodeURIComponent(applicationId)}`);
    const result = await response.json();
    if (response.ok && result?.success && result?.data) {
      setApplication(result.data as ApplicationDetail);
    }
  };

  const respondToOffer = async (decision: 'accept' | 'reject', remark?: string) => {
    if (!application || !candidateId) {
      showErrorToast('Sign in required', 'Please log in as the candidate to respond to the offer.');
      return;
    }
    if (hasRespondedToOffer(application)) {
      setOfferRejectModalOpen(false);
      setOfferRejectRemark('');
      return;
    }
    if (application.candidateId && application.candidateId !== candidateId) {
      showErrorToast('Not allowed', 'This offer belongs to another account.');
      return;
    }
    if (decision === 'reject') {
      const trimmedRemark = String(remark || '').trim();
      if (!trimmedRemark) {
        showErrorToast('Remark required', 'Please share a brief reason for declining the offer.');
        return;
      }
    }
    setOfferResponding(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/applications/detail/${encodeURIComponent(applicationId)}/offer-response`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            candidateId,
            decision,
            ...(decision === 'reject' ? { remark: String(remark || '').trim() } : {}),
          }),
        }
      );
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        const message = typeof result?.message === 'string' ? result.message : 'Could not submit your response';
        if (message.toLowerCase().includes('already responded')) {
          setOfferRejectModalOpen(false);
          setOfferRejectRemark('');
          setApplication((prev) =>
            prev
              ? {
                  ...prev,
                  offerResponse: prev.offerResponse || 'REJECTED',
                  placementStatus: prev.placementStatus || 'OFFER_REJECTED',
                }
              : prev
          );
          await reloadApplication();
          showSuccessToast('Offer declined', 'Your response was already recorded.');
          return;
        }
        throw new Error(message);
      }

      const respondedAt = new Date().toISOString();
      setApplication((prev) =>
        prev
          ? {
              ...prev,
              offerResponse: decision === 'accept' ? 'ACCEPTED' : 'REJECTED',
              placementStatus: decision === 'accept' ? 'OFFER_ACCEPTED' : 'OFFER_REJECTED',
              offerRespondedAt: respondedAt,
              ...(decision === 'reject' && remark
                ? { offerRejectionRemark: String(remark).trim() }
                : {}),
            }
          : prev
      );
      showSuccessToast(
        decision === 'accept' ? 'Offer accepted' : 'Offer declined',
        decision === 'accept'
          ? 'The recruiter has been notified. Joining details will appear here once scheduled.'
          : 'The recruiter has been notified of your decision.'
      );
      setOfferRejectModalOpen(false);
      setOfferRejectRemark('');
      await reloadApplication();
    } catch (err: unknown) {
      showErrorToast(
        'Response failed',
        err instanceof Error ? err.message : 'Could not submit your response'
      );
    } finally {
      setOfferResponding(false);
    }
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
      showSuccessToast('Application withdrawn', 'You can apply again from Jobseeker.');
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
    <ProfilePageShell>
      <main className="profile-page-typography application-detail-page mx-auto max-w-[1180px] px-4 pb-7 pt-2 sm:px-5 sm:pt-3 sm:pb-8 lg:px-6 lg:py-5">
        <button
          type="button"
          onClick={() => router.back()}
          className="application-detail-helper mb-4 flex items-center gap-2 transition-colors hover:text-[#111827]"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
          Back to Applications
        </button>

        {loading ? (
          <div className="rounded-2xl border border-gray-100 bg-white px-4 py-3.5 text-[0.8125rem] text-[#64748b] lg:px-[18px]">
            Loading application details...
          </div>
        ) : error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3.5 text-[0.8125rem] text-rose-700 lg:px-[18px]">
            {error}
          </div>
        ) : application ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-4">
            <div className="space-y-4 lg:col-span-2">
              <ApplicationDetailSectionCard bare>
                <h1 className="application-detail-title mb-1.5">{application.job.title}</h1>
                <div className="application-detail-meta mb-3 flex flex-wrap items-center gap-2">
                  <span>{application.job.company}</span>
                  <span aria-hidden>•</span>
                  <span>{application.job.location}</span>
                </div>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className={`application-detail-status mb-1 ${stagePresentation.colorClass}`}>
                      {stagePresentation.title}
                    </p>
                    <p className="application-detail-helper">{stagePresentation.message}</p>
                  </div>
                  {isApplicationRejectedOutcome(application) && rejectionDetails ? (
                    <button
                      type="button"
                      onClick={openRejectionDetails}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-[0.8125rem] font-medium text-rose-900 shadow-sm hover:bg-rose-50"
                    >
                      Why not selected?
                    </button>
                  ) : showInterviewDetailsButton && effectiveInterviewDetails && interviewRoundsStack.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => router.push(`/interviews/${encodeURIComponent(applicationId)}`)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-[#28A8E1] bg-[#28A8E1] px-3.5 py-2 text-[0.8125rem] font-medium text-white shadow-sm transition hover:opacity-95"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                        <rect width="18" height="18" x="3" y="4" rx="2" />
                        <path d="M3 10h18" />
                        <path d="M8 2v4M16 2v4" />
                      </svg>
                      Interview details
                    </button>
                  ) : interviewRoundsStack.length > 0 ? (
                    <p className="application-detail-helper max-w-xs shrink-0 text-right">
                      {interviewRoundsStack.length === 1
                        ? 'Interview details are in the section below.'
                        : `${interviewRoundsStack.length} interview rounds — open each card below for links and times.`}
                    </p>
                  ) : null}
                </div>
              </ApplicationDetailSectionCard>

              {isApplicationRejectedOutcome(application) && rejectionDetails ? (
                <ApplicationDetailSectionCard title="Why you weren't selected" className="border-rose-100">
                  <p className="application-detail-helper mb-3">
                    Your recruiter shared the reason this application did not move forward.
                  </p>
                  <div className="space-y-3">
                    {rejectionDetails.reason ? (
                      <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-3.5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">
                          Reason
                        </p>
                        <p className="mt-2 text-sm text-gray-900">{rejectionDetails.reason}</p>
                      </div>
                    ) : null}
                    {rejectionDetails.feedback ? (
                      <div className="rounded-xl border border-rose-100 bg-rose-50/80 px-3.5 py-3">
                        <p className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">
                          Feedback
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-900">
                          {rejectionDetails.feedback}
                        </p>
                      </div>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    onClick={openRejectionDetails}
                    className="mt-3 inline-flex items-center justify-center rounded-lg border border-rose-300 bg-white px-3.5 py-2 text-[0.8125rem] font-medium text-rose-900 shadow-sm hover:bg-rose-50"
                  >
                    View full details
                  </button>
                </ApplicationDetailSectionCard>
              ) : null}

              <ApplicationDetailSectionCard title="Pipeline Stage">
                {pipelineStageFlow.length > 0 ? (
                  <div className="space-y-3">
                    <p className="application-detail-helper">
                      Current stage:{' '}
                      <span className="font-semibold text-[#111827]">{currentPipelineStageLabel}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {pipelineStageFlow.map((stage, index) => {
                        const pillLabel = formatCanonicalPipelinePillLabel(
                          stage,
                          index,
                          pipelineStageFlow,
                          interviewRoundsStack,
                          application
                        );
                        const isCurrent = currentPipelineIndex === index;
                        const isPast = currentPipelineIndex >= 0 && index < currentPipelineIndex;
                        const isInterviewPill = isInterviewPipelineStageName(stage);
                        const linkedRoundIndex = isInterviewPill
                          ? interviewPipelineStepIndex(pipelineStageFlow, index)
                          : -1;
                        const linkedRound =
                          linkedRoundIndex >= 0
                            ? resolveInterviewRoundForPipelinePill(linkedRoundIndex, interviewRoundsStack)
                            : null;
                        const pillHasFeedback = roundHasFeedbackDetails(linkedRound);
                        const PillTag = isInterviewPill ? 'button' : 'span';
                        return (
                          <div key={`${stage}-${index}`} className="flex items-center gap-2">
                            <PillTag
                              type={isInterviewPill ? 'button' : undefined}
                              onClick={
                                isInterviewPill ? () => openInterviewFromPipelinePill(index) : undefined
                              }
                              className={`application-pipeline-pill rounded-xl border px-2.5 py-1.5 text-left text-[0.75rem] font-semibold leading-snug whitespace-normal max-w-[min(100%,18rem)] sm:max-w-88 ${
                                isCurrent
                                  ? 'application-pipeline-pill--current border-[#fdba74] bg-[#ffedd5] text-[#c2410c]'
                                  : isPast
                                    ? 'application-pipeline-pill--past border-[#93c5fd] bg-[#dbeafe] text-[#1d4ed8]'
                                    : 'application-pipeline-pill--future border-gray-200 bg-white text-gray-500'
                              } ${isInterviewPill ? 'cursor-pointer transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#28A8E1]/40' : ''}`}
                              title={
                                isInterviewPill
                                  ? pillHasFeedback
                                    ? `${pillLabel} — view interview feedback`
                                    : `${pillLabel} — view interview details`
                                  : pillLabel
                              }
                            >
                              {pillLabel}
                            </PillTag>
                            {index < pipelineStageFlow.length - 1 ? (
                              <span className="text-[#cbd5e1] text-[0.75rem]">→</span>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <p className="profile-page-empty">Pipeline stages are not available yet.</p>
                )}
              </ApplicationDetailSectionCard>

              {interviewRoundsStack.length > 0 ? (
                <ApplicationDetailSectionCard
                  title={
                    interviewRoundsStack.some((round) => isInterviewRoundCompleted(round))
                      ? 'Interviews'
                      : 'Scheduled interviews'
                  }
                >
                  <p className="application-detail-helper mb-3">
                    {interviewRoundsStack.some((round) => isInterviewRoundCompleted(round))
                      ? 'Completed rounds show the recruiter outcome. Open a card to view full feedback or scheduled details.'
                      : 'Each round is listed in order (latest scheduling at the bottom). Open a card for meeting link, time, and format.'}
                  </p>
                  <div className="flex flex-col gap-3">
                    {interviewRoundsStack.map((round, index) => {
                      const completed = isInterviewRoundCompleted(round);
                      const when = formatDateTime(
                        completed && round.completedAt ? round.completedAt : round.scheduledAt
                      );
                      const roundTypeLabel = resolveInterviewRoundTypeLabel(
                        round,
                        index,
                        interviewRoundsStack.length
                      );
                      const outcomeLabel = completed ? formatInterviewOutcomeDisplay(round) : null;
                      const headline = completed ? 'Interview completed' : roundTypeLabel;
                      const sub = completed ? roundTypeLabel : null;
                      const cardTone = completed
                        ? 'border-slate-200/90 bg-linear-to-br from-slate-50 to-white'
                        : 'border-emerald-200/90 bg-linear-to-br from-emerald-50 to-white';
                      const roundTone = completed ? 'text-slate-700' : 'text-emerald-800';
                      const buttonTone = completed
                        ? 'border-slate-300/60 text-slate-800 hover:bg-slate-50'
                        : 'border-emerald-600/40 text-emerald-900 hover:bg-emerald-50';
                      return (
                        <div
                          key={round.timelineId || `round-${index}-${round.scheduledAt}`}
                          className={`flex flex-col gap-3 rounded-xl border p-3.5 shadow-sm sm:flex-row sm:items-start sm:justify-between ${cardTone}`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className={`text-[0.75rem] font-semibold uppercase tracking-wide ${roundTone}`}>
                              Round {index + 1}
                              {interviewRoundsStack.length > 1 ? ` of ${interviewRoundsStack.length}` : ''}
                              {completed ? ' · Completed' : ''}
                            </p>
                            <h3 className="profile-page-section-title mt-0.5">{headline}</h3>
                            {sub ? <p className="application-detail-helper mt-0.5">{sub}</p> : null}
                            <p className="profile-page-value mt-2">
                              {completed ? 'Completed' : 'Scheduled'} {when.date} · {when.time}
                            </p>
                            {!completed && round.format ? (
                              <p className="application-detail-helper mt-1">Format: {round.format}</p>
                            ) : null}
                            {!completed &&
                            Array.isArray(round.interviewerNames) &&
                            round.interviewerNames.length > 0 ? (
                              <p className="application-detail-helper mt-1">
                                Interviewer{round.interviewerNames.length > 1 ? 's' : ''}:{' '}
                                {round.interviewerNames.join(', ')}
                              </p>
                            ) : null}
                            {!completed && round.recruiterName ? (
                              <p className="application-detail-helper mt-1">
                                Recruiter: {round.recruiterName}
                              </p>
                            ) : null}
                            {completed && outcomeLabel ? (
                              <p className="profile-page-value mt-2">
                                <span
                                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold ${interviewOutcomeBadgeClass(
                                    outcomeLabel
                                  )}`}
                                >
                                  {outcomeLabel}
                                </span>
                              </p>
                            ) : null}
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              if (roundHasFeedbackDetails(round)) {
                                setInterviewFeedbackPayload(
                                  buildInterviewFeedbackModalPayload(round, application)
                                );
                                setInterviewFeedbackModalOpen(true);
                                return;
                              }
                              setInterviewModalPayload(round);
                              setInterviewModalOpen(true);
                            }}
                            className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border bg-white px-3.5 py-2 text-[0.8125rem] font-medium shadow-sm ${buttonTone}`}
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                              <rect width="18" height="18" x="3" y="4" rx="2" />
                              <path d="M3 10h18" />
                              <path d="M8 2v4M16 2v4" />
                            </svg>
                            {completed ? 'View feedback' : 'Interview details'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </ApplicationDetailSectionCard>
              ) : null}

              {application.offerLetterUrl ? (
                <ApplicationDetailSectionCard title="Offer Letter" className="border-emerald-100">
                  <p className="application-detail-helper">
                    {isOfferResentPending(application)
                      ? 'Your recruiter has shared a revised offer letter (Offer Re-Sent). Open it to review the updated details, then accept or decline below.'
                      : 'Congratulations — your offer letter has been shared by the recruiter. Open it to review the details, or save a copy for your records.'}
                  </p>
                  {application.offerLetterUploadedAt
                    ? (() => {
                        const d = new Date(application.offerLetterUploadedAt);
                        if (Number.isNaN(d.getTime())) return null;
                        const { date, time } = formatDateTime(d);
                        return (
                          <p className="profile-page-empty mt-1">
                            Received {date} at {time}
                          </p>
                        );
                      })()
                    : null}

                  <div className="mt-3 flex flex-col gap-3 rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <path d="M14 2v6h6" />
                          <path d="M9 13h6M9 17h6" />
                        </svg>
                      </span>
                      <div className="min-w-0">
                        <p className="truncate profile-page-value font-semibold">
                          {application.offerLetterFileName || 'Offer letter.pdf'}
                        </p>
                        <p className="profile-page-empty">PDF document</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      <a
                        href={application.offerLetterUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-700/30 bg-white px-3 py-2 text-[0.8125rem] font-medium text-emerald-800 shadow-sm hover:bg-emerald-50"
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
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[0.8125rem] font-medium text-white shadow-sm hover:bg-emerald-700"
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

                  {(() => {
                    const offerResponseState = application
                      ? resolveOfferResponseState(application)
                      : null;
                    return offerResponseState ? (
                    <div className="profile-page-value mt-3 space-y-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5">
                      <p>
                        You {offerResponseState === 'ACCEPTED' ? 'accepted' : 'declined'} this offer
                        {application.offerRespondedAt
                          ? ` on ${formatDateTime(application.offerRespondedAt).date}`
                          : ''}
                        .
                      </p>
                      {offerResponseState === 'REJECTED' && application.offerRejectionRemark ? (
                        <p className="whitespace-pre-wrap text-sm text-slate-600">
                          <span className="font-semibold text-slate-700">Your remark:</span>{' '}
                          {application.offerRejectionRemark}
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={offerResponding}
                        onClick={() => void respondToOffer('accept')}
                        className="inline-flex min-w-[140px] flex-1 items-center justify-center rounded-lg bg-emerald-600 px-3.5 py-2 text-[0.8125rem] font-medium text-white hover:bg-emerald-700 disabled:opacity-60"
                      >
                        Accept offer
                      </button>
                      <button
                        type="button"
                        disabled={offerResponding}
                        onClick={() => {
                          setOfferRejectRemark('');
                          setOfferRejectModalOpen(true);
                        }}
                        className="inline-flex min-w-[140px] flex-1 items-center justify-center rounded-lg border border-red-200 bg-white px-3.5 py-2 text-[0.8125rem] font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
                      >
                        Reject offer
                      </button>
                    </div>
                  );
                  })()}
                </ApplicationDetailSectionCard>
              ) : null}

              {application.joiningDate ||
              application.reportingToName ||
              application.placementStatus === 'JOINING_SCHEDULED' ? (
                <ApplicationDetailSectionCard title="Joining details" className="border-amber-100">
                  <p className="application-detail-helper">
                    Your recruiter has scheduled your joining. Please review the information below.
                  </p>
                  <div className="profile-page-value mt-3 space-y-2 rounded-xl border border-amber-100 bg-amber-50/70 p-3.5">
                    {application.joiningDate ? (
                      <p>
                        <span className="font-semibold">Joining date:</span> {application.joiningDate}
                      </p>
                    ) : null}
                    {application.reportingToName ? (
                      <p>
                        <span className="font-semibold">Report to:</span> {application.reportingToName}
                        {application.reportingToTitle ? ` (${application.reportingToTitle})` : ''}
                      </p>
                    ) : null}
                    {application.reportingToEmail ? (
                      <p>
                        <span className="font-semibold">Contact:</span>{' '}
                        <a href={`mailto:${application.reportingToEmail}`} className="text-emerald-800 underline">
                          {application.reportingToEmail}
                        </a>
                      </p>
                    ) : null}
                    {application.joiningNotes ? (
                      <p className="whitespace-pre-wrap pt-1">{application.joiningNotes}</p>
                    ) : null}
                  </div>
                </ApplicationDetailSectionCard>
              ) : null}

              <ApplicationDetailSectionCard title="Application Timeline">
                <div className="space-y-3">
                  <div className="rounded-xl border border-blue-100 bg-blue-50 p-3.5">
                    <h3 className="profile-page-section-title">Application Submitted</h3>
                    <p className="profile-page-empty mt-1">
                      {application.appliedAt ? `${formatDateTime(application.appliedAt).date}, ${formatDateTime(application.appliedAt).time}` : '-'}
                    </p>
                    <p className="profile-page-value mt-2">
                      Your application has been successfully submitted
                    </p>
                  </div>

                  {timelineRowsForDisplay.map((row) => {
                    const rejectedRow = isRejectedTimelineRow(row);
                    const interviewRow = !rejectedRow && isInterviewTimelineRow(row);
                    const rejectionPreview = rejectedRow
                      ? parseRejectionDescriptionText(row.description)
                      : null;
                    const { date, time } = formatDateTime(row.occurredAt);
                    const cardBorder = rejectedRow
                      ? 'border-rose-200 bg-rose-50/90'
                      : interviewRow
                        ? 'border-emerald-200 bg-emerald-50/90'
                        : 'border-gray-200 bg-gray-50';
                    return (
                      <div key={row.id} className={`rounded-xl border p-3.5 ${cardBorder}`}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <h3 className="profile-page-section-title">{row.title || row.status}</h3>
                            <p className="profile-page-empty mt-1">
                              {date}, {time}
                            </p>
                            {rejectedRow && rejectionPreview ? (
                              <div className="profile-page-value mt-2 space-y-2">
                                {rejectionPreview.reason ? (
                                  <p>
                                    <span className="font-semibold text-rose-900">Reason:</span>{' '}
                                    {rejectionPreview.reason}
                                  </p>
                                ) : null}
                                {rejectionPreview.feedback ? (
                                  <p className="whitespace-pre-wrap">
                                    <span className="font-semibold text-rose-900">Feedback:</span>{' '}
                                    {rejectionPreview.feedback}
                                  </p>
                                ) : null}
                              </div>
                            ) : row.description ? (
                              <p className="profile-page-value mt-2 line-clamp-4">{row.description}</p>
                            ) : (
                              <p className="application-detail-helper mt-2 italic">No additional notes for this step.</p>
                            )}
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2 sm:pt-0.5">
                            {interviewRow ? (
                              <button
                                type="button"
                                onClick={() => router.push(`/interviews/${encodeURIComponent(applicationId)}`)}
                                className="rounded-lg border border-emerald-600/30 bg-white px-3 py-1.5 text-[0.75rem] font-medium text-emerald-800 shadow-sm hover:bg-emerald-50"
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
                                className="rounded-lg border border-rose-300 bg-white px-3 py-1.5 text-[0.75rem] font-medium text-rose-900 shadow-sm hover:bg-rose-50"
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
                            className={`rounded-xl border p-3.5 ${
                              isCurrent ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                              <div className="min-w-0 flex-1">
                                <h3 className="profile-page-section-title">{stage}</h3>
                                <p className="profile-page-empty mt-1">
                                  {stageUpdatedAt ? `${stageUpdatedAt.date}, ${stageUpdatedAt.time}` : '-'}
                                </p>
                                <p className="profile-page-value mt-2">
                                  {isCurrent
                                    ? `You are currently in the ${stage} stage.`
                                    : `Your application moved to ${stage}.`}
                                </p>
                              </div>
                              {stageIsInterview ? (
                                <button
                                  type="button"
                                  onClick={() => router.push(`/interviews/${encodeURIComponent(applicationId)}`)}
                                  className="shrink-0 rounded-lg border border-emerald-600/30 bg-white px-3 py-1.5 text-[0.75rem] font-medium text-emerald-800 shadow-sm hover:bg-emerald-50"
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
                    <p className="profile-page-empty">No timeline events available yet.</p>
                  ) : null}
                </div>
              </ApplicationDetailSectionCard>
            </div>

            <div className="space-y-4">
              <ApplicationDetailSectionCard title="Job Snapshot">
                <div className="profile-basic-info-display space-y-3">
                  <div>
                    <p className="profile-page-label">Job Title</p>
                    <p className="profile-page-value">{application.job.title}</p>
                  </div>
                  <div>
                    <p className="profile-page-label">Work Mode</p>
                    <p className="profile-page-value">{application.job.workMode}</p>
                  </div>
                  <div>
                    <p className="profile-page-label">Experience</p>
                    <p className="profile-page-value">{application.job.experience}</p>
                  </div>
                  <div>
                    <p className="profile-page-label">Employment</p>
                    <p className="profile-page-value">{application.job.employmentType}</p>
                  </div>
                  <div>
                    <p className="profile-page-label">Salary</p>
                    <p className="profile-page-value">{application.job.salary}</p>
                  </div>
                  <div>
                    <p className="profile-page-label">Applied On</p>
                    <p className="profile-page-value">{defaultAppliedAt}</p>
                  </div>
                </div>

                {canWithdraw ? (
                  <div className="mt-4 border-t border-gray-100 pt-4">
                    <p className="application-detail-helper mb-3">
                      Change your mind? Withdrawing removes this role from My Applications. You can apply again from Jobseeker.
                    </p>
                    <button
                      type="button"
                      onClick={() => setWithdrawConfirmOpen(true)}
                      disabled={withdrawing}
                      className="inline-flex w-full items-center justify-center rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2 text-[0.8125rem] font-medium text-rose-800 shadow-sm transition hover:bg-rose-100 disabled:opacity-60 sm:w-auto"
                    >
                      Withdraw application
                    </button>
                  </div>
                ) : null}
              </ApplicationDetailSectionCard>

              <ApplicationDetailSectionCard title="Communication Updates">
                <div className="mb-3 flex items-center gap-4">
                  <span className={`text-[0.8125rem] font-medium ${application.emailUpdates ? 'text-emerald-700' : 'text-[#64748b]'}`}>
                    Email Updates
                  </span>
                  <span className={`text-[0.8125rem] font-medium ${application.whatsappUpdates ? 'text-emerald-700' : 'text-[#64748b]'}`}>
                    WhatsApp Updates
                  </span>
                </div>

                <div className="space-y-3">
                  {(emailUpdates.length || whatsappUpdates.length) ? (
                    [...emailUpdates, ...whatsappUpdates].map((item) => (
                      <div key={item.id} className="rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <div className="mb-1 flex items-center justify-between gap-2">
                          <p className="profile-page-value font-semibold">{item.title}</p>
                          <span className="text-[0.75rem] font-medium uppercase tracking-wide text-[#94a3b8]">
                            {item.channel}
                          </span>
                        </div>
                        <p className="profile-page-empty mb-1">
                          {item.date}, {item.time}
                        </p>
                        <p className="profile-page-value line-clamp-3">{item.preview}</p>
                      </div>
                    ))
                  ) : (
                    <p className="profile-page-empty">No communication updates yet.</p>
                  )}
                </div>
              </ApplicationDetailSectionCard>
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
          <div className="profile-modal-typography relative z-101 w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 id="interview-details-title" className="profile-modal-title">
                  {interviewModalPayload.timelineTitle}
                </h2>
                <p className="profile-modal-helper mt-1">
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

            <dl className="space-y-3">
              <div>
                <dt className="profile-modal-label">Scheduled</dt>
                <dd className="profile-modal-field mt-1">
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

      {interviewFeedbackModalOpen && interviewFeedbackPayload ? (
        <div
          className="fixed inset-0 z-[10040] flex items-center justify-center p-3 sm:p-4"
          style={{ paddingTop: 'calc(var(--app-header-height, 5.75rem) + 0.5rem)' }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="interview-feedback-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={closeInterviewFeedbackModal}
          />
          <div className="profile-modal-typography relative z-[10041] w-full max-w-md max-h-[calc(100vh-var(--app-header-height,5.75rem)-2rem)] overflow-y-auto rounded-xl border border-gray-100 bg-white p-3.5 shadow-2xl sm:p-4">
            <div className="mb-3 flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 id="interview-feedback-title" className="text-lg font-semibold text-gray-900">
                  {interviewFeedbackPayload.companyName}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
                  {formatFeedbackSubmittedAt(interviewFeedbackPayload.submittedAt)}
                </p>
                <p className="text-xs text-gray-500">{interviewFeedbackPayload.roundLabel}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1.5">
                <span
                  className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${recommendationBadgeClass(
                    interviewFeedbackPayload.recommendationLabel
                  )}`}
                >
                  {interviewFeedbackPayload.recommendationLabel}
                </span>
                <button
                  type="button"
                  onClick={closeInterviewFeedbackModal}
                  className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  aria-label="Close"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              {[
                ['Technical Skills', interviewFeedbackPayload.technicalScore],
                ['Communication', interviewFeedbackPayload.communicationScore],
                ['Problem Solving', interviewFeedbackPayload.problemSolvingScore],
                ['Culture Fit', interviewFeedbackPayload.cultureFitScore],
                ['Experience Match', interviewFeedbackPayload.experienceMatchScore],
                ['Overall Rating', interviewFeedbackPayload.overallRating],
              ].map(([label, score]) => (
                <div key={String(label)} className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                  <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-gray-500">{label}</p>
                  <div className="mt-1 flex items-center gap-1.5">
                    <FeedbackScoreStars score={score as number | null | undefined} />
                    {score != null ? (
                      <span className="text-[0.6875rem] font-medium text-gray-500">{score}/5</span>
                    ) : (
                      <span className="text-[0.6875rem] font-medium text-gray-400">Not rated</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2">
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-gray-500">Strengths</p>
                <p className="mt-1 whitespace-pre-wrap text-[0.8125rem] text-gray-800">
                  {interviewFeedbackPayload.strengths?.trim() || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-gray-500">Weaknesses</p>
                <p className="mt-1 whitespace-pre-wrap text-[0.8125rem] text-gray-800">
                  {interviewFeedbackPayload.weaknesses?.trim() || '—'}
                </p>
              </div>
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-2">
                <p className="text-[0.6875rem] font-semibold uppercase tracking-wide text-gray-500">Comments</p>
                <p className="mt-1 whitespace-pre-wrap text-[0.8125rem] text-gray-800">
                  {interviewFeedbackPayload.comments?.trim() || '—'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeInterviewFeedbackModal}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
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
          <div className="profile-modal-typography relative z-101 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
            <h2 id="withdraw-confirm-title" className="profile-modal-title">
              Withdraw application?
            </h2>
            <p className="profile-modal-helper mt-3">
              This removes the role from My Applications. You can apply again anytime from Jobseeker.
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

      {offerRejectModalOpen ? (
        <div
          className="fixed inset-0 z-100 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="offer-reject-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[1px]"
            aria-label="Close dialog"
            onClick={() => {
              if (offerResponding) return;
              setOfferRejectModalOpen(false);
              setOfferRejectRemark('');
            }}
          />
          <div className="profile-modal-typography relative z-101 w-full max-w-md rounded-2xl border border-gray-100 bg-white p-5 shadow-2xl">
            <h2 id="offer-reject-title" className="profile-modal-title">
              Decline this offer?
            </h2>
            <p className="profile-modal-helper mt-3">
              Please share a brief reason so the recruiter understands your decision.
            </p>
            <label className="mt-4 block text-sm font-medium text-gray-700" htmlFor="offer-reject-remark">
              Remark <span className="text-red-600">*</span>
            </label>
            <textarea
              id="offer-reject-remark"
              value={offerRejectRemark}
              onChange={(event) => setOfferRejectRemark(event.target.value)}
              rows={4}
              maxLength={2000}
              placeholder="e.g. Compensation does not meet expectations, joining another company..."
              className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-red-300 focus:ring-2 focus:ring-red-100"
            />
            <p className="mt-1 text-xs text-gray-500">{offerRejectRemark.trim().length}/2000</p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  if (offerResponding) return;
                  setOfferRejectModalOpen(false);
                  setOfferRejectRemark('');
                }}
                disabled={offerResponding}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void respondToOffer('reject', offerRejectRemark)}
                disabled={offerResponding || !offerRejectRemark.trim()}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:opacity-60"
              >
                {offerResponding ? 'Submitting…' : 'Submit decline'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {rejectionModalOpen && rejectionModalPayload ? (
        <div
          className="fixed inset-0 z-[10040] flex items-center justify-center p-3 sm:p-4"
          style={{ paddingTop: 'calc(var(--app-header-height, 5.75rem) + 0.5rem)' }}
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
          <div className="profile-modal-typography relative z-[10041] w-full max-w-md max-h-[calc(100vh-var(--app-header-height,5.75rem)-2rem)] overflow-y-auto rounded-xl border border-rose-100 bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <h2 id="rejection-feedback-title" className="text-lg font-semibold text-gray-900">
                  {rejectionModalPayload.title}
                </h2>
                <p className="mt-0.5 text-xs text-gray-500">
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
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                aria-label="Close"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="space-y-3">
              {rejectionModalPayload.reason ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">Reason</p>
                  <p className="mt-2 text-sm leading-relaxed text-gray-900">{rejectionModalPayload.reason}</p>
                </div>
              ) : null}
              {rejectionModalPayload.feedback ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-3.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-rose-800/90">Feedback</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-gray-900">
                    {rejectionModalPayload.feedback}
                  </p>
                </div>
              ) : null}
              {!rejectionModalPayload.reason && !rejectionModalPayload.feedback ? (
                <div className="rounded-xl border border-rose-100 bg-rose-50/80 p-3.5">
                  <p className="text-sm leading-relaxed text-gray-900">
                    No written feedback was provided for this decision.
                  </p>
                </div>
              ) : null}
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={closeRejectionModal}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ProfilePageShell>
  );
}
