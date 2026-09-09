'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import type { CareerAssessment, CareerExperienceLevel } from '../types';
import { LMS_INPUT_CLASS } from '@/app/lms/constants';
import { WritingAssistField } from '@/components/common/WritingSuggestions';
import { useAuth } from '@/components/auth/AuthContext';
import { getApiBaseUrl } from '@/lib/api-base';
import { getAuthHeaders } from '@/lib/auth-storage';
import { buildCareerAssessmentFromProfile } from '../lib/prefillCareerAssessmentFromProfile';

const LEVELS: CareerExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

const EMPTY_FORM: CareerAssessment = {
  aboutMe: '',
  education: '',
  currentSkills: '',
  experienceLevel: 'Beginner',
  interestedField: '',
  careerGoal: '',
  hoursPerDay: '2',
  targetRole: '',
};

type Props = {
  submitting: boolean;
  onSubmit: (assessment: CareerAssessment) => void;
  onCancel: () => void;
};

export function CareerAssessmentView({ submitting, onSubmit, onCancel }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<CareerAssessment>(EMPTY_FORM);
  const [prefilled, setPrefilled] = useState(false);
  const [autofillBusy, setAutofillBusy] = useState(false);
  const [autofillMessage, setAutofillMessage] = useState('');

  const profileQuery = useQuery({
    queryKey: ['phase1-profile-for-career-assessment', user?.id],
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

  const set = <K extends keyof CareerAssessment>(key: K, value: CareerAssessment[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const applyPrefill = (
    draft: Partial<CareerAssessment>,
    mode: 'gap-fill' | 'replace',
  ) => {
    setForm((prev) => {
      const next = { ...prev };
      (Object.keys(draft) as Array<keyof CareerAssessment>).forEach((key) => {
        const value = draft[key];
        if (value == null || value === '') return;
        if (mode === 'replace') {
          next[key] = value as never;
          return;
        }
        if (key === 'experienceLevel') {
          if (prev.experienceLevel === 'Beginner') next.experienceLevel = value as CareerExperienceLevel;
          return;
        }
        if (!String(prev[key] || '').trim()) {
          next[key] = value as never;
        }
      });
      return next;
    });
  };

  useEffect(() => {
    if (prefilled || !profileQuery.data) return;
    const draft = buildCareerAssessmentFromProfile(profileQuery.data);
    if (!draft) return;
    applyPrefill(draft, 'gap-fill');
    setPrefilled(true);
    setAutofillMessage('Form autofilled from your profile. You can edit anything before analyzing.');
  }, [prefilled, profileQuery.data]);

  const handleAutofillFromProfile = async () => {
    if (!user?.id) {
      setAutofillMessage('Sign in to autofill from your profile.');
      return;
    }
    setAutofillBusy(true);
    setAutofillMessage('');
    try {
      let profile = profileQuery.data;
      if (!profile) {
        const refreshed = await profileQuery.refetch();
        profile = refreshed.data || null;
      }
      if (!profile) {
        setAutofillMessage('Could not load your profile. Complete your profile and try again.');
        return;
      }
      const draft = buildCareerAssessmentFromProfile(profile);
      if (!draft) {
        setAutofillMessage('No usable profile data found to autofill.');
        return;
      }
      applyPrefill(draft, 'replace');
      setPrefilled(true);
      setAutofillMessage('Form autofilled from your profile. Review and edit before analyzing.');
    } catch (error) {
      setAutofillMessage(
        error instanceof Error ? error.message : 'Unable to autofill from profile right now.',
      );
    } finally {
      setAutofillBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-[#2098C8]">Step 1 · Career assessment</p>
          <h2 className="mt-1 text-xl font-bold text-gray-900">Tell AI about your career starting point</h2>
          <p className="mt-1 text-sm text-gray-600">
            We use this profile to generate your personalized roadmap, gap analysis, and milestones.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleAutofillFromProfile();
          }}
          disabled={autofillBusy || !user?.id || profileQuery.isLoading}
          className="inline-flex items-center gap-2 rounded-xl border border-[#BFE7F8] bg-white px-3 py-2 text-xs font-semibold text-[#1F8FC2] transition hover:bg-[#F4FBFF] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {autofillBusy || profileQuery.isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          {autofillBusy ? 'Autofilling…' : 'Autofill from profile'}
        </button>
      </div>

      {autofillMessage ? (
        <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-800">
          {autofillMessage}
        </p>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">About me</span>
          <WritingAssistField
            rows={3}
            className={`${LMS_INPUT_CLASS} resize-y`}
            value={form.aboutMe}
            onChange={(next) => set('aboutMe', next)}
            placeholder="Brief background, strengths, and what motivates you..."
          />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Current education</span>
          <input className={LMS_INPUT_CLASS} value={form.education} onChange={(e) => set('education', e.target.value)} placeholder="B.Tech CS, Bootcamp, Self-taught..." />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Experience level</span>
          <select className={LMS_INPUT_CLASS} value={form.experienceLevel} onChange={(e) => set('experienceLevel', e.target.value as CareerExperienceLevel)}>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </label>

        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Current skills</span>
          <input className={LMS_INPUT_CLASS} value={form.currentSkills} onChange={(e) => set('currentSkills', e.target.value)} placeholder="Python, React, SQL, Git..." />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Interested field</span>
          <input className={LMS_INPUT_CLASS} value={form.interestedField} onChange={(e) => set('interestedField', e.target.value)} placeholder="AI, Web Development, Data..." />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Learning time per day</span>
          <select className={LMS_INPUT_CLASS} value={form.hoursPerDay} onChange={(e) => set('hoursPerDay', e.target.value)}>
            <option value="1">1 hour / day</option>
            <option value="2">2 hours / day</option>
            <option value="3">3 hours / day</option>
            <option value="4">4+ hours / day</option>
          </select>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Career goal</span>
          <input className={LMS_INPUT_CLASS} value={form.careerGoal} onChange={(e) => set('careerGoal', e.target.value)} placeholder="Become AI Engineer" />
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">Target job role</span>
          <input className={LMS_INPUT_CLASS} value={form.targetRole} onChange={(e) => set('targetRole', e.target.value)} placeholder="Junior AI Engineer" />
        </label>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onCancel} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Cancel
        </button>
        <button
          type="button"
          disabled={submitting || !form.careerGoal.trim()}
          onClick={() => onSubmit({ ...form, targetRole: form.targetRole || form.careerGoal })}
          className="inline-flex items-center gap-2 rounded-xl bg-[#2098C8] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analyze & generate roadmap
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
