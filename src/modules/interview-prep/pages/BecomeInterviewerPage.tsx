'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, Users } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';
import { resolveProfilePhotoUrl } from '@/lib/profile-photo';
import { buildInterviewLiveMeetingUrl } from '@/lib/interview-live-meeting';
import {
  getInterviewerQueue,
  getMyInterviewerApplication,
  respondToInterviewRequest,
  scheduleInterviewSlot,
  submitInterviewerApplication,
  updateMyInterviewerApplication,
} from '@/lib/interviewer-api';
import { submitInterviewReview } from '@/lib/interview-request-api';
import { InterviewLiveHistory } from '@/modules/interview-prep/components/InterviewLiveHistory';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import { InterviewSimpleTabs } from '../components/InterviewSimpleTabs';
import { InterviewReviewModal } from '../components/InterviewReviewModal';
import { InterviewRescheduleModal } from '../components/InterviewRescheduleModal';
import { KycVerifiedTag } from '@/components/interview/KycVerifiedTag';
import {
  displayReviewText,
  formatInterviewWhen,
  getInterviewSessionWindow,
  hasCandidateReviewed,
  hasInterviewerReviewed,
} from '@/lib/interview-session-window';

const SKILLS = [
  'Frontend Development',
  'Backend Development',
  'Full Stack Development',
  'Mobile Development',
  'DevOps',
  'Cloud',
  'AI / Machine Learning',
  'Data Science',
  'UI / UX',
  'HR Interview',
  'Behavioral Interview',
  'DSA',
  'System Design',
] as const;

const INTERVIEW_TYPES = [
  'Technical Interview',
  'Coding Interview',
  'Mock Interview',
  'System Design',
  'HR Round',
  'Behavioral Round',
] as const;

const LANGUAGES = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Malayalam'] as const;
const AVAILABILITY_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
const AVAILABILITY_SLOT_OPTIONS = [
  '8:00 AM - 10:00 AM',
  '10:00 AM - 12:00 PM',
  '12:00 PM - 2:00 PM',
  '2:00 PM - 4:00 PM',
  '4:00 PM - 6:00 PM',
  '6:00 PM - 8:00 PM',
  '8:00 PM - 10:00 PM',
] as const;

function yearsFromBucket(value: string) {
  if (value.startsWith('0-1')) return 1;
  if (value.startsWith('1-3')) return 2;
  if (value.startsWith('3-5')) return 4;
  if (value.startsWith('5-8')) return 6;
  return 9;
}

function bucketFromYears(years: number) {
  if (years >= 8) return '8+ Years';
  if (years >= 5) return '5-8 Years';
  if (years >= 3) return '3-5 Years';
  if (years >= 1) return '1-3 Years';
  return '0-1 Years';
}

function parseWeeklyAvailability(summary: string) {
  const text = String(summary || '');
  const daysPart = /Days:\s*([^|]*)/i.exec(text)?.[1] || '';
  const slotsPart = /Slots:\s*(.*)$/i.exec(text)?.[1] || '';
  const days = daysPart
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is (typeof AVAILABILITY_DAYS)[number] =>
      (AVAILABILITY_DAYS as readonly string[]).includes(item)
    );
  const slots = slotsPart
    .split(',')
    .map((item) => item.trim())
    .filter((item): item is (typeof AVAILABILITY_SLOT_OPTIONS)[number] =>
      (AVAILABILITY_SLOT_OPTIONS as readonly string[]).includes(item)
    );
  return { days, slots };
}

