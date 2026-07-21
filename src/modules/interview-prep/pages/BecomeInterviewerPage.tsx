'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Loader2, Sparkles, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';
import {
  getInterviewerQueue,
  getMyInterviewerApplication,
  respondToInterviewRequest,
  submitInterviewerApplication,
} from '@/lib/interviewer-api';
import { InterviewRequestsList } from '../components/InterviewRequest/InterviewRequestsList';

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

function getInterviewerQueueBadge(item: { status?: string; candidateFeedback?: string | null }) {
  const status = String(item.status || '');
  if (status === 'ACCEPTED') {
    return {
      text: 'Awaiting Candidate Confirmation',
      className: 'border border-amber-200 bg-amber-50 text-amber-800',
    };
  }
  if (
    status === 'WAITING_FOR_ACCEPTANCE' &&
    String(item.candidateFeedback || '')
      .toLowerCase()
      .includes('new slot')
  ) {
    return {
      text: 'Candidate Requested New Slot',
      className: 'border border-orange-200 bg-orange-50 text-orange-800',
    };
  }
  return null;
}

export default function BecomeInterviewerPage() {
  const router = useRouter();
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
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [resumeUrl, setResumeUrl] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [queueActionMessage, setQueueActionMessage] = useState('');
  const [proposedSlotByRequest, setProposedSlotByRequest] = useState<Record<string, string>>({});
  const [prefilledFromRejected, setPrefilledFromRejected] = useState(false);
  const [hasManualCompanyRoleEdit, setHasManualCompanyRoleEdit] = useState(false);

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
  const queue = useMemo(() => queueQuery.data ?? [], [queueQuery.data]);
  const openQueueItems = useMemo(
    () =>
      queue.filter((item) =>
        ['FINDING_INTERVIEWER', 'MATCHING', 'WAITING_FOR_ACCEPTANCE', 'ACCEPTED'].includes(String(item.status || ''))
      ),
    [queue]
  );
  const acceptedQueueItems = useMemo(
    () =>
      queue.filter((item) =>
        ['SCHEDULED', 'IN_PROGRESS'].includes(String(item.status || ''))
      ),
    [queue]
  );

  useEffect(() => {
    if (prefilledFromRejected) return;
    if (!existingApplication || existingApplication.status !== 'REJECTED') return;
    setName(String(existingApplication.fullName || ''));
    if (!hasManualCompanyRoleEdit) {
      setCurrentCompany(String(existingApplication.currentCompany || ''));
      setCurrentRole(String(existingApplication.currentRole || ''));
    }
    setExperience(
      existingApplication.yearsOfExperience >= 8
        ? '8+ Years'
        : existingApplication.yearsOfExperience >= 5
          ? '5-8 Years'
          : existingApplication.yearsOfExperience >= 3
            ? '3-5 Years'
            : existingApplication.yearsOfExperience >= 1
              ? '1-3 Years'
              : '0-1 Years'
    );
    setSelectedSkills(Array.isArray(existingApplication.expertiseAreas) ? existingApplication.expertiseAreas : []);
    setSelectedTypes(Array.isArray(existingApplication.interviewTypes) ? existingApplication.interviewTypes : []);
    setSelectedLanguages(Array.isArray(existingApplication.languages) ? existingApplication.languages : []);
    setMotivation(String(existingApplication.aboutYourself || ''));
    setFeedbackStyle(String(existingApplication.feedbackStyle || ''));
    setLinkedinUrl(String(existingApplication.linkedinUrl || ''));
    setResumeUrl(String(existingApplication.resumeUrl || ''));
    setPrefilledFromRejected(true);
  }, [existingApplication, hasManualCompanyRoleEdit, prefilledFromRejected]);
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
    if (submitValidationMessage) {
      setFormError(submitValidationMessage);
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await submitInterviewerApplication({
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
        linkedinUrl: linkedinUrl.trim(),
        resumeUrl: resumeUrl.trim(),
      });
      await profileQuery.refetch();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'Unable to submit application');
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
        decision === 'ACCEPT' ? proposedSlotByRequest[requestId] : undefined
      );
      queryClient.setQueryData(['interviewer-queue'], (previous: unknown) => {
        if (!Array.isArray(previous)) return previous;
        return previous.map((item) =>
          item && typeof item === 'object' && (item as { id?: string }).id === requestId
            ? { ...(item as Record<string, unknown>), ...updated }
            : item
        );
      });
      setQueueActionMessage(
        decision === 'ACCEPT'
          ? `Accepted ${updated.requestId || 'request'} successfully. Waiting for candidate confirmation.`
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
            <h1 className="mt-0.5 text-lg font-bold text-slate-900">Become an Interviewer</h1>
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
        ) : interviewerProfile ? (
          <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <CheckCircle2 className="h-5 w-5" />
              <p className="font-semibold">Interviewer profile is active</p>
            </div>
            <p className="mt-1 text-sm text-emerald-700">
              Status: {interviewerProfile.status} • Rating: {interviewerProfile.ratingAverage.toFixed(1)} • Interviews: {interviewerProfile.totalInterviews}
            </p>
          </div>
        ) : existingApplication && existingApplication.status !== 'REJECTED' ? (
          <div className="mt-4 rounded-lg border border-sky-200 bg-sky-50 p-3">
            <p className="text-xs font-semibold text-sky-800">Application status: {existingApplication.statusLabel}</p>
            <p className="mt-0.5 text-xs text-sky-700">
              You can start picking interview candidates below.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {existingApplication?.status === 'REJECTED' ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-semibold text-amber-800">
                  Previous application was rejected. Update details and resubmit.
                </p>
                {existingApplication.reviewNotes ? (
                  <p className="mt-1 text-sm text-amber-700">{existingApplication.reviewNotes}</p>
                ) : null}
              </div>
            ) : null}
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
              <div>
                <label className="mb-1 block text-sm font-semibold text-slate-700">Resume / LinkedIn</label>
                <div className="grid gap-2">
                  <input
                    value={resumeUrl}
                    onChange={(e) => setResumeUrl(e.target.value)}
                    placeholder="Resume URL (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  />
                  <input
                    value={linkedinUrl}
                    onChange={(e) => setLinkedinUrl(e.target.value)}
                    placeholder="LinkedIn URL (optional)"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">About Yourself</label>
              <textarea
                value={motivation}
                onChange={(e) => setMotivation(e.target.value.slice(0, 1000))}
                className="h-24 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-emerald-400"
                placeholder="Brief bio and interview strengths..."
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-slate-700">Feedback Style</label>
              <textarea
                value={feedbackStyle}
                onChange={(e) => setFeedbackStyle(e.target.value.slice(0, 500))}
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

            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Submit Interviewer Application
            </button>
            {submitValidationMessage ? (
              <p className="text-xs text-slate-500">
                Pending: {submitValidationMessage}
              </p>
            ) : null}
          </div>
        )}
      </section>

      <InterviewRequestsList
        title="Interview Requests (Your Candidate View)"
        subtitle="These are requests submitted by you as a candidate."
      />

      {interviewerProfile || existingApplication ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-bold text-slate-900">Interview Candidates</h3>
          <p className="mt-1 text-sm text-slate-600">Review candidate details, propose a slot, and accept requests.</p>
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
            <div className="mt-4 space-y-3">
              {openQueueItems.map((item) => (
                <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  {getInterviewerQueueBadge(item) ? (
                    <span
                      className={`mb-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getInterviewerQueueBadge(item)?.className}`}
                    >
                      {getInterviewerQueueBadge(item)?.text}
                    </span>
                  ) : null}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-900">{item.requestId} • {item.statusLabel}</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQueueDecision(item.id, 'ACCEPT')}
                        disabled={actionLoadingId === item.id}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                      >
                        {actionLoadingId === item.id ? 'Updating...' : item.status === 'ACCEPTED' ? 'Re-propose Slot' : 'Accept'}
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
                  <p className="mt-1 text-sm text-slate-700">
                    Candidate: {item.candidateProfile?.fullName || item.candidateId} • Role: {item.targetRole || 'N/A'}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Skills: {item.techStack.join(', ')} • Experience: {item.experience} • Language: {item.language}
                  </p>
                  <p className="mt-1 text-sm text-slate-600">
                    Requested: {item.interviewType} • {item.preferredTime.join(', ')} • {item.duration} mins
                  </p>
                  <div className="mt-2">
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Proposed slot to candidate
                    </label>
                    <select
                      value={proposedSlotByRequest[item.id] ?? item.preferredTime?.[0] ?? ''}
                      onChange={(event) =>
                        setProposedSlotByRequest((prev) => ({ ...prev, [item.id]: event.target.value }))
                      }
                      className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none focus:border-emerald-400"
                    >
                      {(item.preferredTime || []).map((slot) => (
                        <option key={`${item.id}-${slot}`} value={slot}>
                          {slot}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="mt-1 text-sm text-slate-600">Notes: {item.notes || 'N/A'}</p>
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

          <div className="mt-6 border-t border-slate-100 pt-4">
            <h4 className="text-base font-semibold text-slate-900">Accepted Interviews</h4>
            <p className="mt-1 text-sm text-slate-600">Requests you accepted are shown here.</p>
            {queueQuery.isLoading ? (
              <p className="mt-3 text-sm text-slate-600">Loading accepted interviews...</p>
            ) : acceptedQueueItems.length === 0 ? (
              <p className="mt-3 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-600">
                No accepted interviews yet.
              </p>
            ) : (
              <div className="mt-3 grid gap-2.5 md:grid-cols-2">
                {acceptedQueueItems.map((item) => (
                  <div
                    key={item.id}
                    className="w-full max-w-md rounded-xl border border-emerald-200 bg-linear-to-br from-emerald-50 via-white to-cyan-50 p-3 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-1.5">
                      <p className="text-base font-bold text-emerald-800">{item.requestId}</p>
                      <span className="rounded-full border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                        {item.statusLabel}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1 text-xs">
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">Candidate:</span>{' '}
                        {item.candidateProfile?.fullName || item.candidateId}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">Role:</span> {item.targetRole || 'N/A'}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">Interview:</span> {item.interviewType}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold text-slate-900">Duration:</span> {item.duration} mins
                      </p>
                    </div>

                    <div className="mt-2">
                      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Confirmed Time Slots
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(item.preferredTime || []).map((slot) => (
                          <span
                            key={`${item.id}-${slot}`}
                            className="rounded-full border border-cyan-200 bg-cyan-50 px-2 py-0.5 text-[10px] font-semibold text-cyan-800"
                          >
                            {slot}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="mt-2 rounded-lg border border-slate-200 bg-white p-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                        Final Scheduling Status
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-600">
                        Candidate must accept the proposed final slot before schedule is locked.
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          onClick={() => router.push(`/lms/interview-prep/interviewer-room/${item.id}`)}
                          className="rounded-md border border-cyan-200 bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold text-cyan-800"
                        >
                          Open Interview Room
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      ) : null}

    </div>
  );
}
