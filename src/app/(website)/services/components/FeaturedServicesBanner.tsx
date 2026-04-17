'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Compass, Sparkles } from 'lucide-react';
import { SVC_PRIMARY_BTN, SVC_SECONDARY_BTN } from '../constants';

export default function FeaturedServicesBanner() {
  const router = useRouter();

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#28A8E1]/[0.08] via-violet-500/[0.06] to-amber-400/[0.06] border border-[#28A8E1]/15 p-6 sm:p-8">
      {/* Subtle glow */}
      <div className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#28A8E1]/10 blur-3xl" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white border border-gray-200/80 shadow-sm">
          <Compass className="h-7 w-7 text-[#28A8E1]" strokeWidth={1.8} />
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-gray-900">Build your job-readiness journey</h3>
            <Sparkles className="h-4 w-4 text-amber-500 shrink-0" />
          </div>
          <p className="text-sm text-gray-600 font-normal leading-relaxed max-w-2xl">
            From resume improvement to interview preparation and skill growth — follow a guided path
            that takes you from where you are to where you want to be.
          </p>
        </div>

        <div className="flex flex-wrap gap-3 shrink-0">
          <button
            type="button"
            onClick={() => {
              const grid = document.getElementById('services-grid');
              grid?.scrollIntoView({ behavior: 'smooth' });
            }}
            className={SVC_PRIMARY_BTN}
          >
            Get Recommendations
            <ArrowRight className="ml-1.5 h-4 w-4" strokeWidth={2} />
          </button>
          <button
            type="button"
            onClick={() => router.push('/services/ai-resume-review')}
            className={SVC_SECONDARY_BTN}
          >
            Start with Resume Review
          </button>
        </div>
      </div>
    </section>
  );
}
