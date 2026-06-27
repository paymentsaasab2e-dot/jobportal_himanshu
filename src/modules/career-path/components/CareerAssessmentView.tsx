'use client';

import { useState } from 'react';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import type { CareerAssessment, CareerExperienceLevel } from '../types';
import { LMS_INPUT_CLASS } from '@/app/lms/constants';

const LEVELS: CareerExperienceLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

type Props = {
  submitting: boolean;
  onSubmit: (assessment: CareerAssessment) => void;
  onCancel: () => void;
};

export function CareerAssessmentView({ submitting, onSubmit, onCancel }: Props) {
  const [form, setForm] = useState<CareerAssessment>({
    aboutMe: '',
    education: '',
    currentSkills: '',
    experienceLevel: 'Beginner',
    interestedField: '',
    careerGoal: '',
    hoursPerDay: '2',
    targetRole: '',
  });

  const set = <K extends keyof CareerAssessment>(key: K, value: CareerAssessment[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-[#28A8E1]">Step 1 · Career assessment</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">Tell AI about your career starting point</h2>
        <p className="mt-1 text-sm text-gray-600">
          We use this profile to generate your personalized roadmap, gap analysis, and milestones.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block md:col-span-2">
          <span className="mb-1.5 block text-sm font-semibold text-gray-800">About me</span>
          <textarea
            rows={3}
            className={`${LMS_INPUT_CLASS} resize-y`}
            value={form.aboutMe}
            onChange={(e) => set('aboutMe', e.target.value)}
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
          className="inline-flex items-center gap-2 rounded-xl bg-[#28A8E1] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          Analyze & generate roadmap
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
