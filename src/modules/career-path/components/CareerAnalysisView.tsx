'use client';

import { ArrowRight, CheckCircle2, Target } from 'lucide-react';
import type { CareerJourney } from '../types';
import { LMS_CARD_CLASS } from '@/app/lms/constants';

type Props = {
  journey: CareerJourney;
  onConfirm: () => void;
  onBack: () => void;
};

export function CareerAnalysisView({ journey, onConfirm, onBack }: Props) {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wide text-violet-600">Step 2 · AI career analysis</p>
        <h2 className="mt-1 text-xl font-bold text-gray-900">Career readiness report</h2>
        <p className="mt-1 text-sm text-gray-600">Review where you are, where you need to go, and what is missing before starting your journey.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`${LMS_CARD_CLASS} lg:col-span-2`}>
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Your current level</p>
              <p className="text-lg font-bold text-gray-900">{journey.readinessLevel}</p>
              <p className="mt-2 text-sm text-gray-600">
                Target: <span className="font-semibold text-gray-900">{journey.targetRole}</span>
              </p>
              <p className="mt-1 text-sm text-gray-500">{journey.assessment.aboutMe || journey.assessment.education || 'Profile captured from your assessment.'}</p>
            </div>
          </div>
        </div>

        <div className={`${LMS_CARD_CLASS} bg-gradient-to-br from-[#28A8E1]/10 to-white`}>
          <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Expected completion</p>
          <p className="mt-1 text-3xl font-bold text-gray-900">{journey.expectedCompletionMonths} mo</p>
          <p className="mt-2 text-sm text-gray-600">At {journey.assessment.hoursPerDay} hour(s)/day learning pace</p>
          <p className="mt-3 text-sm font-semibold text-[#28A8E1]">Job readiness preview: {journey.jobReadinessScore}%</p>
        </div>
      </div>

      <div className={`${LMS_CARD_CLASS}`}>
        <h3 className="text-base font-bold text-gray-900">Gap analysis — skills you need to improve</h3>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {journey.gaps.map((gap) => (
            <li key={gap.skill} className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-3 py-2 text-sm">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
              <span className="font-medium text-gray-800">{gap.skill}</span>
              <span className="ml-auto text-[10px] font-bold uppercase text-gray-400">{gap.priority}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className={`${LMS_CARD_CLASS}`}>
        <h3 className="text-base font-bold text-gray-900">AI-generated roadmap preview</h3>
        <div className="mt-4 space-y-3">
          {journey.milestones.map((m, index) => (
            <div key={m.id} className="flex gap-3">
              <div className="flex flex-col items-center">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#28A8E1] text-xs font-bold text-white">{index + 1}</div>
                {index < journey.milestones.length - 1 ? <div className="mt-1 w-px flex-1 bg-gray-200" /> : null}
              </div>
              <div className="pb-4">
                <p className="text-sm font-bold text-gray-900">{m.phaseLabel}: {m.title}</p>
                <p className="text-xs text-gray-500">Duration ~{m.durationMonths} months · {m.skills.join(', ')}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button type="button" onClick={onBack} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50">
          Edit assessment
        </button>
        <button type="button" onClick={onConfirm} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95">
          Start my career journey
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
