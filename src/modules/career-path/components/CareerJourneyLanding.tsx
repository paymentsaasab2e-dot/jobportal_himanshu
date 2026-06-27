'use client';

import { ArrowRight, Plus, Route, Sparkles } from 'lucide-react';
import { LMS_CARD_CLASS } from '@/app/lms/constants';

type Props = {
  onCreate: () => void;
  onContinue?: () => void;
  hasDraft?: boolean;
};

export function CareerJourneyLanding({ onCreate, onContinue, hasDraft }: Props) {
  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-8 text-center shadow-sm">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#28A8E1]/10 text-[#28A8E1] ring-4 ring-[#28A8E1]/10">
          <Route className="h-8 w-8" />
        </div>
        <h2 className="mt-5 text-2xl font-bold text-gray-900">My Career Journey</h2>
        <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">
          Create a personalized AI career roadmap with milestones, skill tracking, projects, certifications, and an in-app mentor — your personal career coach inside the LMS.
        </p>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <button type="button" onClick={onCreate} className={`${LMS_CARD_CLASS} text-left transition hover:border-[#28A8E1]/40 hover:shadow-md`}>
          <Plus className="h-6 w-6 text-[#28A8E1]" />
          <p className="mt-3 font-bold text-gray-900">Create new career path</p>
          <p className="mt-1 text-sm text-gray-600">Complete a short assessment and get an AI-generated roadmap.</p>
        </button>

        {hasDraft && onContinue ? (
          <button type="button" onClick={onContinue} className={`${LMS_CARD_CLASS} text-left transition hover:border-emerald-200 hover:shadow-md`}>
            <ArrowRight className="h-6 w-6 text-emerald-600" />
            <p className="mt-3 font-bold text-gray-900">Continue existing path</p>
            <p className="mt-1 text-sm text-gray-600">Review your saved career journey and milestones.</p>
          </button>
        ) : (
          <div className={`${LMS_CARD_CLASS} opacity-60`}>
            <ArrowRight className="h-6 w-6 text-gray-400" />
            <p className="mt-3 font-bold text-gray-900">Continue existing path</p>
            <p className="mt-1 text-sm text-gray-600">Available after you create your first journey.</p>
          </div>
        )}

        <button type="button" onClick={onCreate} className={`${LMS_CARD_CLASS} text-left transition hover:border-violet-200 hover:shadow-md`}>
          <Sparkles className="h-6 w-6 text-violet-600" />
          <p className="mt-3 font-bold text-gray-900">Improve my path with AI</p>
          <p className="mt-1 text-sm text-gray-600">Start a path first, then refine your goal anytime with AI.</p>
        </button>
      </div>
    </div>
  );
}