function getInterviewerQueueBadge(item: {
  status?: string;
  candidateFeedback?: string | null;
  candidateProposedSlot?: string | null;
  paymentHeldAt?: string | null;
}) {
  const status = String(item.status || '');
  if (status === 'ACCEPTED') {
    return {
      text: item.paymentHeldAt
        ? 'Awaiting candidate confirmation — no extra tokens'
        : 'Awaiting Candidate Confirmation',
      className: 'border border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  if (status === 'WAITING_FOR_ACCEPTANCE') {
    return {
      text: item.candidateProposedSlot || String(item.candidateFeedback || '').includes('SLOT_PROPOSAL')
        ? item.paymentHeldAt
          ? 'Candidate requested new slot — confirm free'
          : 'Candidate Requested New Slot'
        : 'Waiting for your acceptance',
      className: 'border border-orange-200 bg-orange-50 text-orange-800',
    };
  }
  return null;
}

function getJoinWindowState(item: { scheduledAt?: string | null; duration?: number; status?: string }, nowTs: number) {
  return getInterviewSessionWindow(item, nowTs);
}

export default function BecomeInterviewerPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [currentCompany, setCurrentCompany] = useState('');
  const [currentRole, setCurrentRole] = useState('');
  const [experience, setExperience] = useState('1-3 Years');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['Technical Interview']);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(['English']);
  const [selectedAvailabilityDays, setSelectedAvailabilityDays] = useState<string[]>([
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
  ]);
  const [selectedAvailabilitySlots, setSelectedAvailabilitySlots] = useState<string[]>(['6:00 PM - 8:00 PM']);
  const [motivation, setMotivation] = useState('');
  const [feedbackStyle, setFeedbackStyle] = useState('');
  const [interviewPrice, setInterviewPrice] = useState(50);
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [queueActionMessage, setQueueActionMessage] = useState('');
  const [proposedSlotByRequest, setProposedSlotByRequest] = useState<Record<string, string>>({});
  const [prefilledFromSaved, setPrefilledFromSaved] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [reviewRequestId, setReviewRequestId] = useState<string | null>(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState('');
  const [rescheduleRequestId, setRescheduleRequestId] = useState<string | null>(null);
  const [rescheduleBusy, setRescheduleBusy] = useState(false);
  const [hasManualCompanyRoleEdit, setHasManualCompanyRoleEdit] = useState(false);
  const [nowTs, setNowTs] = useState(() => Date.now());
  const [hubTab, setHubTab] = useState<'candidates' | 'active' | 'completed' | 'application'>('candidates');

  useEffect(() => {
    const tab = String(searchParams.get('tab') || '');
    if (tab === 'completed' || tab === 'active' || tab === 'candidates' || tab === 'application') {
      setHubTab(tab);
    }
    const reviewId = String(searchParams.get('reviewId') || '').trim();
    if (reviewId) setReviewRequestId(reviewId);
  }, [searchParams]);

  const profileQuery = useQuery({
    queryKey: ['interviewer-application-me'],
    queryFn: getMyInterviewerApplication,
    staleTime: 15_000,
  });

  const queueQuery = useQuery({
    queryKey: ['interviewer-queue'],
    queryFn: getInterviewerQueue,
    enabled: Boolean(profileQuery.data?.profile || profileQuery.data?.application),
    staleTime: 10_000,
    retry: 0,
  });

  const phase1ProfileQuery = useQuery({
    queryKey: ['phase1-profile-for-interviewer', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const response = await fetch(`${getApiBaseUrl()}/profile/${user.id}`, {
        method: 'GET',
        headers: getAuthHeaders(),
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || !payload?.success || !payload?.data) return null;
      return payload.data as Record<string, unknown>;
    },
    enabled: Boolean(user?.id),
    staleTime: 60_000,
    retry: 0,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowTs(Date.now());
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (name.trim()) return;
    const profile = phase1ProfileQuery.data;
    if (!profile || typeof profile !== 'object') return;

    const fullNameFromProfile = String(
      (profile as { fullName?: string }).fullName ||
        ((profile as { personalInfo?: { fullName?: string } }).personalInfo?.fullName ?? '')
    ).trim();

    const firstName = String(
      ((profile as { personalInfo?: { firstName?: string } }).personalInfo?.firstName ?? '')
    ).trim();
    const lastName = String(
      ((profile as { personalInfo?: { lastName?: string } }).personalInfo?.lastName ?? '')
    ).trim();
    const mergedName = [firstName, lastName].filter(Boolean).join(' ').trim();

    const resolved = fullNameFromProfile || mergedName || String(user?.name || '').trim();
    if (resolved) setName(resolved);
  }, [name, phase1ProfileQuery.data, user?.name]);

  const existingApplication = profileQuery.data?.application || null;
  const interviewerProfile = profileQuery.data?.profile || null;
  const kyc = profileQuery.data?.kyc || null;
  const kycVerified = Boolean(kyc?.kycVerified);
  const kycMissing = Array.isArray(kyc?.missing) ? kyc.missing : [];
  const accountPhotoUrl = useMemo(() => {
    const profile = phase1ProfileQuery.data as
      | {
          profilePhotoUrl?: string;
          personalInfo?: { profilePhotoUrl?: string };
        }
      | null
      | undefined;
    const fromProfile =
      profile?.personalInfo?.profilePhotoUrl ||
      profile?.profilePhotoUrl ||
      '';
    return resolveProfilePhotoUrl(fromProfile || user?.profilePhotoUrl || null);
  }, [phase1ProfileQuery.data, user?.profilePhotoUrl]);
  const queue = useMemo(() => queueQuery.data ?? [], [queueQuery.data]);
  const openQueueItems = useMemo(
    () =>
      queue.filter((item) => {
        // Don't show your own candidate requests in the interviewer inbox
        if (user?.id && String(item.candidateId) === String(user.id)) return false;
        return ['FINDING_INTERVIEWER', 'MATCHING', 'WAITING_FOR_ACCEPTANCE', 'ACCEPTED'].includes(
          String(item.status || ''),
        );
      }),
    [queue, user?.id],
  );
  const acceptedQueueItems = useMemo(
    () =>
      queue.filter((item) => {
        if (user?.id && String(item.candidateId) === String(user.id)) return false;
        return ['SCHEDULED', 'IN_PROGRESS'].includes(String(item.status || ''));
      }),
    [queue, user?.id],
  );
  const completedQueueItems = useMemo(
    () =>
      queue.filter((item) => {
        if (user?.id && String(item.candidateId) === String(user.id)) return false;
        return String(item.status || '') === 'COMPLETED';
      }),
    [queue, user?.id],
  );
  const reviewTarget = queue.find((item) => item.id === reviewRequestId) || null;
  const rescheduleTarget = queue.find((item) => item.id === rescheduleRequestId) || null;

  useEffect(() => {
    if (!interviewerProfile && (!existingApplication || existingApplication.status === 'REJECTED')) {
      setHubTab('application');
    }
  }, [existingApplication, interviewerProfile]);

  useEffect(() => {
    if (prefilledFromSaved) return;
    const source = interviewerProfile || existingApplication;
    if (!source) return;
    setName(String(source.fullName || ''));
    if (!hasManualCompanyRoleEdit) {
      setCurrentCompany(String(source.currentCompany || ''));
      setCurrentRole(String(source.currentRole || ''));
    }
    setExperience(bucketFromYears(Number(source.yearsOfExperience || 0)));
    setSelectedSkills(Array.isArray(source.expertiseAreas) ? source.expertiseAreas : []);
    setSelectedTypes(Array.isArray(source.interviewTypes) ? source.interviewTypes : []);
    setSelectedLanguages(Array.isArray(source.languages) ? source.languages : []);
    const parsedAvailability = parseWeeklyAvailability(String(source.weeklyAvailability || ''));
    if (parsedAvailability.days.length) setSelectedAvailabilityDays(parsedAvailability.days);
    if (parsedAvailability.slots.length) setSelectedAvailabilitySlots(parsedAvailability.slots);
    setMotivation(String(source.aboutYourself || ''));
    setFeedbackStyle(String(source.feedbackStyle || ''));
    setInterviewPrice(Number(source.interviewPrice || 50));
    setPrefilledFromSaved(true);
  }, [existingApplication, hasManualCompanyRoleEdit, interviewerProfile, prefilledFromSaved]);
  const weeklyAvailabilitySummary = useMemo(() => {
    const dayPart = selectedAvailabilityDays.join(', ');
    const slotPart = selectedAvailabilitySlots.join(', ');
    if (!dayPart && !slotPart) return '';
    if (!dayPart) return `Slots: ${slotPart}`;
    if (!slotPart) return `Days: ${dayPart}`;
    return `Days: ${dayPart} | Slots: ${slotPart}`;
  }, [selectedAvailabilityDays, selectedAvailabilitySlots]);

  const submitValidationMessage = useMemo(
    () => {
      if (name.trim().length < 2) return 'Please enter full name (minimum 2 characters).';
      if (currentRole.trim().length < 2) return 'Please enter current role.';
      if (selectedSkills.length === 0) return 'Please select at least one expertise area.';
      if (selectedTypes.length === 0) return 'Please select at least one interview type.';
      if (selectedLanguages.length === 0) return 'Please select at least one language.';
      if (selectedAvailabilityDays.length === 0) return 'Please select at least one availability day.';
      if (selectedAvailabilitySlots.length === 0) return 'Please select at least one availability slot.';
      if (motivation.trim().length < 20) return 'About yourself must be at least 20 characters.';
      if (feedbackStyle.trim().length < 10) return 'Feedback style must be at least 10 characters.';
      if (weeklyAvailabilitySummary.trim().length < 5) return 'Please provide weekly availability.';
      if (!Number.isFinite(interviewPrice) || interviewPrice < 5 || interviewPrice > 500) {
        return 'Interview price must be between 5 and 500 tokens.';
      }
      return '';
    },
    [
      currentRole,
      feedbackStyle,
      motivation,
      name,
      selectedAvailabilityDays,
      selectedAvailabilitySlots,
      selectedLanguages,
      selectedSkills,
      selectedTypes,
      weeklyAvailabilitySummary,
      interviewPrice,
    ]
  );

  const toggleArrayValue = (
    value: string,
    getter: string[],
    setter: (next: string[] | ((prev: string[]) => string[])) => void
  ) => {
    setter(getter.includes(value) ? getter.filter((item) => item !== value) : [...getter, value]);
  };

  const handleSubmit = async () => {
    if (!kycVerified) {
      setFormError(
        `Complete KYC / ID verification on your profile before applying as an interviewer.${
          kycMissing.length ? ` Missing: ${kycMissing.join(', ')}.` : ''
        }`,
      );
      return;
    }
    if (submitValidationMessage) {
      setFormError(submitValidationMessage);
      return;
    }
    setSubmitting(true);
    setFormError('');
    setSaveMessage('');
    const payload = {
      fullName: name.trim(),
      currentCompany: currentCompany.trim(),
      currentRole: currentRole.trim(),
      yearsOfExperience: yearsFromBucket(experience),
      expertiseAreas: selectedSkills,
      interviewTypes: selectedTypes,
      languages: selectedLanguages,
      weeklyAvailability: weeklyAvailabilitySummary.trim(),
      aboutYourself: motivation.trim(),
      feedbackStyle: feedbackStyle.trim(),
      interviewPrice: Math.round(interviewPrice),
    };
    try {
      if (interviewerProfile || existingApplication) {
        await updateMyInterviewerApplication(payload);
        setSaveMessage(
          existingApplication?.status === 'REJECTED'
            ? 'Sent for re-verification. HQ will review your interviewer form again.'
            : 'Profile changes saved.'
        );
      } else {
        await submitInterviewerApplication(payload);
        setSaveMessage('Interviewer application submitted. You can edit it from Profile anytime.');
      }
      await profileQuery.refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to save interviewer application');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQueueDecision = async (requestId: string, decision: 'ACCEPT' | 'REJECT') => {
    setActionLoadingId(requestId);
    setQueueActionMessage('');
    setFormError('');
    try {
      const updated = await respondToInterviewRequest(
        requestId,
        decision,
        decision === 'ACCEPT'
          ? proposedSlotByRequest[requestId] ||
            queue.find((row) => row.id === requestId)?.candidateProposedSlot ||
            queue.find((row) => row.id === requestId)?.proposedSlot
          : undefined,
        decision === 'ACCEPT'
          ? queue.find((row) => row.id === requestId)?.candidateProposedDate ||
            queue.find((row) => row.id === requestId)?.proposedDate ||
            undefined
          : undefined
      );
      queryClient.setQueryData(['interviewer-queue'], (previous: unknown) => {
        if (!Array.isArray(previous)) return previous;
        return previous.map((item) =>
          item && typeof item === 'object' && (item as { id?: string }).id === requestId
            ? { ...(item as Record<string, unknown>), ...updated }
            : item
        );
      });
      const row = queue.find((item) => item.id === requestId);
      const alreadyPaid = Boolean(row?.paymentHeldAt);
      setQueueActionMessage(
        decision === 'ACCEPT'
          ? alreadyPaid && String(row?.status) === 'WAITING_FOR_ACCEPTANCE'
            ? `New slot confirmed for ${updated.requestId || 'request'}. No extra tokens were charged.`
            : alreadyPaid
              ? `New time sent for ${updated.requestId || 'request'}. Candidate can confirm at no extra cost.`
              : `Accepted ${updated.requestId || 'request'} successfully. Waiting for candidate confirmation.`
          : `Rejected ${updated.requestId || 'request'} successfully.`
      );
      await Promise.all([queueQuery.refetch(), profileQuery.refetch()]);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to update request');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => router.push('/lms/interview-prep')}
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interview Prep
      </button>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-600/10 text-emerald-700">
            <Users className="h-4.5 w-4.5" />
          </span>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">Interviewer application</p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <h1 className="text-lg font-bold text-slate-900">Become an Interviewer</h1>
              <KycVerifiedTag verified={kycVerified} />
            </div>
            <p className="mt-0.5 text-xs text-slate-600">
              Complete application details, get approved, then start receiving interview requests.
            </p>
          </div>
        </div>

        {profileQuery.isLoading ? (
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading interviewer profile...
          </div>
        ) : !kycVerified ? (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <p className="text-sm font-semibold text-amber-900">KYC required to apply</p>
            <p className="mt-1 text-xs text-amber-800">
              Complete identity verification on your profile first
              {kycMissing.length ? ` (${kycMissing.join(', ')})` : ''}. Then reload this page.
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => router.push('/profile')}
                className="rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white"
              >
                Open Profile
              </button>
              <button
                type="button"
                onClick={() => router.push('/completion-profile')}
                className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900"
              >
                Profile completion
              </button>
            </div>
          </div>
        ) : existingApplication?.status === 'REJECTED' ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3">
            <p className="text-sm font-semibold text-rose-900">HQ rejected this interviewer form</p>
            <p className="mt-1 text-xs text-rose-800">
              {existingApplication.reviewNotes ||
                'Update the form and send it for re-verification.'}
            </p>
          </div>
        ) : interviewerProfile ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-sm font-semibold">Interviewer profile is active</p>
            </div>
            <p className="mt-1 text-xs text-emerald-700">
              Status: {interviewerProfile.status} · Rating: {interviewerProfile.ratingAverage.toFixed(1)} · Interviews:{' '}
              {interviewerProfile.totalInterviews}
            </p>
          </div>
        ) : existingApplication && existingApplication.status !== 'REJECTED' ? (
          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
            <p className="text-xs font-semibold text-sky-800">Application status: {existingApplication.statusLabel}</p>
            <p className="mt-0.5 text-xs text-sky-700">Use the tabs below to review candidates.</p>
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-xs font-semibold text-slate-800">Application needed</p>
            <p className="mt-0.5 text-xs text-slate-600">Open the Application tab to submit your interviewer profile.</p>
          </div>
        )}
      </section>

      <InterviewSimpleTabs
        active={hubTab}
        onChange={(id) => setHubTab(id as typeof hubTab)}
        tabs={[
          { id: 'candidates', label: 'Inbox', count: openQueueItems.length },
          { id: 'active', label: 'Scheduled', count: acceptedQueueItems.length },
          { id: 'completed', label: 'Completed', count: completedQueueItems.length },
          { id: 'application', label: 'Profile' },
        ]}
      />

      {hubTab === 'application' ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="space-y-4">
            {existingApplication?.status === 'REJECTED' ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-sm font-semibold text-rose-800">
                  This form was rejected. Update the details and send it for re-verification.
                </p>
                {existingApplication.reviewNotes ? (
                  <p className="mt-1 text-sm text-rose-700">{existingApplication.reviewNotes}</p>
                ) : null}
              </div>
            ) : interviewerProfile ? (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3">
                <p className="text-sm font-semibold text-emerald-800">Active interviewer profile</p>
                <p className="mt-0.5 text-xs text-emerald-700">
                  Edit your submitted details below and save. Status: {interviewerProfile.status}.
                </p>
              </div>
            ) : existingApplication ? (
              <div className="rounded-xl border border-sky-200 bg-sky-50 p-3">
                <p className="text-sm font-semibold text-sky-800">
                  Application status: {existingApplication.statusLabel}
                </p>
                <p className="mt-0.5 text-xs text-sky-700">
                  You can edit this submitted form and save the updates.
                </p>
              </div>
            ) : null}
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              {accountPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={accountPhotoUrl}
                  alt=""
                  className="h-14 w-14 rounded-full object-cover"
                />
              ) : (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-200 text-lg font-bold text-slate-600">
                  {String(name || user?.name || 'U').slice(0, 1).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-semibold text-slate-800">Profile photo</p>
                <p className="text-xs text-slate-500">
                  {accountPhotoUrl
                    ? 'Using the photo from your Phase 1 account.'
                    : 'No account photo yet. Add one from your profile and it will appear here.'}
                </p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Personal Information - Full Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  placeholder="Enter your full name"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Current Company</label>
                <input
                  value={currentCompany}
                  onChange={(e) => {
                    setHasManualCompanyRoleEdit(true);
                    setCurrentCompany(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  placeholder="e.g. ABC Technologies"
                />
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Current Role</label>
                <input
                  value={currentRole}
                  onChange={(e) => {
                    setHasManualCompanyRoleEdit(true);
                    setCurrentRole(e.target.value);
                  }}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  placeholder="e.g. Senior Backend Engineer"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Years of Experience</label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                >
                  <option>0-1 Years</option>
                  <option>1-3 Years</option>
                  <option>3-5 Years</option>
                  <option>5-8 Years</option>
                  <option>8+ Years</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Expertise Areas</label>
              <div className="flex flex-wrap gap-2">
                {SKILLS.map((skill) => {
                  const active = selectedSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleArrayValue(skill, selectedSkills, setSelectedSkills)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {skill}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Interview Types</label>
              <div className="flex flex-wrap gap-2">
                {INTERVIEW_TYPES.map((type) => {
                  const active = selectedTypes.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => toggleArrayValue(type, selectedTypes, setSelectedTypes)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'border-[#82CFF0] bg-[#EAF7FD] text-[#1F8FC2]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {type}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">Languages</label>
              <div className="flex flex-wrap gap-2">
                {LANGUAGES.map((language) => {
                  const active = selectedLanguages.includes(language);
                  return (
                    <button
                      key={language}
                      type="button"
                      onClick={() => toggleArrayValue(language, selectedLanguages, setSelectedLanguages)}
                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                        active
                          ? 'border-[#82CFF0] bg-[#EAF7FD] text-[#1F8FC2]'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {language}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Weekly Availability</label>
                <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Select Days</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABILITY_DAYS.map((day) => {
                      const active = selectedAvailabilityDays.includes(day);
                      return (
                        <button
                          key={day}
                          type="button"
                          onClick={() => toggleArrayValue(day, selectedAvailabilityDays, setSelectedAvailabilityDays)}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>

                  <p className="pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500">Select Slots</p>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABILITY_SLOT_OPTIONS.map((slot) => {
                      const active = selectedAvailabilitySlots.includes(slot);
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() =>
                            toggleArrayValue(slot, selectedAvailabilitySlots, setSelectedAvailabilitySlots)
                          }
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                            active
                              ? 'border-[#82CFF0] bg-[#EAF7FD] text-[#1F8FC2]'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {slot}
                        </button>
                      );
                    })}
                  </div>

                  <p className="text-xs text-slate-600">
                    {weeklyAvailabilitySummary || 'Select at least one day and one slot.'}
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Interview Price (tokens per interview)</label>
              <input
                type="number"
                min={5}
                max={500}
                value={interviewPrice}
                onChange={(e) => setInterviewPrice(Number(e.target.value))}
                className="w-full max-w-xs rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
              />
              <p className="mt-1 text-xs text-slate-500">
                Candidates see this price on your card. They pay only after you accept and they confirm.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">About Yourself</label>
              <WritingAssistField
                value={motivation}
                onChange={(next) => setMotivation(next.slice(0, 1000))}
                className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="Brief bio and interview strengths..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Feedback Style</label>
              <WritingAssistField
                value={feedbackStyle}
                onChange={(next) => setFeedbackStyle(next.slice(0, 500))}
                className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="Explain scoring and actionable feedback approach..."
              />
            </div>

            <div className="rounded-xl border border-[#BFE7F8] bg-[#F4FBFF] p-3 text-sm text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-[#1F8FC2]">
                <Sparkles className="h-4 w-4" />
                Quality guidelines
              </div>
              <p className="mt-1">Use clear communication, structured feedback, and role-specific improvement steps.</p>
            </div>

            {formError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{formError}</p>
            ) : null}
            {saveMessage ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                {saveMessage}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !kycVerified}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {existingApplication?.status === 'REJECTED'
                ? 'Send for re-verification'
                : interviewerProfile || existingApplication
                  ? 'Save Profile Changes'
                  : 'Submit Interviewer Application'}
            </button>
            {submitValidationMessage ? (
              <p className="text-xs text-slate-500">
                Pending: {submitValidationMessage}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {hubTab === 'candidates' && (interviewerProfile || existingApplication) ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Inbox</h3>
          <p className="mt-1 text-sm text-slate-600">
            People who asked for a mock interview — accept or propose a slot.
          </p>
          {queueActionMessage ? (
            <p className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {queueActionMessage}
            </p>
          ) : null}
          {formError ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {formError}
            </p>
          ) : null}
          {queueQuery.isLoading ? (
            <p className="mt-3 text-sm text-slate-600">Loading requests...</p>
          ) : queueQuery.isError ? (
            <p className="mt-3 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm text-rose-700">
              Unable to load candidates right now. Please try again.
            </p>
          ) : openQueueItems.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              No interview candidates available right now.
            </p>
          ) : (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {openQueueItems.map((item) => (
                <div key={item.id} className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {getInterviewerQueueBadge(item) ? (
                    <span
                      className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getInterviewerQueueBadge(item)?.className}`}
                    >
                      {getInterviewerQueueBadge(item)?.text}
                    </span>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{item.requestId} · {item.statusLabel}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQueueDecision(item.id, 'ACCEPT')}
                        disabled={actionLoadingId === item.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {actionLoadingId === item.id
                          ? 'Updating...'
                          : item.status === 'ACCEPTED'
                            ? 'Re-propose Slot'
                            : item.status === 'WAITING_FOR_ACCEPTANCE' && item.paymentHeldAt
                              ? 'Confirm new slot'
                              : 'Accept'}
                      </button>
                      {item.interviewerId ? (
                        <button
                          type="button"
                          onClick={() => handleQueueDecision(item.id, 'REJECT')}
                          disabled={actionLoadingId === item.id}
                          className="rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 disabled:opacity-60"
                        >
                          {actionLoadingId === item.id ? 'Updating...' : 'Reject'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                  <p className="mt-1 text-xs text-slate-700">
                    Candidate: {item.candidateProfile?.fullName || item.candidateId} · Role: {item.targetRole || 'N/A'}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Skills: {item.techStack.join(', ')} · Experience: {item.experience} · Language: {item.language}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    Requested: {item.interviewType} · {item.duration} mins · {item.interviewPrice || 50} tokens
                  </p>
                  {item.candidateProposedSlot || item.proposedSlot ? (
                    <div className="mt-2 rounded-lg border border-orange-200 bg-orange-50 px-2.5 py-2 text-xs text-orange-900">
                      <p className="font-semibold">
                        {item.candidateProposedSlot ? 'Candidate requested slot' : 'Proposed slot'}
                      </p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900">
                        {formatInterviewWhen({
                          status: item.status,
                          preferredDate: item.preferredDate,
                          preferredTime: item.preferredTime,
                          proposedSlot: item.candidateProposedSlot || item.proposedSlot,
                          proposedDate: item.candidateProposedDate || item.proposedDate,
                          scheduledAt: item.scheduledAt,
                        }).dateLabel}{' '}
                        · {item.candidateProposedSlot || item.proposedSlot}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-1 text-xs text-slate-600">
                      Original windows: {(item.preferredTime || []).join(', ') || 'N/A'}
                    </p>
                  )}
                  <div className="mt-2">
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Proposed slot to candidate
                    </p>
                    <button
                      type="button"
                      onClick={() => setRescheduleRequestId(item.id)}
                      className="rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600"
                    >
                      Propose date & time
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-slate-600">Notes: {item.notes || 'N/A'}</p>
                  {item.candidateResume?.fileUrl ? (
                    <a
                      href={item.candidateResume.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-block text-xs font-semibold text-[#1F8FC2] underline"
                    >
                      View Candidate Resume
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {hubTab === 'candidates' && !(interviewerProfile || existingApplication) ? (
        <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
          Submit your application first, then candidates will appear here.
        </p>
      ) : null}

      {hubTab === 'active' && (interviewerProfile || existingApplication) ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Active interviews</h3>
          {acceptedQueueItems.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              No scheduled interviews yet.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {acceptedQueueItems.map((item) => {
                const joinState = getJoinWindowState(item, nowTs);
                return (
                  <div key={item.id} className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
                    <p className="text-sm font-bold text-slate-900">{item.requestId} · {item.statusLabel}</p>
                    <div className="mt-2 space-y-1 text-xs">
                      <p>
                        <span className="font-semibold text-slate-900">Candidate:</span>{' '}
                        {item.candidateProfile?.fullName || item.candidateId}
                      </p>
                      <p className="text-slate-600">
                        {item.interviewType} · {item.duration} mins · {item.language} · {item.interviewPrice || 50} tokens
                      </p>
                      {(() => {
                        const when = formatInterviewWhen(item);
                        return (
                          <p className="text-slate-600">
                            Slot: {when.dateLabel} · {when.timeLabel}
                          </p>
                        );
                      })()}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            router.push(`/lms/interview-prep/interviewer-room/${item.id}`)
                          }
                          className="rounded-lg bg-[#08428c] px-3 py-1.5 text-xs font-semibold text-white"
                        >
                          Open room
                        </button>
                        <button
                          type="button"
                          onClick={() => setRescheduleRequestId(item.id)}
                          className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800"
                        >
                          Reschedule
                        </button>
                        {joinState.canJoinNow ? (
                          <button
                            type="button"
                            onClick={() => {
                              const liveUrl = buildInterviewLiveMeetingUrl(item.id, {
                                role: 'interviewer',
                                displayName: user?.name || 'Interviewer',
                              });
                              window.open(liveUrl, '_blank', 'noopener,noreferrer');
                            }}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Join interview
                          </button>
                        ) : null}
                        {joinState.joinOpensAtLabel ? (
                          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-medium text-emerald-700">
                            Join opens at {joinState.joinOpensAtLabel}
                          </span>
                        ) : null}
                        {String(item.status || '') !== 'COMPLETED' &&
                        joinState.canComplete &&
                        !hasInterviewerReviewed(item) ? (
                          <button
                            type="button"
                            onClick={() => {
                              setReviewError('');
                              setReviewRequestId(item.id);
                            }}
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                          >
                            Completed
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : null}

      {hubTab === 'completed' && (interviewerProfile || existingApplication) ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900">Completed interviews</h3>
          <p className="mt-1 text-sm text-slate-600">
            Reviews from you and the candidate appear here after the meeting ends.
          </p>
          {completedQueueItems.length === 0 ? (
            <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
              No completed interviews yet.
            </p>
          ) : (
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completedQueueItems.map((item) => (
                <div key={item.id} className="flex h-full min-w-0 flex-col rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm font-bold text-slate-900">{item.requestId} · Completed</p>
                  <p className="mt-1 text-xs text-slate-700">
                    Candidate: {item.candidateProfile?.fullName || item.candidateId}
                  </p>
                  <p className="mt-1 text-xs text-slate-600">
                    {item.interviewType} · {item.duration} mins · {item.interviewPrice || 50} tokens
                  </p>
                  <div className="mt-2 space-y-1 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs text-slate-700">
                    <p>
                      <span className="font-semibold text-slate-900">Your review:</span>{' '}
                      {hasInterviewerReviewed(item)
                        ? `${item.interviewerRating || '—'}★ · ${displayReviewText(item.interviewerFeedback) || 'Submitted'}`
                        : 'Not submitted yet'}
                    </p>
                    <p>
                      <span className="font-semibold text-slate-900">Candidate review:</span>{' '}
                      {hasCandidateReviewed(item)
                        ? `${item.candidateRating || '—'}★ · ${displayReviewText(item.candidateFeedback) || 'Submitted'}`
                        : 'Waiting for candidate'}
                    </p>
                  </div>
                  <InterviewLiveHistory requestId={item.id} />
                  {!hasInterviewerReviewed(item) ? (
                    <button
                      type="button"
                      onClick={() => {
                        setReviewError('');
                        setReviewRequestId(item.id);
                      }}
                      className="mt-2 rounded-lg bg-[#28A8E1] px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Add review
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </section>
      ) : null}

      <InterviewReviewModal
        open={Boolean(reviewTarget)}
        counterpartName={reviewTarget?.candidateProfile?.fullName || 'the candidate'}
        viewerRole="interviewer"
        submitting={reviewBusy}
        error={reviewError}
        onClose={() => {
          setReviewRequestId(null);
          setReviewError('');
        }}
        onSubmit={async ({ rating, feedback }) => {
          if (!reviewTarget) return;
          try {
            setReviewBusy(true);
            setReviewError('');
            await submitInterviewReview(reviewTarget.id, { rating, feedback });
            setReviewRequestId(null);
            await queueQuery.refetch();
          } catch (error) {
            setReviewError(error instanceof Error ? error.message : 'Unable to submit review');
          } finally {
            setReviewBusy(false);
          }
        }}
      />
      <InterviewRescheduleModal
        open={Boolean(rescheduleTarget)}
        title="Propose a new interview slot"
        subtitle="Pick a date and time. The candidate will confirm to continue."
        initialDate={
          rescheduleTarget?.candidateProposedDate ||
          rescheduleTarget?.proposedDate ||
          rescheduleTarget?.preferredDate ||
          rescheduleTarget?.scheduledAt
        }
        initialTime={
          rescheduleTarget?.candidateProposedSlot ||
          rescheduleTarget?.proposedSlot ||
          rescheduleTarget?.scheduledAt ||
          rescheduleTarget?.preferredTime?.[0]
        }
        submitting={rescheduleBusy}
        error={formError}
        onClose={() => {
          if (!rescheduleBusy) setRescheduleRequestId(null);
        }}
        onSubmit={async ({ date, time }) => {
          if (!rescheduleTarget) return;
          try {
            setRescheduleBusy(true);
            setFormError('');
            const status = String(rescheduleTarget.status || '');
            if (status === 'FINDING_INTERVIEWER' || status === 'MATCHING' || !rescheduleTarget.interviewerId) {
              await respondToInterviewRequest(rescheduleTarget.id, 'ACCEPT', time, date);
            } else {
              await scheduleInterviewSlot(rescheduleTarget.id, time, '', date);
            }
            setQueueActionMessage(`New slot sent for ${rescheduleTarget.requestId}. Waiting for candidate confirmation.`);
            setRescheduleRequestId(null);
            await queueQuery.refetch();
          } catch (error) {
            setFormError(error instanceof Error ? error.message : 'Unable to propose a new slot');
          } finally {
            setRescheduleBusy(false);
          }
        }}
      />
    </div>
  );
}
